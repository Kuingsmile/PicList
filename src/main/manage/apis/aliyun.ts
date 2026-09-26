import OSS from 'ali-oss'
import axios from 'axios'
import * as fastxml from 'fast-xml-parser'

import type { DeleteResult } from '#/deletion'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import {
  ConcurrencyPromisePool,
  createDownloadTask,
  formatError,
  getFileMimeType,
  hmacSha1Base64,
  NewDownloader,
} from '~/manage/utils/common'
import {
  deleteInBatches,
  deleteListedFolder,
  deletionError,
  failedKeys,
  keyedDeleteResult,
  nextDeleteMarker,
} from '~/manage/utils/deleteObjects'
import { ManageLogger } from '~/manage/utils/logger'
import { MIB, onUploadAbort, scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/common'

// 坑爹阿里云 返回数据类型标注和实际各种不一致
class AliyunApi {
  ctx: OSS
  accessKeyId: string
  accessKeySecret: string
  timeOut = 30000
  logger: ManageLogger

  constructor(accessKeyId: string, accessKeySecret: string, logger: ManageLogger) {
    this.ctx = new OSS({
      accessKeyId,
      accessKeySecret,
      secure: true,
    })
    this.accessKeyId = accessKeyId
    this.accessKeySecret = accessKeySecret
    this.logger = logger
  }

  formatFolder(item: string, slicedPrefix: string, urlPrefix: string): any {
    return {
      key: item,
      url: `${urlPrefix}/${item}`,
      fileSize: 0,
      formatedTime: '',
      fileName: item.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      Key: item,
    }
  }

  formatFile(item: OSS.ObjectMeta, slicedPrefix: string, urlPrefix: string): any {
    const fileName = item.name.replace(slicedPrefix, '')
    return {
      ...item,
      key: item.name,
      fileName,
      fileSize: item.size,
      formatedTime: new Date(item.lastModified).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName),
      rawUrl: item.url,
      url: `${urlPrefix}/${item.name}`,
    }
  }

  getCanonicalizedOSSHeaders(headers: IStringKeyMap) {
    const lowerCaseHeaders = Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = headers[key]
      return acc
    }, {} as IStringKeyMap)
    let canonicalizedOSSHeaders = ''
    const headerKeys = Object.keys(lowerCaseHeaders).sort()
    headerKeys.forEach(key => {
      key.startsWith('x-oss-') && (canonicalizedOSSHeaders += `${key}:${lowerCaseHeaders[key]}\n`)
    })
    return canonicalizedOSSHeaders
  }

  authorization(
    method: string,
    canonicalizedResource: string,
    headers: IStringKeyMap,
    contentMd5: string,
    contentType: string,
  ) {
    const date = new Date().toUTCString()
    const stringToSign = `${method.toUpperCase()}\n${contentMd5}\n${contentType}\n${date}\n${this.getCanonicalizedOSSHeaders(headers)}${canonicalizedResource}`
    return `OSS ${this.accessKeyId}:${hmacSha1Base64(this.accessKeySecret, stringToSign)}`
  }

  getNewCtx(region: string, bucket: string) {
    return new OSS({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region,
      bucket,
      secure: true,
    })
  }

  /**
   * 获取存储桶列表
   */
  async getBucketList(): Promise<any> {
    const getBuckets = async (marker?: string) => {
      const res = (await this.ctx.listBuckets({
        marker,
        'max-keys': 1000,
      })) as IStringKeyMap
      if (res?.res?.statusCode !== 200 || !res?.buckets) return { result: [], isTruncated: false }
      const formattedBuckets = res.buckets.map((item: OSS.Bucket) => ({
        Name: item.name,
        Location: item.region,
        CreationDate: item.creationDate,
      }))
      return {
        result: formattedBuckets,
        isTruncated: res.isTruncated,
        nextMarker: res.nextMarker,
      }
    }
    const result: IStringKeyMap[] = []
    let NextMarker: string | undefined
    let isTruncated: boolean
    do {
      const { result: buckets, isTruncated: truncated, nextMarker } = await getBuckets(NextMarker)
      result.push(...buckets)
      NextMarker = nextMarker
      isTruncated = truncated
    } while (isTruncated)

    return result
  }

  /**
   * 获取自定义域名
   */
  async getBucketDomain(param: IStringKeyMap): Promise<any> {
    const headers = {
      Date: new Date().toUTCString(),
    }
    const authorization = this.authorization('GET', `/${param.bucketName}/?cname`, headers, '', '')

    const res = await axios({
      url: `https://${param.bucketName}.${param.region}.aliyuncs.com/?cname`,
      method: 'GET',
      headers: {
        ...headers,
        Authorization: authorization,
      },
    })

    if (res?.status === 200) {
      const parser = new fastxml.XMLParser()
      const result = parser.parse(res.data)

      if (result.ListCnameResult?.Cname) {
        const cnames = Array.isArray(result.ListCnameResult.Cname)
          ? result.ListCnameResult.Cname
          : [result.ListCnameResult.Cname]

        return cnames
          .filter((item: IStringKeyMap) => item.Status === 'Enabled')
          .map((item: IStringKeyMap) => item.Domain)
      }
    }
    return []
  }

  /**
   * 创建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: string
   * }
   * @description
   * acl: private | publicRead | publicReadWrite
   */
  async createBucket(configMap: IStringKeyMap): Promise<boolean> {
    const client = new OSS({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region: configMap.region,
      secure: true,
    })
    const aclTransMap: IStringKeyMap = {
      private: 'private',
      publicRead: 'public-read',
      publicReadWrite: 'public-read-write',
    }
    const res = await client.putBucket(configMap.BucketName, {
      acl: aclTransMap[configMap.acl],
      storageClass: 'Standard',
      dataRedundancyType: 'LRS',
      timeout: this.timeOut,
    })
    return res?.res?.status === 200
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
    } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`
    let marker: string | undefined
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    const client = this.getNewCtx(region, bucket)
    do {
      res = await listing.wait(() =>
        client.listV2(
          {
            prefix: slicedPrefix === '' ? undefined : slicedPrefix,
            'max-keys': '1000',
            'continuation-token': marker,
          },
          {
            timeout: this.timeOut,
          },
        ),
      )
      if (res?.res?.statusCode === 200) {
        res?.objects?.forEach((item: OSS.ObjectMeta) => {
          !item.name.endsWith('/') && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
      marker = res.nextContinuationToken
    } while (res.isTruncated === true && !listing.signal.aborted)
    result.success = !listing.signal.aborted
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
    } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`
    let marker: string | undefined
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    const client = this.getNewCtx(region, bucket)
    do {
      res = await listing.wait(() =>
        client.listV2(
          {
            prefix: slicedPrefix === '' ? undefined : slicedPrefix,
            delimiter: '/',
            'max-keys': '1000',
            'continuation-token': marker,
          },
          {
            timeout: this.timeOut,
          },
        ),
      )
      if (res?.res?.statusCode === 200) {
        res?.prefixes?.forEach((item: string) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix))
        })
        res?.objects?.forEach((item: OSS.ObjectMeta) => {
          !item.name.endsWith('/') && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
      marker = res.nextContinuationToken
    } while (res.isTruncated === true && !listing.signal.aborted)
    result.success = !listing.signal.aborted
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  /**
   * 获取文件列表
   * @param {Object} configMap
   * configMap = {
   *  bucketName: string,
   *  bucketConfig: {
   *   Location: string
   * },
   *  paging: boolean,
   *  prefix: string,
   *  marker: string,
   *  itemsPerPage: number,
   *  customUrl: string
   * }
   */
  async getBucketFileList(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      marker,
      itemsPerPage,
    } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`

    const client = this.getNewCtx(region, bucket)
    const res = (await listing.wait(() =>
      client.listV2(
        {
          prefix: slicedPrefix || undefined,
          delimiter: '/',
          'max-keys': itemsPerPage.toString(),
          'continuation-token': marker,
        },
        {
          timeout: this.timeOut,
        },
      ),
    )) as any
    // prefixes can be null
    // objects will be [] when no file
    if (res?.res.statusCode !== 200) {
      return {
        fullList: [],
        isTruncated: false,
        nextMarker: '',
        success: false,
      }
    }
    const fullList = [
      ...(res.prefixes?.map((item: string) => this.formatFolder(item, slicedPrefix, urlPrefix)) || []),
      ...(res.objects
        ?.filter((item: OSS.ObjectMeta) => !item.name.endsWith('/'))
        .map((item: OSS.ObjectMeta) => this.formatFile(item, slicedPrefix, urlPrefix)) || []),
    ]
    return {
      fullList,
      isTruncated: res.isTruncated,
      nextMarker: res.nextContinuationToken || '',
      success: true,
    }
  }

  /**
   * 重命名文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * oldKey: string,
   * newKey: string
   * }
   */
  async renameBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, oldKey, newKey } = configMap
    const client = this.getNewCtx(region, bucketName)
    const copyRes = (await client.copy(newKey, oldKey)) as any
    if (copyRes?.res.statusCode === 200) {
      const deleteRes = (await client.delete(oldKey)) as any
      return deleteRes?.res.statusCode === 204
    }
    return false
  }

  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    const client = this.getNewCtx(region, bucketName)
    const res = (await client.delete(key)) as any
    return res?.res.statusCode === 204
  }

  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFiles(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, region, keys } = configMap
    return deleteInBatches(keys, async batch => {
      const client = this.getNewCtx(region, bucketName)
      const res = (await client.deleteMulti(batch, { quiet: false })) as OSS.DeleteMultiResult & {
        res: { statusCode?: number }
      }
      // ali-oss returns { Key } entries, although some typings describe string[].
      return (res?.res.statusCode ?? res?.res.status) === 200
        ? keyedDeleteResult(batch, res.deleted)
        : failedKeys(batch, deletionError(res))
    })
  }

  async deleteBucketFolder(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, region, key } = configMap
    return deleteListedFolder(
      key,
      async (prefix, marker) => {
        const client = this.getNewCtx(region, bucketName)
        const res = await client.listV2(
          {
            prefix,
            'max-keys': 1000,
            'continuation-token': marker,
          },
          {
            timeout: this.timeOut,
          },
        )
        if (((res?.res as { statusCode?: number })?.statusCode ?? res?.res.status) !== 200) throw res
        return {
          keys: (res.objects || []).map(item => item.name),
          nextMarker: nextDeleteMarker(res.isTruncated === true, res.nextContinuationToken),
        }
      },
      keys => this.deleteBucketFiles({ ...configMap, keys }),
    )
  }

  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap: IStringKeyMap): Promise<string> {
    const { bucketName, region, key, expires, customUrl } = configMap
    const client = this.getNewCtx(region, bucketName)
    const res = client.signatureUrl(key, {
      expires: expires || 3600,
    })
    return customUrl ? `${customUrl.replace(/\/+$/, '')}/${key}${res.slice(res.indexOf('?'))}` : res
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleUploadBatch(
      configMap,
      {
        provider: 'aliyun',
        account: [this.accessKeyId],
        normalizeKey: true,
        // OSS's parallel worker pool returns on the first error, before sibling requests settle.
        multipart: { minPartSize: MIB, maxParts: 10000, maxConcurrency: 1 },
      },
      async ({ bucketName, region, key, filePath, fileName }, { signal, slots, partSize, progress }) => {
        const client = this.getNewCtx(region, bucketName)
        const detach = onUploadAbort(signal, () => client.cancel())
        try {
          const result = await client.multipartUpload(key, filePath, {
            parallel: slots,
            partSize,
            mime: getFileMimeType(fileName),
            progress: (percent: number) => progress(percent * 100),
          })
          if (result.res.status !== 200) throw new TransferError('provider')
        } finally {
          detach()
        }
      },
    )
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    const client = this.getNewCtx(region, bucketName)
    const res = (await client.put(key, Buffer.from(''))) as any
    return res?.res?.statusCode === 200
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray, maxDownloadFileCount, downloadConflictPolicy = 'rename' } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const promises = [] as any
    for (const item of fileArray) {
      const { bucketName, region, key, fileName } = item
      const client = this.getNewCtx(region, bucketName)
      const id = `${bucketName}-${region}-${key}`
      const destination = createDownloadTask(instance, id, downloadPath, fileName, downloadConflictPolicy, this.logger)
      if (!destination) continue
      const preSignedUrl = client.signatureUrl(key, {
        expires: 60 * 60 * 48,
      })
      promises.push(
        () =>
          new Promise((resolve, reject) => {
            NewDownloader(instance, preSignedUrl, id, destination, this.logger).then((res: boolean) => {
              if (res) {
                resolve(res)
              } else {
                reject(res)
              }
            })
          }),
      )
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount)
    pool.all(promises).catch((error: any) => {
      this.logger.error(
        formatError(error, {
          class: 'AliyunApi',
          method: 'downloadBucketFile',
        }),
      )
    })
    return true
  }
}

export default AliyunApi
