import axios from 'axios'
import qiniu from 'qiniu'

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
  qiniuDeleteResult,
} from '~/manage/utils/deleteObjects'
import { ManageLogger } from '~/manage/utils/logger'
import { MIB, scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/common'

class QiniuApi {
  mac: qiniu.auth.digest.Mac
  accessKey: string
  secretKey: string
  commonType = 'application/x-www-form-urlencoded'
  host = 'uc.qiniuapi.com'
  logger: ManageLogger
  timeout = 30000

  hostList = {
    getBucketList: 'https://uc.qiniuapi.com/buckets',
    getBucketDomain: 'https://uc.qiniuapi.com/v2/domains',
  }

  constructor(accessKey: string, secretKey: string, logger: ManageLogger) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    this.accessKey = accessKey
    this.secretKey = secretKey
    this.logger = logger
  }

  formatFolder(item: string, slicedPrefix: string, urlPrefix: string) {
    return {
      Key: item,
      key: item,
      url: `${urlPrefix}/${item}`,
      fileSize: 0,
      fileName: item.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
    }
  }

  formatFile(item: any, slicedPrefix: string, urlPrefix: string) {
    const fileName = item.key.replace(slicedPrefix, '')
    return {
      ...item,
      fileName,
      url: `${urlPrefix}/${item.key}`,
      fileSize: item.fsize,
      formatedTime: new Date(parseInt(item.putTime.toString().slice(0, -4), 10)).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName) || /^image\//i.test(item.mimeType || ''),
    }
  }

  authorization(
    method: string,
    urlPath: string,
    host: string,
    body: string,
    query: string,
    contentType: string,
    xQiniuHeaders?: IStringKeyMap,
  ) {
    let signStr = `${method.toUpperCase()} ${urlPath}${query ? `?${query}` : ''}\nHost: ${host}`

    contentType && (signStr += `\nContent-Type: ${contentType}`)
    if (xQiniuHeaders) {
      const xQiniuHeaderStr = Object.keys(xQiniuHeaders)
        .sort()
        .map(key => `\n${key}:${xQiniuHeaders[key]}`)
        .join('')
      signStr += xQiniuHeaderStr
    }

    signStr += '\n\n'

    if (contentType !== 'application/octet-stream' && body) signStr += body
    return `Qiniu ${this.accessKey}:${hmacSha1Base64(this.secretKey, signStr).replace(/\+/g, '-').replace(/\//g, '_')}`
  }

  /**
   * 获取存储桶列表
   */
  async getBucketList(): Promise<any> {
    const host = this.hostList.getBucketList
    const authorization = qiniu.util.generateAccessToken(this.mac, host, undefined)
    const res = await axios.get(host, {
      headers: {
        Authorization: authorization,
        'Content-Type': this.commonType,
      },
      timeout: this.timeout,
    })
    if (res?.status === 200 && res?.data?.length) {
      const result = [] as any[]
      for (const dataItem of res.data) {
        const info = await this.getBucketInfo({ bucketName: dataItem })
        if (!info.success) return []
        result.push({
          Name: dataItem,
          Location: info.zone,
          CreationDate: new Date().toISOString(),
          Private: info.private,
        })
      }
      return result
    }
    return []
  }

  /**
   * 获取存储桶详细信息
   */
  async getBucketInfo(param: IStringKeyMap): Promise<any> {
    const { bucketName } = param
    const urlPath = `/v2/bucketInfo?bucket=${bucketName}&fs=true`
    const authorization = this.authorization('POST', urlPath, this.host, '', '', 'application/json')
    const res = await axios({
      method: 'post',
      url: `https://${this.host}/v2/bucketInfo`,
      params: {
        bucket: bucketName,
        fs: true,
      },
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Host: this.host,
      },
      timeout: this.timeout,
    })
    return res?.status === 200
      ? {
          success: true,
          private: res.data.private,
          zone: res.data.zone,
        }
      : {
          success: false,
        }
  }

  /**
   * 获取自定义域名
   */
  async getBucketDomain(param: IStringKeyMap): Promise<any> {
    const { bucketName } = param
    const host = this.hostList.getBucketDomain
    const authorization = qiniu.util.generateAccessToken(this.mac, `${host}?tbl=${bucketName}`, undefined)
    const res = await axios.get(host, {
      params: {
        tbl: bucketName,
      },
      headers: {
        Authorization: authorization,
        'Content-Type': this.commonType,
      },
      timeout: this.timeout,
    })
    return res?.status === 200 && res?.data?.length ? res.data : []
  }

  /**
   * 修改存储桶权限
   */
  async setBucketAclPolicy(param: IStringKeyMap): Promise<boolean> {
    // 0: 公开访问 1: 私有访问
    const { bucketName } = param
    let { isPrivate } = param
    isPrivate = isPrivate ? 1 : 0
    const urlPath = `/private?bucket=${bucketName}&private=${isPrivate}`
    const authorization = this.authorization('POST', urlPath, this.host, '', '', this.commonType)
    const res = await axios({
      method: 'post',
      url: `https://${this.host}/private`,
      params: {
        bucket: bucketName,
        private: isPrivate,
      },
      headers: {
        Authorization: authorization,
        'Content-Type': this.commonType,
        Host: this.host,
      },
      timeout: this.timeout,
    })
    return res?.status === 200
  }

  /**
   * 创建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: boolean // 是否公开访问
   * }
   */
  async createBucket(configMap: IStringKeyMap): Promise<boolean> {
    const { BucketName, region, acl } = configMap
    const urlPath = `/mkbucketv3/${BucketName}/region/${region}`
    const authorization = this.authorization('POST', urlPath, this.host, '', '', 'application/json')
    const res = await axios({
      method: 'post',
      url: `https://${this.host}${urlPath}`,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Host: this.host,
      },
      timeout: this.timeout,
    })
    return res?.status === 200
      ? await this.setBucketAclPolicy({
          bucketName: BucketName,
          isPrivate: !acl,
        })
      : false
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { bucketName: bucket, prefix, customUrl: urlPrefix } = configMap
    let marker = undefined as any
    const slicedPrefix = prefix.slice(1)
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    do {
      res = await listing.wait(
        () =>
          new Promise((resolve, reject) => {
            bucketManager.listPrefix(
              bucket,
              {
                prefix: slicedPrefix === '' ? undefined : slicedPrefix,
                marker,
                limit: 1000,
              },
              (err: any, respBody: any, respInfo: any) => {
                if (err) {
                  reject(err)
                } else {
                  resolve({
                    respBody,
                    respInfo,
                  })
                }
              },
            )
          }),
      )
      if (res && res.respInfo.statusCode === 200) {
        res.respBody &&
          res.respBody.items &&
          res.respBody.items.forEach((item: any) => {
            item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          })
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
      marker = res.respBody.marker
    } while (res.respBody && res.respBody.marker && !listing.signal.aborted)
    result.success = !listing.signal.aborted
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { bucketName: bucket, prefix, customUrl: urlPrefix } = configMap
    let marker = undefined as any
    const slicedPrefix = prefix.slice(1)
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    do {
      res = await listing.wait(
        () =>
          new Promise((resolve, reject) => {
            bucketManager.listPrefix(
              bucket,
              {
                prefix: slicedPrefix === '' ? undefined : slicedPrefix,
                delimiter: '/',
                marker,
                limit: 1000,
              },
              (err: any, respBody: any, respInfo: any) => {
                if (err) {
                  reject(err)
                } else {
                  resolve({
                    respBody,
                    respInfo,
                  })
                }
              },
            )
          }),
      )
      if (res && res.respInfo.statusCode === 200) {
        res.respBody &&
          res.respBody.commonPrefixes &&
          res.respBody.commonPrefixes.forEach((item: any) => {
            result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix))
          })
        res.respBody &&
          res.respBody.items &&
          res.respBody.items.forEach((item: any) => {
            item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          })
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
      marker = res.respBody.marker
    } while (res.respBody && res.respBody.marker && !listing.signal.aborted)
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
    const { bucketName: bucket, prefix, marker, itemsPerPage, customUrl: urlPrefix } = configMap
    const slicedPrefix = prefix.slice(1)
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    const result = {
      fullList: [] as any,
      isTruncated: false,
      nextMarker: '',
      success: false,
    }
    const res = (await listing.wait(
      () =>
        new Promise((resolve, reject) => {
          bucketManager.listPrefix(
            bucket,
            {
              limit: itemsPerPage,
              prefix: slicedPrefix === '' ? undefined : slicedPrefix,
              marker,
              delimiter: '/',
            },
            (err, respBody, respInfo) => {
              if (err) {
                reject(err)
              } else {
                resolve({
                  respBody,
                  respInfo,
                })
              }
            },
          )
        }),
    )) as any
    if (res?.respInfo?.statusCode === 200) {
      if (res.respBody?.commonPrefixes) {
        res.respBody.commonPrefixes.forEach((item: string) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix))
        })
      }
      if (res.respBody?.items) {
        res.respBody.items.forEach((item: any) => {
          item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
      }
      result.isTruncated = !!res.respBody?.marker
      result.nextMarker = res.respBody?.marker ? res.respBody.marker : ''
      result.success = true
    }
    return result
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
    const { bucketName, key } = configMap
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    const res = (await new Promise((resolve, reject) => {
      bucketManager.delete(bucketName, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            respBody,
            respInfo,
          })
        }
      })
    })) as any
    return res?.respInfo?.statusCode === 200
  }

  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFiles(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, keys } = configMap
    return deleteInBatches(keys, async batch => {
      const manager = new qiniu.rs.BucketManager(this.mac, new qiniu.conf.Config())
      return new Promise<DeleteResult>((resolve, reject) => {
        manager.batch(
          batch.map(key => qiniu.rs.deleteOp(bucketName, key)),
          (err, body, info) => {
            if (err) return reject(err)
            resolve(
              info?.statusCode === 200 || info?.statusCode === 298
                ? qiniuDeleteResult(batch, body)
                : failedKeys(batch, deletionError(info)),
            )
          },
        )
      })
    })
  }

  async deleteBucketFolder(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, key } = configMap
    return deleteListedFolder(
      key,
      (prefix, marker) =>
        new Promise((resolve, reject) => {
          const manager = new qiniu.rs.BucketManager(this.mac, new qiniu.conf.Config())
          manager.listPrefix(bucketName, { prefix, marker, limit: 1000 }, (err, body, info) => {
            if (err) return reject(err)
            if (info?.statusCode !== 200 || !body) return reject(info)
            if (
              !Array.isArray(body.items ?? []) ||
              (body.marker !== undefined && body.marker !== null && typeof body.marker !== 'string')
            ) {
              return reject({ code: 'InvalidListingResponse' })
            }
            resolve({
              keys: (body.items || []).map((item: { key: string } | null) => item?.key),
              nextMarker: body.marker || undefined,
            })
          })
        }),
      keys => this.deleteBucketFiles({ ...configMap, keys }),
    )
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
    const { bucketName, oldKey, newKey } = configMap
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    const res = (await new Promise((resolve, reject) => {
      bucketManager.move(
        bucketName,
        oldKey,
        bucketName,
        newKey,
        {
          force: true,
        },
        (err, respBody, respInfo) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              respBody,
              respInfo,
            })
          }
        },
      )
    })) as any
    return res?.respInfo?.statusCode === 200
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
    const { key, expires, customUrl } = configMap
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    const urlPrefix = customUrl
    const expiration = parseInt(Date.now() / 1000 + expires)
    const res = bucketManager.privateDownloadUrl(urlPrefix, key, expiration)
    return res
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleUploadBatch(
      configMap,
      { provider: 'qiniu', account: [this.accessKey], normalizeKey: true, memory: () => 12 * MIB },
      async ({ bucketName, key, filePath, fileName }, { signal, progress }) => {
        const uploader = new qiniu.resume_up.ResumeUploader(new qiniu.conf.Config())
        const extra = new qiniu.resume_up.PutExtra()
        const token = new qiniu.rs.PutPolicy({ scope: bucketName + ':' + key, expires: 36000 }).uploadToken(this.mac)
        extra.fname = key
        extra.mimeType = getFileMimeType(fileName)
        extra.version = 'v2'
        extra.partSize = 4 * MIB
        extra.progressCallback = (loaded, total) => {
          // The SDK treats a thrown progress callback as a non-retryable failure and closes the file.
          // Cancellation drains the current 4 MiB part, then stops before another part or completion.
          signal.throwIfAborted()
          progress(total ? (loaded / total) * 100 : 0)
        }
        signal.throwIfAborted()
        // There is no per-request abort handle; keep capacity reserved until the SDK has settled.
        await new Promise<void>((resolve, reject) => {
          uploader.putFile(token, key, filePath, extra, (error, _body, response) => {
            if (error || response?.statusCode !== 200) reject(new TransferError('provider'))
            else resolve()
          })
        })
      },
    )
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, key } = configMap
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucketName}:${key}`,
    })
    const uploadToken = putPolicy.uploadToken(this.mac)
    const FormUploader = new qiniu.form_up.FormUploader()
    const putExtra = new qiniu.form_up.PutExtra()
    const res = (await new Promise((resolve, reject) => {
      FormUploader.put(uploadToken, key, '', putExtra, (err, respBody, respInfo) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            respBody,
            respInfo,
          })
        }
      })
    })) as any
    return res?.respInfo?.statusCode === 200
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
      const { bucketName, region, key, fileName, customUrl } = item
      const id = `${bucketName}-${region}-${key}`
      const destination = createDownloadTask(instance, id, downloadPath, fileName, downloadConflictPolicy, this.logger)
      if (!destination) continue
      const preSignedUrl = await this.getPreSignedUrl({
        key,
        expires: 36000,
        customUrl,
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
    pool.all(promises).catch(error => {
      this.logger.error(formatError(error, { class: 'QiniuApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default QiniuApi
