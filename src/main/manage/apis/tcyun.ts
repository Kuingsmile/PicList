import http from 'node:http'
import https from 'node:https'

import COS from 'cos-nodejs-sdk-v5'

import type { DeleteResult } from '#/deletion'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import { encodeObjectPath, getFileMimeType, getPublicObjectUrl } from '~/manage/utils/common'
import {
  deleteInBatches,
  deleteListedFolder,
  deletionError,
  failedKeys,
  keyedDeleteResult,
  nextDeleteMarker,
} from '~/manage/utils/deleteObjects'
import { scheduleHttpDownloads } from '~/manage/utils/downloadBatch'
import { ManageLogger } from '~/manage/utils/logger'
import { createUploadAgents, MIB, scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/filesystem'

class TcyunApi {
  secretId: string
  secretKey: string
  private readonly agents = { http: new http.Agent({ keepAlive: true }), https: new https.Agent({ keepAlive: true }) }
  ctx: COS
  logger: ManageLogger

  constructor(secretId: string, secretKey: string, logger: ManageLogger) {
    this.secretId = secretId
    this.secretKey = secretKey
    this.ctx = new COS({
      SecretId: secretId,
      SecretKey: secretKey,
    })
    this.ctx.on('before-send', (options: any) => {
      options.agent = options.url.startsWith('https:') ? this.agents.https : this.agents.http
    })
    this.logger = logger
  }

  destroy() {
    this.agents.http.destroy()
    this.agents.https.destroy()
  }

  formatFolder(item: { Prefix: string }, slicedPrefix: string, urlPrefix: string) {
    return {
      ...item,
      key: item.Prefix,
      fileSize: 0,
      url: getPublicObjectUrl(urlPrefix, item.Prefix),
      formatedTime: '',
      fileName: item.Prefix.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
    }
  }

  formatFile(item: COS.CosObject, slicedPrefix: string, urlPrefix: string): any {
    return {
      ...item,
      key: item.Key,
      fileName: item.Key.replace(slicedPrefix, ''),
      fileSize: parseInt(item.Size),
      formatedTime: new Date(item.LastModified).toLocaleString(),
      isDir: false,
      checked: false,
      isImage: isImage(item.Key),
      match: false,
      url: getPublicObjectUrl(urlPrefix, item.Key),
    }
  }

  /**
   * 获取存储桶列表
   */
  async getBucketList(): Promise<any> {
    const res = await this.ctx.getService({})
    return res?.Buckets || []
  }

  /**
   * 获取自定义域名
   */
  async getBucketDomain(param: IStringKeyMap): Promise<any> {
    const { bucketName, region } = param
    const res = await this.ctx.getBucketDomain({
      Bucket: bucketName,
      Region: region,
    })
    if (res?.statusCode !== 200 || !res?.DomainRule?.length) return []
    return res.DomainRule.filter((item: any) => item.Status === 'ENABLED').map(item => item.Name)
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
    const res = await this.ctx.putBucket({
      ACL: configMap.acl,
      Bucket: configMap.BucketName,
      Region: configMap.region,
    })
    return res?.statusCode === 200
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      customUrl,
    } = configMap
    const slicedPrefix = prefix.slice(1, prefix.length)
    const urlPrefix = customUrl || `https://${bucket}.cos.${region}.myqcloud.com`
    let marker: string | undefined

    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    let res: COS.GetBucketResult
    do {
      res = await listing.wait(() =>
        this.ctx.getBucket({
          Bucket: bucket,
          Region: region,
          Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          Marker: marker,
        }),
      )
      if (res?.statusCode === 200) {
        result.fullList.push(
          ...res.Contents.filter(item => !item.Key.endsWith('/')).map(item =>
            this.formatFile(item, slicedPrefix, urlPrefix),
          ),
        )
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
      marker = res.NextMarker
    } while (res.IsTruncated === 'true' && !listing.signal.aborted)
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
      customUrl,
    } = configMap
    const slicedPrefix = prefix.slice(1, prefix.length)
    const urlPrefix = customUrl || `https://${bucket}.cos.${region}.myqcloud.com`
    let marker: string | undefined

    let res: COS.GetBucketResult
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    do {
      res = await listing.wait(() =>
        this.ctx.getBucket({
          Bucket: bucket,
          Region: region,
          Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          Delimiter: '/',
          Marker: marker,
        }),
      )
      if (res?.statusCode === 200) {
        result.fullList.push(
          ...res.CommonPrefixes.map(item => this.formatFolder(item, slicedPrefix, urlPrefix)),
          ...res.Contents.filter(item => !item.Key.endsWith('/')).map(item =>
            this.formatFile(item, slicedPrefix, urlPrefix),
          ),
        )
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
      marker = res.NextMarker
    } while (res.IsTruncated === 'true' && !listing.signal.aborted)
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
      customUrl,
      marker,
      itemsPerPage,
    } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = customUrl || `https://${bucket}.cos.${region}.myqcloud.com`
    const res = (await listing.wait(() =>
      this.ctx.getBucket({
        Bucket: bucket,
        Region: region,
        Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
        Delimiter: '/',
        Marker: marker,
        MaxKeys: itemsPerPage,
      }),
    )) as COS.GetBucketResult
    if (res?.statusCode !== 200) {
      return {
        fullList: [],
        isTruncated: false,
        nextMarker: '',
        success: false,
      }
    }
    const result = {
      fullList: [
        ...res.CommonPrefixes.map(item => this.formatFolder(item, slicedPrefix, urlPrefix)),
        ...res.Contents.filter(item => !item.Key.endsWith('/')).map(item =>
          this.formatFile(item, slicedPrefix, urlPrefix),
        ),
      ],
      isTruncated: res.IsTruncated === 'true',
      nextMarker: res.NextMarker || '',
      success: true,
    }
    return result
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
    if (oldKey === newKey) return true
    const copyRes = await this.ctx.putObjectCopy({
      Bucket: bucketName,
      Region: region,
      Key: newKey,
      CopySource: `${bucketName}.cos.${region}.myqcloud.com/${encodeObjectPath(oldKey)}`,
    })

    if (copyRes?.statusCode !== 200) return false

    const deleteRes = await this.ctx.deleteObject({
      Bucket: bucketName,
      Region: region,
      Key: oldKey,
    })

    return deleteRes?.statusCode === 204
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
    const res = await this.ctx.deleteObject({
      Bucket: bucketName,
      Region: region,
      Key: key,
    })
    return res?.statusCode === 204
  }

  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFiles(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, region, keys } = configMap
    return deleteInBatches(keys, async batch => {
      const res = await this.ctx.deleteMultipleObject({
        Bucket: bucketName,
        Region: region,
        Objects: batch.map(Key => ({ Key })),
        Quiet: false,
      })
      return res?.statusCode === 200
        ? keyedDeleteResult(batch, res.Deleted, res.Error)
        : failedKeys(batch, deletionError(res))
    })
  }

  async deleteBucketFolder(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, region, key } = configMap
    return deleteListedFolder(
      key,
      async (prefix, marker) => {
        const res = await this.ctx.getBucket({
          Bucket: bucketName,
          Region: region,
          Prefix: prefix,
          MaxKeys: 1000,
          Marker: marker,
        })
        if (res?.statusCode !== 200) throw res
        return {
          keys: (res.Contents || []).map(item => item.Key),
          nextMarker: nextDeleteMarker(res.IsTruncated === 'true', res.NextMarker),
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
    const url = await new Promise<string>((resolve, reject) =>
      this.ctx.getObjectUrl(
        { Bucket: bucketName, Region: region, Key: key, Expires: expires, Sign: true },
        (error, result) => (error ? reject(error) : resolve(result.Url)),
      ),
    )
    return customUrl ? `${customUrl.replace(/\/+$/, '')}/${encodeObjectPath(key)}${new URL(url).search}` : url
  }

  /**
   * 高级上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleUploadBatch(
      configMap,
      {
        provider: 'tcyun',
        account: [this.secretId],
        normalizeKey: true,
        // The SDK's parallel pool can finish before sibling file readers on failure.
        multipart: { minPartSize: MIB, maxParts: 10000, maxConcurrency: 1 },
      },
      async ({ bucketName, region, key, filePath }, { signal, slots, partSize, progress }) => {
        const client = new COS({
          SecretId: this.secretId,
          SecretKey: this.secretKey,
          FileParallelLimit: 1,
          ChunkParallelLimit: slots,
        })
        const agents = createUploadAgents(signal)
        client.on('before-send', (options: any) => {
          options.agent = options.url.startsWith('https:') ? agents.https : agents.http
          options.timeout = 60000
        })
        try {
          await new Promise<void>((resolve, reject) => {
            client.uploadFile(
              {
                Bucket: bucketName,
                Region: region,
                Key: key,
                FilePath: filePath,
                SliceSize: partSize,
                ChunkSize: partSize,
                ContentType: getFileMimeType(filePath),
                onProgress: event => progress(event.percent * 100),
              },
              (error, result) => {
                if (error || !result || !result.statusCode || result.statusCode < 200 || result.statusCode >= 300)
                  reject(new TransferError('provider'))
                else resolve()
              },
            )
          })
        } finally {
          await agents.close()
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
    const res = await this.ctx.putObject({
      Bucket: bucketName,
      Region: region,
      Key: key,
      Body: '',
    })
    return res?.statusCode === 200
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleHttpDownloads(configMap, this.logger, async ({ bucketName, region, key }) => ({
      url: await this.getPreSignedUrl({ bucketName, region, key, expires: 3600 }),
    }))
  }
}

export default TcyunApi
