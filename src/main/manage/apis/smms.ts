import { Agent } from 'node:https'
import path from 'node:path'

import windowManager from 'apis/app/window/windowManager'
import axios, { AxiosInstance } from 'axios'
import { ipcMain, IpcMainEvent } from 'electron'
import FormData from 'form-data'
import fs from 'fs-extra'

import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import { ConcurrencyPromisePool, formatError, getFileMimeType, gotUpload, NewDownloader } from '~/manage/utils/common'
import { ManageLogger } from '~/manage/utils/logger'
import { isImage } from '~/utils/common'
import { commonTaskStatus, IWindowList } from '~/utils/enum'

class SmmsApi {
  baseUrl = 'https://s.ee/api/v1'
  pageSize = 30
  token: string
  domain?: string
  customSlug?: string
  axiosInstance: AxiosInstance
  logger: ManageLogger
  timeout = 30000

  constructor(token: string, domain: string | undefined, customSlug: string | undefined, logger: ManageLogger) {
    this.token = token
    this.domain = domain?.trim() || undefined
    this.customSlug = customSlug?.trim() || undefined
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        Authorization: this.token,
      },
      httpsAgent: new Agent({
        keepAlive: true,
        timeout: this.timeout,
      }),
    })
    this.logger = logger
  }

  formatFile(item: any) {
    return {
      ...item,
      Key: item.path,
      key: item.path,
      fileName: item.filename,
      fileSize: item.size,
      formatedTime: new Date(item.created_at * 1000).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.storename),
      sha: item.hash,
      downloadUrl: item.url,
    }
  }

  private isSuccessResponse(res: any) {
    return !!(res?.status === 200 && (res?.data?.success === true || Array.isArray(res?.data?.data)))
  }

  async getBucketListBackstage(configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)
    const { cancelToken } = configMap
    let marker = 1
    const cancelTask = [false]
    ipcMain.on('cancelLoadingFileList', (_: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners('cancelLoadingFileList')
      }
    })
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    do {
      res = await this.axiosInstance('/files', {
        method: 'GET',
        params: {
          page: marker,
        },
      })
      if (this.isSuccessResponse(res)) {
        const files = Array.isArray(res.data.data) ? res.data.data : []
        if (files.length === 0) {
          result.success = true
          result.finished = true
          window?.webContents.send('refreshFileTransferList', result)
          ipcMain.removeAllListeners('cancelLoadingFileList')
          return
        } else {
          files.forEach((item: any) => {
            result.fullList.push(this.formatFile(item))
          })
          window?.webContents.send('refreshFileTransferList', result)
        }
      } else {
        result.finished = true
        window?.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
      marker++
    } while (
      !cancelTask[0] &&
      this.isSuccessResponse(res) &&
      Array.isArray(res?.data?.data) &&
      res.data.data.length >= this.pageSize
    )
    result.success = !cancelTask[0]
    result.finished = true
    window?.webContents.send('refreshFileTransferList', result)
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
  async getBucketFileList({ currentPage }: IStringKeyMap): Promise<any> {
    const result = {
      fullList: [] as any,
      isTruncated: false,
      nextMarker: '',
      success: false,
    }
    const res = await this.axiosInstance('/files', {
      method: 'GET',
      params: {
        page: currentPage,
      },
    })
    if (!this.isSuccessResponse(res)) return result

    const files = Array.isArray(res.data.data) ? res.data.data : []
    if (files.length === 0) return { ...result, success: true }

    files.forEach((item: any) => {
      result.fullList.push(this.formatFile(item))
    })
    const page = Number(currentPage) || 1
    result.isTruncated = files.length >= this.pageSize
    result.nextMarker = String(page + 1)
    result.success = true
    return result
  }

  async getBucketDomain(): Promise<string[]> {
    const res = await this.axiosInstance('/file/domains', {
      method: 'GET',
    })
    if (res?.status !== 200) return []

    const domains = res?.data?.data?.domains
    return Array.isArray(domains) ? domains : []
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
  async deleteBucketFile({ DeleteHash }: IStringKeyMap): Promise<boolean> {
    const res = await this.axiosInstance(`/file/delete/${DeleteHash}`, {
      method: 'GET',
      params: {
        hash: DeleteHash,
        format: 'json',
      },
    })
    return res?.status === 200 && res?.data?.success
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
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
        targetFileRegion: region,
      })
      const form = new FormData()
      form.append('format', 'json')
      form.append('smfile', fs.createReadStream(filePath), {
        filename: path.basename(fileName),
        contentType: getFileMimeType(fileName),
      })
      if (this.domain) {
        form.append('domain', this.domain)
      }
      if (this.customSlug) {
        form.append('custom_slug', this.customSlug)
      }
      const headers = form.getHeaders()
      headers.Authorization = this.token
      const url = `${this.baseUrl}/file/upload`
      gotUpload(instance, url, 'POST', form, headers, id, this.logger)
    }
    return true
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
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
        targetFilePath: savedFilePath,
      })
      promises.push(
        () =>
          new Promise((resolve, reject) => {
            NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger).then((res: boolean) => {
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
      this.logger.error(formatError(error, { class: 'SmmsApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default SmmsApi
