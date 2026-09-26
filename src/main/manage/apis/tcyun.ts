import { finished } from 'node:stream/promises'

import COS from 'cos-nodejs-sdk-v5'

import type { DeleteResult } from '#/deletion'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import { createDownloadTask, getFileMimeType, runDownloadTask } from '~/manage/utils/common'
import {
  deleteInBatches,
  deleteListedFolder,
  deletionError,
  failedKeys,
  keyedDeleteResult,
  nextDeleteMarker,
} from '~/manage/utils/deleteObjects'
import { ManageLogger } from '~/manage/utils/logger'
import { createUploadAgents, MIB, scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { handleUrlEncode, isImage } from '~/utils/common'
import { downloadTaskSpecialStatus } from '~/utils/enum'

class TcyunApi {
  secretId: string
  secretKey: string
  ctx: COS
  logger: ManageLogger

  constructor(secretId: string, secretKey: string, logger: ManageLogger) {
    this.secretId = secretId
    this.secretKey = secretKey
    this.ctx = new COS({
      SecretId: secretId,
      SecretKey: secretKey,
    })
    this.logger = logger
  }

  formatFolder(item: { Prefix: string }, slicedPrefix: string, urlPrefix: string) {
    return {
      ...item,
      key: item.Prefix,
      fileSize: 0,
      url: `${urlPrefix}/${item.Prefix}`,
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
      url: `${urlPrefix}/${item.Key}`,
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
    const copyRes = await this.ctx.putObjectCopy({
      Bucket: bucketName,
      Region: region,
      Key: newKey,
      CopySource: handleUrlEncode(`${bucketName}.cos.${region}.myqcloud.com/${oldKey}`),
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
    const res = this.ctx.getObjectUrl(
      {
        Bucket: bucketName,
        Region: region,
        Key: key,
        Expires: expires,
        Sign: true,
      },
      () => {},
    )
    return customUrl ? `${customUrl.replace(/\/+$/, '')}/${key}${res.slice(res.indexOf('?'))}` : res
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
    const { downloadPath, fileArray, downloadConflictPolicy = 'rename' } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { bucketName, region, key, fileName } = item
      const id = `${bucketName}-${region}-${key}`
      const destination = createDownloadTask(instance, id, downloadPath, fileName, downloadConflictPolicy, this.logger)
      if (!destination) continue
      void runDownloadTask(
        instance,
        id,
        destination,
        async (_partPath, createWriteStream) => {
          for (let attempt = 0; attempt < 3; attempt++) {
            const output = createWriteStream()
            const closed = finished(output)
            try {
              await Promise.all([
                this.ctx
                  .getObject({
                    Bucket: bucketName,
                    Region: region,
                    Key: key,
                    Output: output,
                    onProgress: (progress: any) => {
                      instance.updateDownloadTask({
                        id,
                        progress: Math.min(99, Math.floor(progress.percent * 100)),
                        status: downloadTaskSpecialStatus.downloading,
                      })
                    },
                  })
                  .then(res => {
                    if (res?.statusCode !== 200) throw new Error('Download failed')
                  }),
                closed,
              ])
              return
            } catch (error) {
              output.destroy()
              await closed.catch(() => {})
              if (attempt === 2) throw error
            }
          }
        },
        this.logger,
      )
    }
    return true
  }
}

export default TcyunApi
