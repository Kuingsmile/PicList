import path from 'node:path'

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs-extra'
import Upyun from 'upyun'

import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import {
  ConcurrencyPromisePool,
  createDownloadTask,
  formatError,
  getFileMimeType,
  gotUpload,
  hmacSha1Base64,
  isUploadResponseObject,
  isUploadResponseString,
  md5,
  NewDownloader,
} from '~/manage/utils/common'
import { ManageLogger } from '~/manage/utils/logger'
import { scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/common'

class UpyunApi {
  ser: Upyun.Service
  cli: Upyun.Client
  bucket: string
  operator: string
  password: string
  antiLeechToken: string
  expireTime: number
  stopMarker = 'g2gCZAAEbmV4dGQAA2VvZg'
  logger: ManageLogger

  constructor(
    bucket: string,
    operator: string,
    password: string,
    logger: ManageLogger,
    antiLeechToken?: string,
    expireTime?: number,
  ) {
    this.ser = new Upyun.Service(bucket, operator, password)
    this.cli = new Upyun.Client(this.ser)
    this.bucket = bucket
    this.operator = operator
    this.password = password
    this.logger = logger
    this.antiLeechToken = antiLeechToken || ''
    this.expireTime = expireTime || 24 * 60 * 60
  }

  getAntiLeechParam(key: string): string {
    const uri = `/${key}`.replace(/%2F/g, '/').replace(/^\/+/g, '/')
    const now = Math.round(new Date().getTime() / 1000)
    const expire = this.expireTime ? now + parseInt(this.expireTime.toString(), 10) : now + 1800
    const sign = md5(`${this.antiLeechToken}&${expire}&${uri}`, 'hex')
    const upt = `${sign.substring(12, 20)}${expire}`
    return `_upt=${upt}`
  }

  formatFolder(item: any, slicedPrefix: string, urlPrefix: string) {
    const key = `${slicedPrefix}${item.name}/`
    let url = `${urlPrefix}/${key}`
    if (this.antiLeechToken) {
      url = `${url}?${this.getAntiLeechParam(key)}`
    }
    return {
      ...item,
      key,
      url,
      fileSize: 0,
      formatedTime: '',
      fileName: item.name,
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      Key: key,
    }
  }

  formatFile(item: any, slicedPrefix: string, urlPrefix: string) {
    const key = `${slicedPrefix}${item.name}`
    let url = `${urlPrefix}/${key}`
    if (this.antiLeechToken) {
      url = `${url}?${this.getAntiLeechParam(key)}`
    }
    return {
      ...item,
      fileName: item.name,
      fileSize: item.size,
      formatedTime: new Date(parseInt(item.time) * 1000).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.name),
      url,
      key,
    }
  }

  authorization(method: string, uri: string, contentMd5: string, operator: string, password: string) {
    return `UPYUN ${operator}:${hmacSha1Base64(
      md5(password, 'hex'),
      `${method.toUpperCase()}&${encodeURI(uri)}&${new Date().toUTCString()}${contentMd5 ? `&${contentMd5}` : ''}`,
    )}`
  }

  /**
   * 获取空间列表
   */
  async getBucketList(): Promise<any> {
    return this.bucket
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { bucketName: bucket, prefix } = configMap
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`
    let res = {} as any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    const folderQueue = [path.posix.join('/', prefix, '/')]
    const getFolderFile = async (folder: string) => {
      let marker = ''
      const slicedPrefix = folder.slice(1)
      do {
        res = await listing.wait(() =>
          this.cli.listDir(folder, {
            limit: 10000,
            iter: marker,
          }),
        )
        if (res) {
          res.files?.forEach((item: any) => {
            item.type === 'F' && folderQueue.push(path.posix.join(folder, item.name, '/'))
            item.type === 'N' && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          })
          await listing.publish(result)
          result.fullList = []
        } else {
          result.finished = true
          await listing.publish(result)
          result.fullList = []
          return
        }
        marker = res.next
      } while (!listing.signal.aborted && res.next !== this.stopMarker)
    }
    while (folderQueue.length && !result.finished && !listing.signal.aborted) {
      const folder = folderQueue.shift()!
      await listing.wait(() => getFolderFile(folder))
    }
    if (result.finished) return
    result.success = !listing.signal.aborted
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { bucketName: bucket, prefix } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`
    let marker = ''
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    do {
      res = await listing.wait(() =>
        this.cli.listDir(prefix, {
          limit: 10000,
          iter: marker,
        }),
      )
      if (res) {
        res.files?.forEach((item: any) => {
          item.type === 'N' && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          item.type === 'F' && result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix))
        })
        await listing.publish(result)
        result.fullList = []
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
      marker = res.next
    } while (!listing.signal.aborted && res.next !== this.stopMarker)
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
    const { bucketName: bucket, prefix, marker, itemsPerPage } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`
    const result = {
      fullList: [] as any,
      isTruncated: false,
      nextMarker: '',
      success: false,
    }
    const res = await listing.wait(() =>
      this.cli.listDir(prefix, {
        limit: itemsPerPage,
        iter: marker || '',
      }),
    )
    if (res) {
      res.files?.forEach((item: any) => {
        item.type === 'N' && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        item.type === 'F' && result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix))
      })
      result.isTruncated = res.next !== this.stopMarker
      result.nextMarker = res.next
      result.success = true
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
    const oldKey = configMap.oldKey
    let newKey = configMap.newKey
    const method = 'PUT'
    if (newKey.endsWith('/')) {
      newKey = newKey.slice(0, -1)
    }
    const xUpyunMoveSource = `/${this.bucket}/${oldKey}`
    const uri = `/${this.bucket}/${newKey}`
    const authorization = this.authorization(method, uri, '', this.operator, this.password)
    const headers = {
      Authorization: authorization,
      'X-Upyun-Move-Source': xUpyunMoveSource,
      'Content-Length': 0,
      Date: new Date().toUTCString(),
    }
    const res = await axios({
      method,
      url: `http://v0.api.upyun.com${uri}`,
      headers,
    })
    return res.status === 200
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
    const { key } = configMap
    const res = await this.cli.deleteFile(key)
    return res
  }

  /**
   * delete bucket folder
   * @param configMap
   */
  async deleteBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let marker = ''
    let isTruncated
    const allFileList = {
      CommonPrefixes: [] as any[],
      Contents: [] as any[],
    }
    do {
      const res = await this.cli.listDir(key, {
        limit: 10000,
        iter: marker,
      })
      if (res) {
        res.files.forEach((item: any) => {
          item.type === 'N' &&
            allFileList.Contents.push({
              ...item,
              key: `${key}${item.name}`,
            })
          item.type === 'F' &&
            allFileList.CommonPrefixes.push({
              ...item,
              key: `${key}${item.name}/`,
            })
        })
        marker = res.next
        isTruncated = res.next !== this.stopMarker
      } else {
        return false
      }
    } while (isTruncated)
    if (allFileList.Contents.length > 0) {
      for (const allFileListItem of allFileList.Contents) {
        const success = await this.cli.deleteFile(allFileListItem.key)
        if (!success) {
          return false
        }
      }
    }
    if (allFileList.CommonPrefixes.length > 0) {
      for (const item of allFileList.CommonPrefixes) {
        const res = await this.deleteBucketFolder({
          key: item.key,
        })
        if (!res) {
          return false
        }
      }
    }
    const deleteSelf = await this.cli.deleteFile(key)
    if (!deleteSelf) {
      return false
    }
    return true
  }

  /**
   * upload file to bucket
   * axiso:onUploadProgress not work in nodejs , use got instead
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const instance = UpDownTaskQueue.getInstance()
    return scheduleUploadBatch(
      configMap,
      { provider: 'upyun', account: [this.bucket, this.operator], normalizeKey: true },
      async (file, { id, signal }) => {
        const { bucketName, key, filePath, fileName, fileSize } = file
        const result = await gotUpload(instance, id, {
          prepare: () => {
            const date = new Date().toUTCString()
            const uploadPolicy = {
              bucket: bucketName,
              'save-key': `/${key}`,
              expiration: Math.floor(Date.now() / 1000) + 2592000,
              date,
              'content-length': fileSize,
            }
            const base64Policy = Buffer.from(JSON.stringify(uploadPolicy)).toString('base64')
            const stringToSign = `POST&/${bucketName}&${date}&${base64Policy}`
            const signature = hmacSha1Base64(md5(this.password, 'hex'), stringToSign)
            const authorization = `UPYUN ${this.operator}:${signature}`
            const form = new FormData()
            form.append('policy', base64Policy)
            form.append('authorization', authorization)
            const headers = {
              ...form.getHeaders(),
              Host: 'v0.api.upyun.com',
              Date: date,
              Authorization: authorization,
            }
            const fileOptions = { filename: path.basename(key), contentType: getFileMimeType(fileName) }
            const source = fs.createReadStream(filePath)
            form.append('file', source, fileOptions)
            return { url: `http://v0.api.upyun.com/${bucketName}`, method: 'POST', body: form, headers, source }
          },
          validateResponse: (body, statusCode) =>
            statusCode === 200 &&
            isUploadResponseObject(body) &&
            body.code === 200 &&
            body.message === 'ok' &&
            isUploadResponseString(body.url),
          signal,
          logger: this.logger,
          managed: true,
        })
        if (!result.success) throw new TransferError('provider')
      },
    )
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    const res = await this.cli.makeDir(`/${key}`)
    return res
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
      const preSignedUrl = `${customUrl}/${key}`
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
      this.logger.error(formatError(error, { class: 'UpyunApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default UpyunApi
