// 是否为图片的判断函数
import { isImage } from '@/manage/utils/common'

// Axios 和 Axios 实例类型声明
import axios, { AxiosInstance } from 'axios'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// 表单数据库
import FormData from 'form-data'

// 文件系统库
import fs from 'fs-extra'

// 获取文件 MIME 类型、got 上传函数、新的下载器、并发异步任务池、错误格式化函数
import { getFileMimeType, gotUpload, NewDownloader, ConcurrencyPromisePool, formatError } from '../utils/common'

// 路径处理库
import path from 'path'

// 上传下载任务队列
import UpDownTaskQueue, { commonTaskStatus } from '../datastore/upDownTaskQueue'

// 日志记录器
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
    } while (!cancelTask[0] && res?.status === 200 && res?.data?.success && res.data.CurrentPage < res.data.TotalPages)
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
  async getBucketFileList ({ currentPage }: IStringKeyMap): Promise<any> {
    const result = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    const res = await this.axiosInstance(
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
    if (res?.status !== 200 || !res?.data?.success) return result

    if (res.data.Count === 0) return { ...result, success: true }

    res.data.data.forEach((item: any) => {
      result.fullList.push(this.formatFile(item))
    })
    result.isTruncated = res.data.CurrentPage < res.data.TotalPages
    result.nextMarker = res.data.CurrentPage + 1
    result.success = true
    return result
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
  async deleteBucketFile ({ DeleteHash }: IStringKeyMap): Promise<boolean> {
    const res = await this.axiosInstance(
      `/delete/${DeleteHash}`,
      {
        method: 'GET',
        params: {
          hash: DeleteHash,
          format: 'json'
        }
      }
    )
    return res?.status === 200 && res?.data?.success
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
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const promises = [] as any
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, downloadUrl: preSignedUrl } = item
      const savedFilePath = path.join(downloadPath, fileName)
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
      this.logger.error(formatError(error, { class: 'SmmsApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default SmmsApi
