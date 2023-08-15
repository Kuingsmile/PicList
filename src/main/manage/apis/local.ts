// 日志记录器
import ManageLogger from '../utils/logger'

// 错误格式化函数、端点地址格式化函数、获取内部代理、新的下载器、并发异步任务池
import { formatError } from '../utils/common'

// HTTP 代理格式化函数、是否为图片的判断函数
import { isImage } from '@/manage/utils/common'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// 上传下载任务队列
import UpDownTaskQueue, { uploadTaskSpecialStatus, commonTaskStatus, downloadTaskSpecialStatus } from '../datastore/upDownTaskQueue'

// 文件系统库
import fs from 'fs-extra'

// 路径处理库
import path from 'path'
import * as fsWalk from '@nodelib/fs.walk'

// 取消下载任务的加载文件列表、刷新下载文件传输列表
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'

class LocalApi {
  logger: ManageLogger
  isWindows: boolean

  constructor (logger: ManageLogger) {
    this.logger = logger
    this.isWindows = process.platform === 'win32'
  }

  logParam = (error:any, method: string) =>
    this.logger.error(formatError(error, { class: 'LocalApi', method }))

  // windows 系统下将路径转换为 unix 风格
  transPathToUnix (filePath: string | undefined) {
    if (!filePath) return ''
    return this.isWindows ? filePath.split(path.sep).join(path.posix.sep) : filePath.replace(/^\/+/, '')
  }

  transBack (filePath: string | undefined) {
    if (!filePath) return ''
    return this.isWindows
      ? filePath.split(path.posix.sep).join(path.sep).replace(/^\\+|\\+$/g, '')
      : `/${filePath.replace(/^\/+|\/+$/g, '')}`
  }

  formatFolder (item: fs.Stats, urlPrefix: string, fileName: string, filePath: string) {
    const key = `${this.transPathToUnix(filePath)}/`.replace(/\/+$/, '/')
    return {
      ...item,
      key,
      fileName,
      fileSize: 0,
      Key: key,
      formatedTime: '',
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      url: urlPrefix
    }
  }

  formatFile (item: fs.Stats, urlPrefix: string, fileName: string, filePath: string, isDownload = false) {
    const key = isDownload ? filePath : this.transPathToUnix(filePath)
    return {
      ...item,
      key,
      fileName,
      fileSize: item.size,
      Key: key,
      formatedTime: new Date(item.mtime).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName),
      url: urlPrefix
    }
  }

  async getBucketListRecursively (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { prefix, customUrl = '', cancelToken } = configMap
    const urlPrefix = customUrl.replace(/\/+$/, '')
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
    try {
      res = fsWalk.walkSync(this.transBack(prefix), {
        followSymbolicLinks: true,
        fs,
        stats: true,
        throwErrorOnBrokenSymbolicLink: false
      })
      if (res.length) {
        result.fullList.push(
          ...res
            .filter((item: fsWalk.Entry) => item.stats?.isFile())
            .map((item: any) => this.formatFile(item, urlPrefix, item.name, item.path, true))
        )
        result.success = true
      }
    } catch (error) {
      this.logParam(error, 'getBucketListRecursively')
    }
    result.finished = true
    window.webContents.send(refreshDownloadFileTransferList, result)
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { customUrl = '', cancelToken, baseDir } = configMap
    let prefix = configMap.prefix
    prefix = this.transBack(prefix)
    const urlPrefix = customUrl.replace(/\/+$/, '')
    let webPath = configMap.webPath || ''
    if (webPath && customUrl && webPath !== '/') {
      webPath = webPath.replace(/^\/+|\/+$/, '')
    }

    const cancelTask = [false]
    ipcMain.on('cancelLoadingFileList', (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners('cancelLoadingFileList')
      }
    })
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    try {
      const res = await fs.readdir(prefix, {
        withFileTypes: true
      })
      if (res.length) {
        let urlPrefixF
        res.forEach((item: fs.Dirent) => {
          const pathOfFile = path.join(prefix, item.name)
          let relative
          if (customUrl) {
            const relativePath = path.relative(this.transBack(baseDir), pathOfFile)
            relative = urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, '/').replace(/\/+/g, '/')
            urlPrefixF = this.isWindows ? relative.replace(/\/[a-zA-Z]:\//, '/') : relative
          } else {
            urlPrefixF = pathOfFile
          }
          const stats = fs.statSync(pathOfFile)
          if (item.isDirectory()) {
            result.fullList.push(this.formatFolder(stats, urlPrefixF, item.name, pathOfFile))
          } else {
            result.fullList.push(this.formatFile(stats, urlPrefixF, item.name, pathOfFile))
          }
        })
        result.success = true
      }
    } catch (error) {
      this.logParam(error, 'getBucketListBackstage')
    }
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
  }

  async renameBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { oldKey, newKey } = configMap
    let result = false
    try {
      await fs.rename(this.transBack(oldKey), this.transBack(newKey))
      result = true
    } catch (error) {
      this.logParam(error, 'renameBucketFile')
    }
    return result
  }

  async deleteBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await fs.remove(this.transBack(key))
      result = true
    } catch (error) {
      this.logParam(error, 'deleteBucketFile')
    }
    return result
  }

  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await fs.rm(this.transBack(key), {
        recursive: true
      })
      result = true
    } catch (error) {
      this.logParam(error, 'deleteBucketFolder')
    }
    return result
  }

  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { alias, bucketName, key, filePath, fileName } = item
      const id = `${alias}-${bucketName}-${key}-${filePath}`
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
        targetFileRegion: '',
        noProgress: true
      })
      try {
        fs.ensureFileSync(this.transBack(key))
        await fs.copyFile(filePath, this.transBack(key))
        instance.updateUploadTask({
          id,
          progress: 100,
          status: uploadTaskSpecialStatus.uploaded,
          finishTime: new Date().toLocaleString()
        })
      } catch (error) {
        this.logParam(error, 'uploadBucketFile')
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: new Date().toLocaleString()
        })
      }
    }
    return true
  }

  async createBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await fs.mkdir(this.transBack(key), {
        recursive: true
      })
      result = true
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  async downloadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { alias, bucketName, key, fileName } = item
      const savedFilePath = path.join(downloadPath, fileName.replace(/[:*?"<>|]/g, ''))
      const id = `${alias}-${bucketName}-local-${key}`
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
      try {
        fs.ensureFileSync(savedFilePath)
        await fs.copyFile(this.transBack(key), savedFilePath)
        instance.updateDownloadTask({
          id,
          progress: 100,
          status: downloadTaskSpecialStatus.downloaded,
          finishTime: new Date().toLocaleString()
        })
      } catch (error) {
        this.logParam(error, 'downloadBucketFile')
        instance.updateDownloadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: new Date().toLocaleString()
        })
      }
    }
    return true
  }
}

export default LocalApi
