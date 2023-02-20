import { isImage } from '@/manage/utils/common'
import axios, { AxiosInstance } from 'axios'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { ipcMain, IpcMainEvent } from 'electron'
import FormData from 'form-data'
import fs from 'fs-extra'
import { getFileMimeType, gotUpload, gotDownload } from '../utils/common'
import path from 'path'
import UpDownTaskQueue, { commonTaskStatus } from '../datastore/upDownTaskQueue'
import { ManageLogger } from '../utils/logger'

class SmmsApi {
  baseUrl = 'https://smms.app/api/v2'
  token: string
  axiosInstance: AxiosInstance
  logger: ManageLogger
  timeout = 30000

  constructor (token: string, logger: ManageLogger) {
    this.token = token
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        Authorization: this.token
      },
      httpsAgent: new (require('https').Agent)({
        keepAlive: true,
        timeout: this.timeout
      })
    })
    this.logger = logger
  }

  formatFile (item: any) {
    return {
      ...item,
      Key: item.path,
      key: item.path,
      fileName: item.filename,
      fileSize: item.size,
      formatedTime: new Date(item.created_at).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.storename),
      sha: item.hash,
      downloadUrl: item.url
    }
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { cancelToken } = configMap
    let marker = 1
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
      res = await this.axiosInstance(
        '/upload_history',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          params: {
            page: marker
          }
        })
      if (res && res.status === 200 && res.data && res.data.success) {
        if (res.data.Count === 0) {
          result.success = true
          result.finished = true
          window.webContents.send('refreshFileTransferList', result)
          ipcMain.removeAllListeners('cancelLoadingFileList')
          return
        } else {
          res.data.data.forEach((item: any) => {
            result.fullList.push(this.formatFile(item))
          })
          window.webContents.send('refreshFileTransferList', result)
        }
      } else {
        result.finished = true
        window.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
      marker++
    } while (!cancelTask[0] && res && res.status === 200 && res.data && res.data.success && res.data.CurrentPage < res.data.TotalPages)
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
    const { currentPage } = configMap
    let res = {} as any
    const result = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    res = await this.axiosInstance(
      '/upload_history',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          page: currentPage
        }
      }
    )
    if (res && res.status === 200 && res.data && res.data.success) {
      if (res.data.Count === 0) {
        result.success = true
        return result
      }
      res.data.data.forEach((item: any) => {
        result.fullList.push(this.formatFile(item))
      })
      result.isTruncated = res.data.CurrentPage < res.data.TotalPages
      result.nextMarker = res.data.CurrentPage + 1
      result.success = true
      return result
    } else {
      return result
    }
  }

  /**
  * 删除文件
  * @param configMap
  * configMap = {
  * bucketName: string,
  * region: string,
  * key: string,
  * DeleteHash: string
  * }
  */
  async deleteBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { DeleteHash } = configMap
    const params = {
      hash: DeleteHash,
      format: 'json'
    }
    const res = await this.axiosInstance(
      `/delete/${DeleteHash}`,
      {
        method: 'GET',
        params
      }
    )
    return res && res.status === 200 && res.data && res.data.success
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName } = item
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
      const form = new FormData()
      form.append('format', 'json')
      form.append('smfile', fs.createReadStream(filePath), {
        filename: path.basename(fileName),
        contentType: getFileMimeType(fileName)
      })
      const headers = form.getHeaders()
      headers.Authorization = this.token
      const url = `${this.baseUrl}/upload`
      gotUpload(instance, url, 'POST', form, headers, id, this.logger)
    }
    return true
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, downloadUrl: preSignedUrl } = item
      const savedFilePath = path.join(downloadPath, fileName)
      const fileStream = fs.createWriteStream(savedFilePath)
      const id = `${bucketName}-${region}-${key}`
      if (instance.getDownloadTask(id)) {
        continue
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      })
      gotDownload(instance, preSignedUrl, fileStream, id, savedFilePath, this.logger)
    }
    return true
  }
}

export default SmmsApi
