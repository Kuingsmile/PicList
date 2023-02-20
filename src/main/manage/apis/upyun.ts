// @ts-ignore
import Upyun from 'upyun'
import { md5, hmacSha1Base64, getFileMimeType, gotDownload, gotUpload } from '../utils/common'
import { isImage } from '~/renderer/manage/utils/common'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { ipcMain, IpcMainEvent } from 'electron'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs-extra'
import path from 'path'
import UpDownTaskQueue,
{
  commonTaskStatus
} from '../datastore/upDownTaskQueue'
import { ManageLogger } from '../utils/logger'

class UpyunApi {
  ser: Upyun.Service
  cli: Upyun.Client
  bucket: string
  operator: string
  password: string
  stopMarker = 'g2gCZAAEbmV4dGQAA2VvZg'
  logger: ManageLogger

  constructor (bucket: string, operator: string, password: string, logger: ManageLogger) {
    this.ser = new Upyun.Service(bucket, operator, password)
    this.cli = new Upyun.Client(this.ser)
    this.bucket = bucket
    this.operator = operator
    this.password = password
    this.logger = logger
  }

  formatFolder (item: any, slicedPrefix: string) {
    return {
      ...item,
      key: `${slicedPrefix}${item.name}/`,
      fileSize: 0,
      formatedTime: '',
      fileName: item.name,
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      Key: `${slicedPrefix}${item.name}/`
    }
  }

  formatFile (item: any, slicedPrefix: string, urlPrefix: string) {
    return {
      ...item,
      fileName: item.name,
      fileSize: item.size,
      formatedTime: new Date(parseInt(item.time) * 1000).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.name),
      url: `${urlPrefix}/${slicedPrefix}${item.name}`,
      key: `${slicedPrefix}${item.name}`
    }
  }

  authorization (
    method: string,
    uri: string,
    contentMd5: string,
    operator: string,
    password: string
  ) {
    const passwordMd5 = md5(password, 'hex')
    const date = new Date().toUTCString()
    const upperMethod = method.toUpperCase()
    let stringToSign = ''
    const codedUri = encodeURI(uri)
    if (contentMd5 === '') {
      stringToSign = `${upperMethod}&${codedUri}&${date}`
    } else {
      stringToSign = `${upperMethod}&${codedUri}&${date}&${contentMd5}`
    }
    const signature = hmacSha1Base64(passwordMd5, stringToSign)
    return `UPYUN ${operator}:${signature}`
  }

  /**
   * 获取空间列表
   */
  async getBucketList (): Promise<any> {
    return this.bucket
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
        res.files && res.files.forEach((item: any) => {
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
    result.success = true
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
      res.files && res.files.forEach((item: any) => {
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
    const { downloadPath, fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item
      const savedFilePath = path.join(downloadPath, fileName)
      const fileStream = fs.createWriteStream(savedFilePath)
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
      gotDownload(instance, preSignedUrl, fileStream, id, savedFilePath, this.logger)
    }
    return true
  }
}

export default UpyunApi
