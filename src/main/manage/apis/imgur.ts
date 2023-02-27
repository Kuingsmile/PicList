import got from 'got'
import ManageLogger from '../utils/logger'
import { getAgent, getOptions, NewDownloader, gotUpload, getFileMimeType, ConcurrencyPromisePool, formatError } from '../utils/common'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { ipcMain, IpcMainEvent } from 'electron'
import { formatHttpProxy, isImage } from '~/renderer/manage/utils/common'
import path from 'path'
import UpDownTaskQueue,
{
  commonTaskStatus
} from '../datastore/upDownTaskQueue'
import FormData from 'form-data'
import fs from 'fs-extra'

class ImgurApi {
  userName: string
  accessToken: string
  proxy: any
  logger: ManageLogger
  proxyStr: string | undefined
  tokenHeaders: any
  idHeaders: any
  baseUrl = 'https://api.imgur.com/3'

  constructor (userName: string, accessToken: string, proxy: any, logger: ManageLogger) {
    this.userName = userName
    this.accessToken = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
    this.proxy = proxy
    this.proxyStr = formatHttpProxy(proxy, 'string') as string | undefined
    this.logger = logger
    this.tokenHeaders = {
      Authorization: this.accessToken
    }
  }

  formatFile (item: any) {
    return {
      ...item,
      Key: path.basename(item.link),
      key: path.basename(item.link),
      fileName: `${item.name}${path.extname(item.link)}`,
      formatedTime: new Date(item.datetime * 1000).toLocaleString(),
      fileSize: item.size,
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(path.basename(item.link)),
      url: item.link,
      sha: item.deletehash
    }
  }

  /**
  * get repo list
  */
  async getBucketList (): Promise<any> {
    let initPage = 0
    let res
    const result = [] as any[]
    do {
      res = await got(
        `${this.baseUrl}/account/${this.userName}/albums/ids/${initPage}`,
        getOptions('GET', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy)
      ) as any
      if (res.statusCode === 200 && res.body.success) {
        res.body.data.forEach((item: any) => {
          result.push(item)
        })
      } else {
        return []
      }
      initPage++
    } while (res.body.data.length > 0)
    const finalResult = [] as any[]
    for (let i = 0; i < result.length; i++) {
      const item = result[i]
      const res = await got(
        `${this.baseUrl}/account/${this.userName}/album/${item}`,
        getOptions('GET', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy)
      ) as any
      if (res.statusCode === 200 && res.body.success) {
        finalResult.push({
          ...res.body.data,
          Name: res.body.data.title,
          Location: res.body.data.id,
          CreationDate: res.body.data.datetime
        })
      } else {
        return []
      }
    }
    finalResult.push({
      Name: '全部',
      Location: 'unclassified',
      CreationDate: new Date().getTime()
    })
    return finalResult
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketConfig: { Location: albumHash }, cancelToken } = configMap
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
    if (albumHash !== 'unclassified') {
      res = await got(
        `${this.baseUrl}/account/${this.userName}/album/${albumHash}`,
        getOptions('GET', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy)
      ) as any
      if (res.statusCode === 200 && res.body.success) {
        res.body.data.images.forEach((item: any) => {
          result.fullList.push(this.formatFile(item))
        })
      } else {
        result.finished = true
        window.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
    } else {
      let initPage = 0
      do {
        res = await got(
          `${this.baseUrl}/account/${this.userName}/images/${initPage}`,
          getOptions('GET', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy)
        ) as any
        if (res.statusCode === 200 && res.body.success) {
          res.body.data.forEach((item: any) => {
            result.fullList.push(this.formatFile(item))
          })
        } else {
          result.finished = true
          window.webContents.send('refreshFileTransferList', result)
          ipcMain.removeAllListeners('cancelLoadingFileList')
          return
        }
        initPage++
      } while (res.body.data.length > 0 && !cancelTask[0])
    }
    result.success = !cancelTask[0]
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
  }

  async deleteBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { DeleteHash: deleteHash } = configMap
    const res = await got(
      `${this.baseUrl}/account/${this.userName}/image/${deleteHash}`,
      getOptions('DELETE', this.tokenHeaders, undefined, 'json', undefined, undefined, this.proxy)
    ) as any
    return res.statusCode === 200 && res.body.success
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    fileArray.forEach((item: any) => {
      item.key = item.key.replace(/^\/+/, '')
    })
    for (const item of fileArray) {
      const { bucketName, region: albumHash, key, fileName, filePath, fileSize } = item
      const id = `${albumHash}-${key}-${filePath}`
      if (instance.getUploadTask(id) || fileSize > 1024 * 1024 * 200) {
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
        targetFileRegion: albumHash
      })
      const form = new FormData()
      form.append('type', 'file')
      form.append('description', 'uploaded by PicList')
      form.append('name', path.basename(key, path.extname(key)))
      if (fileSize > 1024 * 1024 * 10) {
        form.append('video', fs.createReadStream(filePath), {
          filename: path.basename(key),
          contentType: getFileMimeType(fileName)
        })
      } else {
        form.append('image', fs.createReadStream(filePath), {
          filename: path.basename(key),
          contentType: getFileMimeType(fileName)
        })
      }
      albumHash !== 'unclassified' && form.append('album', albumHash)
      const headers = form.getHeaders()
      headers.Authorization = this.accessToken
      gotUpload(
        instance,
        `${this.baseUrl}/image`,
        'POST',
        form,
        headers,
        id,
        this.logger,
        30000,
        false,
        getAgent(this.proxy)
      )
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
      const { bucketName, region, key, fileName, githubUrl: url } = item
      const id = `${bucketName}-${region}-${key}-${fileName}`
      const savedFilePath = path.join(downloadPath, fileName)
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
        NewDownloader(
          instance,
          url,
          id,
          savedFilePath,
          this.logger,
          this.proxyStr
        )
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
      this.logger.error(formatError(error, { class: 'ImgurApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default ImgurApi
