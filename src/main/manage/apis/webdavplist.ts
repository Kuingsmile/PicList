import ManageLogger from '../utils/logger'
import { createClient, WebDAVClient, FileStat } from 'webdav'
import { formatError, formatEndpoint, getInnerAgent } from '../utils/common'
import { isImage } from '@/manage/utils/common'
import http from 'http'
import https from 'https'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { ipcMain, IpcMainEvent } from 'electron'

class WebdavplistApi {
  endpoint: string
  username: string
  password: string
  sslEnabled: boolean
  proxy: string | undefined
  logger: ManageLogger
  agent: https.Agent | http.Agent
  ctx: WebDAVClient

  constructor (endpoint: string, username: string, password: string, sslEnabled: boolean, proxy: string | undefined, logger: ManageLogger) {
    this.endpoint = formatEndpoint(endpoint, sslEnabled)
    this.username = username
    this.password = password
    this.sslEnabled = sslEnabled
    this.proxy = proxy
    this.logger = logger
    this.agent = getInnerAgent(proxy, sslEnabled).agent
    this.ctx = createClient(
      this.endpoint,
      {
        username: this.username,
        password: this.password,
        maxBodyLength: 4 * 1024 * 1024 * 1024,
        maxContentLength: 4 * 1024 * 1024 * 1024,
        httpsAgent: sslEnabled ? this.agent : undefined,
        httpAgent: !sslEnabled ? this.agent : undefined
      }
    )
  }

  logParam = (error:any, method: string) =>
    this.logger.error(formatError(error, { class: 'WebdavplistApi', method }))

  formatFolder (item: FileStat, urlPrefix: string) {
    return {
      ...item,
      key: item.filename.replace(/^\/+/, ''),
      fileName: item.basename,
      fileSize: 0,
      Key: item.filename.replace(/^\/+/, ''),
      formatedTime: '',
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      url: `${urlPrefix}${item.filename}`
    }
  }

  formatFile (item: FileStat, urlPrefix: string) {
    return {
      ...item,
      key: item.filename.replace(/^\/+/, ''),
      fileName: item.basename,
      fileSize: item.size,
      Key: item.filename.replace(/^\/+/, ''),
      formatedTime: new Date(item.lastmod).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.basename),
      url: `${urlPrefix}${item.filename}`
    }
  }

  isRequestSuccess = (code: number) => code >= 200 && code < 300

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { prefix, customUrl, cancelToken } = configMap
    const urlPrefix = customUrl || this.endpoint
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
      res = await this.ctx.getDirectoryContents(prefix, {
        deep: false,
        details: true
      })
      if (this.isRequestSuccess(res.status)) {
        if (res.data && res.data.length) {
          res.data.forEach((item: FileStat) => {
            if (item.type === 'directory') {
              result.fullList.push(this.formatFolder(item, urlPrefix))
            } else {
              result.fullList.push(this.formatFile(item, urlPrefix))
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
    }
    result.success = true
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
  }
}

export default WebdavplistApi
