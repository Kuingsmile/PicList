// 日志记录器
import ManageLogger from '../utils/logger'

// SSH 客户端
import SSHClient from '~/main/utils/sshClient'

// 错误格式化函数、新的下载器、并发异步任务池
import { formatError, ConcurrencyPromisePool } from '../utils/common'

// 是否为图片的判断函数
import { isImage } from '@/manage/utils/common'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// 上传下载任务队列
import UpDownTaskQueue, { commonTaskStatus } from '../datastore/upDownTaskQueue'

// 路径处理库
import path from 'path'

// 取消下载任务的加载文件列表、刷新下载文件传输列表
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'
import { Undefinable } from '~/universal/types/manage'

interface listDirResult {
  permissions: string
  isDir: boolean
  owner: string
  group: string
  size: number
  mtime: string
  filename: string
  key: string
}

class SftpApi {
  host: string
  port: number
  username: string
  password: string
  privateKey: string
  passphrase: string
  fileMode: string
  dirMode: string
  logger: ManageLogger
  ctx: SSHClient
  config: {
    host: string
    port: number
    username: string
    password: string
    privateKey: string
    passphrase: string
  }

  constructor (
    host: string,
    port: Undefinable<number>,
    username: Undefinable<string>,
    password: Undefinable<string>,
    privateKey: Undefinable<string>,
    passphrase: Undefinable<string>,
    fileMode: Undefinable<string>,
    dirMode: Undefinable<string>,
    logger: ManageLogger
  ) {
    this.host = host
    this.port = Number(port) || 22
    this.username = username || ''
    this.password = password || ''
    this.privateKey = privateKey || ''
    this.passphrase = passphrase || ''
    this.fileMode = fileMode || '0664'
    this.dirMode = dirMode || '0775'
    this.logger = logger
    this.ctx = SSHClient.instance
    this.config = {
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      privateKey: this.privateKey,
      passphrase: this.passphrase
    }
  }

  logParam = (error:any, method: string) =>
    this.logger.error(formatError(error, { class: 'SftpApi', method }))

  transFormPermission = (permissionsStr: string) => {
    const permissions = permissionsStr.length === 10 ? permissionsStr.slice(1) : permissionsStr
    let result = ''
    for (let i = 0; i < 3; i++) {
      const chunk = permissions.slice(i * 3, i * 3 + 3)
      let value = 0

      if (chunk[0] === 'r') value += 4
      if (chunk[1] === 'w') value += 2
      if (chunk[2] === 'x') value += 1

      result += value
    }

    return `0${result}`
  }

  formatFolder (item: listDirResult, urlPrefix: string, isWebPath = false) {
    const key = item.key
    let url: string
    if (isWebPath) {
      url = urlPrefix
    } else {
      if (this.username && this.password) {
        url = `sfpt://${this.username}:${this.password}@${urlPrefix}${item.filename}`
      } else {
        url = `${urlPrefix}${item.filename}`
      }
    }
    return {
      ...item,
      key,
      fileName: item.filename,
      fileSize: 0,
      Key: key,
      formatedTime: '',
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      url
    }
  }

  formatFile (item: listDirResult, urlPrefix: string, isWebPath = false) {
    const key = item.key
    return {
      ...item,
      key,
      fileName: item.filename,
      fileSize: item.size,
      Key: key,
      formatedTime: new Date(item.mtime).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.filename),
      url: isWebPath ? urlPrefix : `${urlPrefix}${item.filename}`
    }
  }

  isRequestSuccess = (code: number | null) => code === 0

  connectClient = async () => {
    try {
      await this.ctx.connect(this.config)
      if (!this.ctx.isConnected) {
        throw new Error('SSH 未连接')
      }
    } catch (error) {
      this.logParam(error, 'connectClient')
    }
  }

  async getBucketListRecursively (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { prefix, customUrl, cancelToken } = configMap
    const urlPrefix = customUrl || `${this.host}:${this.port}`
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
      await this.connectClient()
      res = await this.ctx.execCommand(`cd ${prefix} && ls -la --time-style=long-iso`)
      this.ctx.close()
      if (this.isRequestSuccess(res.code)) {
        const formatedLSRes = this.formatLSResult(res.stdout, prefix)
        if (formatedLSRes.length) {
          formatedLSRes.forEach((item: listDirResult) => {
            if (!item.isDir) {
              result.fullList.push(this.formatFile(item, urlPrefix))
            }
          })
        }
        result.success = true
      }
    } catch (error) {
      this.logParam(error, 'getBucketListRecursively')
    }
    result.finished = true
    window.webContents.send(refreshDownloadFileTransferList, result)
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
  }

  formatLSResult (res: string, cwd: string): listDirResult[] {
    const result = [] as listDirResult[]
    const resArray = res.trim().split('\n')
    resArray.slice(resArray[0].startsWith('total') ? 1 : 0).forEach((item: string) => {
      const [permissions, , owner, group, size, date, time, ...name] = item.trim().split(/\s+/)
      const filename = name.join(' ')
      if (filename === '.' || filename === '..') {
        return
      }
      const isDir = permissions.startsWith('d')
      const mtime = `${date} ${time}`
      const key = path.join(cwd, filename).replace(/\\/g, '/').replace(/^\/+/, '')
      result.push({
        permissions,
        isDir,
        owner,
        group,
        size: Number(size) || 0,
        mtime,
        filename,
        key
      })
    })
    return result
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { prefix, customUrl, cancelToken, baseDir } = configMap
    let urlPrefix = customUrl || `${this.host}:${this.port}`
    urlPrefix = urlPrefix.replace(/\/+$/, '')
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
    let res = {} as any
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    try {
      await this.connectClient()
      res = await this.ctx.execCommand(`cd ${prefix} && ls -la --time-style=long-iso`)
      this.ctx.close()
      if (this.isRequestSuccess(res.code)) {
        const formatedLSRes = this.formatLSResult(res.stdout, prefix)
        console.log(formatedLSRes)
        if (formatedLSRes.length) {
          formatedLSRes.forEach((item: listDirResult) => {
            const relativePath = path.relative(baseDir, item.key)
            const relative = webPath && urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, '/').replace(/\/+/g, '/')
            if (item.isDir) {
              result.fullList.push(this.formatFolder(item, webPath ? relative : urlPrefix, !!webPath))
            } else {
              result.fullList.push(this.formatFile(item, webPath ? relative : urlPrefix, !!webPath))
            }
          })
        }
      } else {
        result.finished = true
        window.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
    } catch (error) {
      this.logParam(error, 'getBucketListBackstage')
      result.finished = true
      window.webContents.send('refreshFileTransferList', result)
      ipcMain.removeAllListeners('cancelLoadingFileList')
      return
    }
    result.success = true
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
  }

  async renameBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { oldKey, newKey } = configMap
    let result = false
    try {
      await this.connectClient()
      const res = await this.ctx.execCommand(`mv -f ${oldKey} ${newKey}`)
      this.ctx.close()
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'renameBucketFile')
    }
    return result
  }

  async deleteBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await this.connectClient()
      const res = await this.ctx.execCommand(`rm -f ${key}`)
      this.ctx.close()
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'deleteBucketFile')
    }
    return result
  }

  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await this.connectClient()
      const res = await this.ctx.execCommand(`rm -rf ${key}`)
      this.ctx.close()
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'deleteBucketFolder')
    }
    return result
  }

  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { alias, bucketName, region, key, filePath, fileName } = item
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
        targetFileRegion: region,
        noProgress: true
      })
      instance.updateUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.failed,
        finishTime: new Date().toLocaleString()
      })
    }
    return true
  }

  async createBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await this.connectClient()
      const res = await this.ctx.execCommand(`mkdir -p ${key}`)
      this.ctx.close()
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  async downloadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const promises = [] as any
    for (const item of fileArray) {
      const { alias, bucketName, region, key, fileName } = item
      const savedFilePath = path.join(downloadPath, fileName)
      const id = `${alias}-${bucketName}-${region}-${key}`
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
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount)
    pool.all(promises).catch((error) => {
      this.logParam(error, 'downloadBucketFile')
    })
    return true
  }
}

export default SftpApi
