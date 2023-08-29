import Upyun from 'upyun'

// 加密函数、获取文件 MIME 类型、新的下载器、got 上传函数、并发异步任务池、错误格式化函数
import { md5, hmacSha1Base64, getFileMimeType, NewDownloader, gotUpload, ConcurrencyPromisePool, formatError } from '../utils/common'

// 是否为图片的判断函数
import { isImage } from '~/renderer/manage/utils/common'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// Axios
import axios from 'axios'

// 表单数据库
import FormData from 'form-data'

// 文件系统库
import fs from 'fs-extra'

// 路径处理库
import path from 'path'

// 上传下载任务队列
import UpDownTaskQueue, { commonTaskStatus } from '../datastore/upDownTaskQueue'

// 日志记录器
import { ManageLogger } from '../utils/logger'

// 取消下载任务的加载文件列表、刷新下载文件传输列表
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'

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

  constructor (bucket: string, operator: string, password: string, logger: ManageLogger, antiLeechToken?: string, expireTime?: number) {
    this.ser = new Upyun.Service(bucket, operator, password)
    this.cli = new Upyun.Client(this.ser)
    this.bucket = bucket
    this.operator = operator
    this.password = password
    this.logger = logger
    this.antiLeechToken = antiLeechToken || ''
    this.expireTime = expireTime || 24 * 60 * 60
  }

  getAntiLeechParam (key: string): string {
    const uri = `/${encodeURIComponent(key)}`.replace(/%2F/g, '/').replace(/^\/+/g, '/')
    const now = Math.round(new Date().getTime() / 1000)
    const expire = this.expireTime ? now + parseInt(this.expireTime.toString(), 10) : now + 1800
    const sign = md5(`${this.antiLeechToken}&${expire}&${uri}`, 'hex')
    const upt = `${sign.substring(12, 20)}${expire}`
    return `_upt=${upt}`
  }

  formatFolder (item: any, slicedPrefix: string) {
    const key = `${slicedPrefix}${item.name}/`
    return {
      ...item,
      key,
      fileSize: 0,
      formatedTime: '',
      fileName: item.name,
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      Key: key
    }
  }

  formatFile (item: any, slicedPrefix: string, urlPrefix: string) {
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
      key
    }
  }

  authorization (
    method: string,
    uri: string,
    contentMd5: string,
    operator: string,
    password: string
  ) {
    return `UPYUN ${operator}:${hmacSha1Base64(
      md5(password, 'hex'),
      `${method.toUpperCase()}&${encodeURI(uri)}&${new Date().toUTCString()}${contentMd5 ? `&${contentMd5}` : ''}`
    )}`
  }

  /**
   * 获取空间列表
   */
  async getBucketList (): Promise<any> {
    return this.bucket
  }

  async getBucketListRecursively (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, prefix, cancelToken } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`
    const cancelTask = [false]
    ipcMain.on(cancelDownloadLoadingFileList, (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
      }
    })
    let res = {} as any
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    const folderQueue = [prefix]
    const getFolderFile = async (folder: any) => {
      let marker = ''
      const key = folder
      do {
        res = await this.cli.listDir(key, {
          limit: 10000,
          iter: marker
        })
        if (res) {
          res.files?.forEach((item: any) => {
            item.type === 'F' && folderQueue.push(`${slicedPrefix}${item.name}/`)
            item.type === 'N' && result.fullList.push(this.formatFile(item, folder, urlPrefix))
          })
          window.webContents.send(refreshDownloadFileTransferList, result)
        } else {
          result.finished = true
          window.webContents.send(refreshDownloadFileTransferList, result)
          ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
          return
        }
        marker = res.next
      } while (!cancelTask[0] && res.next !== this.stopMarker)
    }
    while (folderQueue.length) {
      const folder = folderQueue.shift()
      await getFolderFile(folder)
    }
    result.success = !cancelTask[0]
    result.finished = true
    window.webContents.send(refreshDownloadFileTransferList, result)
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, prefix, cancelToken } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`
    let marker = ''
    const cancelTask = [false]
    ipcMain.on('cancelLoadingFileList', (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners('cancelLoadingFileList')
      }
    })
    let res = {} as any
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    do {
      res = await this.cli.listDir(prefix, {
        limit: 10000,
        iter: marker
      })
      if (res) {
        res.files?.forEach((item: any) => {
          item.type === 'N' && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          item.type === 'F' && result.fullList.push(this.formatFolder(item, slicedPrefix))
        })
        window.webContents.send('refreshFileTransferList', result)
      } else {
        result.finished = true
        window.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
      marker = res.next
    } while (!cancelTask[0] && res.next !== this.stopMarker)
    result.success = !cancelTask[0]
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
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
  async getBucketFileList (configMap: IStringKeyMap): Promise<any> {
    const { bucketName: bucket, prefix, marker, itemsPerPage } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `http://${bucket}.test.upcdn.net`
    let res = {} as any
    const result = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    res = await this.cli.listDir(prefix, {
      limit: itemsPerPage,
      iter: marker || ''
    })
    if (res) {
      res.files?.forEach((item: any) => {
        item.type === 'N' && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        item.type === 'F' && result.fullList.push(this.formatFolder(item, slicedPrefix))
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
  async renameBucketFile (configMap: IStringKeyMap): Promise<boolean> {
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
      Date: new Date().toUTCString()
    }
    const res = await axios({
      method,
      url: `http://v0.api.upyun.com${uri}`,
      headers
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
  async deleteBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    const res = await this.cli.deleteFile(key)
    return res
  }

  /**
  * delete bucket folder
  * @param configMap
  */
  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let marker = ''
    let isTruncated
    const allFileList = {
      CommonPrefixes: [] as any[],
      Contents: [] as any[]
    }
    do {
      const res = await this.cli.listDir(key, {
        limit: 10000,
        iter: marker
      })
      if (res) {
        res.files.forEach((item: any) => {
          item.type === 'N' && allFileList.Contents.push({
            ...item,
            key: `${key}${item.name}`
          })
          item.type === 'F' && allFileList.CommonPrefixes.push({
            ...item,
            key: `${key}${item.name}/`
          })
        })
        marker = res.next
        isTruncated = res.next !== this.stopMarker
      } else {
        return false
      }
    } while (isTruncated)
    if (allFileList.Contents.length > 0) {
      let success = false
      for (let i = 0; i < allFileList.Contents.length; i++) {
        const item = allFileList.Contents[i]
        success = await this.cli.deleteFile(item.key)
        if (!success) {
          return false
        }
      }
    }
    if (allFileList.CommonPrefixes.length > 0) {
      for (const item of allFileList.CommonPrefixes) {
        const res = await this.deleteBucketFolder({
          key: item.key
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
  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    fileArray.forEach((item: any) => {
      item.key = item.key.replace(/^\/+/, '')
    })
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName, fileSize } = item
      const id = `${bucketName}-${region}-${key}-${filePath}`
      if (instance.getUploadTask(id)) {
        continue
      }
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region
      })
      const date = new Date().toUTCString()
      const uri = `/${key}`
      const method = 'POST'
      const uplpadPolicy = {
        bucket: bucketName,
        'save-key': uri,
        expiration: Math.floor(Date.now() / 1000) + 2592000,
        date,
        'content-length': fileSize
      }
      const base64Policy = Buffer.from(JSON.stringify(uplpadPolicy)).toString('base64')
      const stringToSign = `${method}&/${bucketName}&${date}&${base64Policy}`
      const signature = hmacSha1Base64(md5(this.password, 'hex'), stringToSign)
      const authorization = `UPYUN ${this.operator}:${signature}`
      const form = new FormData()
      form.append('policy', base64Policy)
      form.append('authorization', authorization)
      form.append('file', fs.createReadStream(filePath), {
        filename: path.basename(key),
        contentType: getFileMimeType(fileName)
      })
      const headers = form.getHeaders()
      headers.Host = 'v0.api.upyun.com'
      headers.Date = date
      headers.Authorization = authorization
      gotUpload(instance, `http://v0.api.upyun.com/${bucketName}`, method, form, headers, id, this.logger)
    }
    return true
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    const res = await this.cli.makeDir(`/${key}`)
    return res
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const promises = [] as any
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item
      const savedFilePath = path.join(downloadPath, fileName)
      const id = `${bucketName}-${region}-${key}`
      if (instance.getDownloadTask(id)) {
        continue
      }
      instance.addDownloadTask({
        id: `${bucketName}-${region}-${key}`,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      })
      const preSignedUrl = `${customUrl}/${key}`
      promises.push(() => new Promise((resolve, reject) => {
        NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger)
          .then((res: boolean) => {
            if (res) {
              resolve(res)
            } else {
              reject(res)
            }
          })
      }))
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount)
    pool.all(promises).catch((error) => {
      this.logger.error(formatError(error, { class: 'UpyunApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default UpyunApi
