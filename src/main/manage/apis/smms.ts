import { Agent } from 'node:https'
import path from 'node:path'

import axios, { AxiosInstance } from 'axios'
import FormData from 'form-data'
import fs from 'fs-extra'

import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { ConcurrencyPromisePool, formatError, getFileMimeType, gotUpload, NewDownloader } from '~/manage/utils/common'
import { ManageLogger } from '~/manage/utils/logger'
import { isImage } from '~/utils/common'
import { commonTaskStatus } from '~/utils/enum'

const FILE_HISTORY_PAGE_SIZE = 30

class SmmsApi {
  baseUrl = 'https://s.ee/api/v1'
  token: string
  axiosInstance: AxiosInstance
  logger: ManageLogger
  timeout = 30000

  constructor(token: string, logger: ManageLogger) {
    this.token = token
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

  private hasMoreFiles({ data, CurrentPage, TotalPages }: IStringKeyMap): boolean {
    if (data.length === 0) return false

    // Keep legacy SM.MS counters when available, including numeric strings.
    const currentPage = Number(CurrentPage)
    const totalPages = Number(TotalPages)
    if (Number.isInteger(currentPage) && currentPage > 0 && Number.isInteger(totalPages) && totalPages > 0) {
      return currentPage < totalPages
    }

    // S.EE omits counters; a full page requires checking the following page.
    return data.length >= FILE_HISTORY_PAGE_SIZE
  }

  async getBucketListBackstage(_configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    let marker = 1
    let res: any
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    do {
      res = await listing.wait(() =>
        this.axiosInstance('/files', {
          method: 'GET',
          signal: listing.signal,
          params: {
            page: marker,
          },
        }),
      )
      if (res && res.status === 200 && res.data && res.data.success) {
        if (res.data.data.length === 0) {
          result.success = true
          result.finished = true
          listing.publish(result)
          return
        } else {
          res.data.data.forEach((item: any) => {
            result.fullList.push(this.formatFile(item))
          })
          listing.publish(result)
        }
      } else {
        result.finished = true
        listing.publish(result)
        return
      }
      marker++
    } while (!listing.signal.aborted && this.hasMoreFiles(res.data))
    result.success = !listing.signal.aborted
    result.finished = true
    listing.publish(result)
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
  async getBucketFileList({ currentPage }: IStringKeyMap, listing: ListingContext): Promise<any> {
    const requestedPage = Number(currentPage)
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    const result = {
      fullList: [] as any,
      isTruncated: false,
      nextMarker: '',
      success: false,
    }
    const res = await listing.wait(() =>
      this.axiosInstance('/files', {
        method: 'GET',
        signal: listing.signal,
        params: {
          page,
        },
      }),
    )
    if (res?.status !== 200 || !res?.data?.success) return result

    if (res.data.data.length === 0) return { ...result, success: true }

    res.data.data.forEach((item: any) => {
      result.fullList.push(this.formatFile(item))
    })
    return {
      ...result,
      isTruncated: this.hasMoreFiles(res.data),
      nextMarker: page + 1,
      success: true,
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
