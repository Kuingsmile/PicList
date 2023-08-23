// HTTP 请求库
import got from 'got'

// 日志记录器
import { ManageLogger } from '../utils/logger'

// HTTP 代理格式化函数、是否为图片的判断函数
import { formatHttpProxy, isImage } from '~/renderer/manage/utils/common'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// got 上传函数、路径处理函数、新的下载器、获取请求代理、获取请求选项、并发异步任务池、错误格式化函数
import { gotUpload, trimPath, NewDownloader, getAgent, getOptions, ConcurrencyPromisePool, formatError } from '../utils/common'

// 上传下载任务队列
import UpDownTaskQueue, { commonTaskStatus } from '../datastore/upDownTaskQueue'

// 文件系统库
import fs from 'fs-extra'

// 路径处理库
import path from 'path'

// 取消下载任务的加载文件列表、刷新下载文件传输列表
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'

class GithubApi {
  token: string
  username: string
  logger: ManageLogger
  proxy: any
  proxyStr: string | undefined
  baseUrl = 'https://api.github.com'
  commonHeaders : IStringKeyMap

  constructor (token: string, username: string, proxy: string | undefined, logger: ManageLogger) {
    this.logger = logger
    this.token = token.startsWith('Bearer ') ? token : `Bearer ${token}`.trim()
    this.username = username
    this.proxy = proxy
    this.proxyStr = formatHttpProxy(proxy, 'string') as string | undefined
    this.commonHeaders = {
      Authorization: this.token,
      Accept: 'application/vnd.github+json'
    }
  }

  formatFolder (item: any, slicedPrefix: string) {
    const key = `${slicedPrefix ? `${slicedPrefix}/` : ''}${item.path}/`
    return {
      ...item,
      Key: key,
      key,
      fileSize: 0,
      formatedTime: '',
      fileName: item.path,
      isDir: true,
      checked: false,
      isImage: false,
      match: false
    }
  }

  formatFile (item: any, slicedPrefix: string, branch: string, repo: string, cdnUrl: string | undefined) {
    let rawUrl = ''
    const placeholders = ['{username}', '{repo}', '{branch}', '{path}']
    const key = slicedPrefix === '' ? item.path : `${slicedPrefix}/${item.path}`
    rawUrl = cdnUrl
      ? placeholders.some(item => cdnUrl.includes(item))
        ? placeholders.reduce((url, ph) => {
          const value = ph === '{username}' ? this.username : ph === '{repo}' ? repo : ph === '{branch}' ? branch : ph === '{path}' ? `${slicedPrefix}/${item.path}` : ''
          return url.replaceAll(ph, value)
        }, cdnUrl)
        : `${cdnUrl}/${key}`
      : `https://raw.githubusercontent.com/${this.username}/${repo}/${branch}/${key}`
    rawUrl = rawUrl.replace(/(?<!https?:)\/{2,}/g, '/')
    return {
      ...item,
      Key: key,
      key,
      fileSize: item.size,
      formatedTime: '',
      fileName: item.path,
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.path),
      rawUrl: item.url,
      url: rawUrl
    }
  }

  /**
     * get repo list
    */
  async getBucketList (): Promise<any> {
    let initPage = 1
    let res
    const result = [] as any[]
    do {
      res = await got(
        `${this.baseUrl}/user/repos`,
        getOptions('GET', this.commonHeaders, { page: initPage, per_page: 100 }, 'json', undefined, undefined, this.proxy)
      ) as any
      if (res.statusCode === 200) {
        res.body.forEach((item: any) => {
          result.push({
            ...item,
            Name: item.name,
            Location: item.id,
            CreationDate: item.created_at
          })
        })
      } else {
        return []
      }
      initPage++
    } while (res.body.length > 0)
    return result
  }

  /**
   * 获取branch列表
   */
  async getBucketDomain (param: IStringKeyMap): Promise<any> {
    const { bucketName: repo } = param
    let initPage = 1
    let res
    const result = [] as string[]
    do {
      res = await got(
        `${this.baseUrl}/repos/${this.username}/${repo}/branches`,
        getOptions('GET', this.commonHeaders, { page: initPage, per_page: 100 }, 'json', undefined, undefined, this.proxy)
      ) as any
      if (res.statusCode === 200) {
        res.body.forEach((item: any) => result.push(item.name))
      } else {
        return []
      }
      initPage++
    } while (res.body.length > 0)
    return result
  }

  async getBucketListRecursively (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: repo, customUrl: branch, prefix, cancelToken, cdnUrl } = configMap
    const slicedPrefix = prefix.replace(/(^\/+|\/+$)/g, '')
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
    const treeQueue = [slicedPrefix]
    while (treeQueue.length) {
      if (cancelTask[0]) {
        result.finished = true
        return result
      }
      const currentPrefix = treeQueue[0]
      res = await got(
        `${this.baseUrl}/repos/${this.username}/${repo}/git/trees/${branch}:${treeQueue.shift()}`,
        getOptions('GET', this.commonHeaders, {}, 'json', undefined, undefined, this.proxy)
      ) as any
      if (res && res.statusCode === 200) {
        const { tree } = res.body
        tree.forEach((item: any) => {
          if (item.type === 'tree') {
            treeQueue.push(`${currentPrefix}/${item.path}`)
          } else {
            result.fullList.push(this.formatFile(item, currentPrefix, branch, repo, cdnUrl))
          }
        })
        window.webContents.send(refreshDownloadFileTransferList, result)
      } else {
        result.finished = true
        window.webContents.send(refreshDownloadFileTransferList, result)
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
        return
      }
    }
    result.success = true
    result.finished = true
    window.webContents.send(refreshDownloadFileTransferList, result)
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: repo, customUrl: branch, prefix, cancelToken, cdnUrl } = configMap
    const slicedPrefix = prefix.replace(/(^\/+|\/+$)/g, '')
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
    res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/trees/${branch}:${slicedPrefix}`,
      getOptions('GET', this.commonHeaders, undefined, 'json', undefined, undefined, this.proxy)
    )
    if (res && res.statusCode === 200) {
      res.body.tree.forEach((item: any) => {
        if (item.type === 'tree') {
          result.fullList.push(this.formatFolder(item, slicedPrefix))
        } else {
          result.fullList.push(this.formatFile(item, slicedPrefix, branch, repo, cdnUrl))
        }
      })
    } else {
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
    const { bucketName: repo, githubBranch: branch, key, DeleteHash: sha } = configMap
    const body = {
      message: 'deleted by PicList',
      sha,
      branch
    }
    const res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/contents/${key}`,
      getOptions('DELETE', this.commonHeaders, undefined, 'json', JSON.stringify(body), undefined, this.proxy)
    )
    return res.statusCode === 200
  }

  /**
  * create a new tree to delete a folder
  * @param configMap
  */
  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName: repo, githubBranch: branch, key } = configMap
    // get sha of the branch
    const refRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/refs/heads/${branch}`,
      getOptions('GET', this.commonHeaders, undefined, 'json', undefined, undefined, this.proxy)
    ) as any
    if (refRes.statusCode !== 200) return false
    const refSha = refRes.body.object.sha
    // get sha of the root tree
    const rootRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/branches/${branch}`,
      getOptions('GET', undefined, undefined, 'json', undefined, undefined, this.proxy)
    ) as any
    if (rootRes.statusCode !== 200) return false
    const rootSha = rootRes.body.commit.commit.tree.sha
    // TODO: if there are more than 10000 files in the folder, it will be truncated
    // Rare cases, not considered for now
    // get sha of the folder tree
    const treeRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/trees/${branch}:${key.replace(/(^\/+|\/+$)/g, '')}`,
      getOptions('GET', this.commonHeaders, {
        recursive: true
      }, 'json', undefined, undefined, this.proxy)
    ) as any
    if (treeRes.statusCode !== 200) return false
    const oldTree = treeRes.body.tree
    // create a new tree
    const newTree = oldTree.filter((item: any) => item.type === 'blob')
      .map((item:any) => ({
        path: `${key.replace(/(^\/+|\/+$)/g, '')}/${item.path}`,
        mode: item.mode,
        type: item.type,
        sha: null
      }))
    const newTreeShaRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/trees`,
      getOptions('POST', this.commonHeaders, undefined, 'json', JSON.stringify({
        base_tree: rootSha,
        tree: newTree
      }), undefined, this.proxy)
    ) as any
    if (newTreeShaRes.statusCode !== 201) return false
    const newTreeSha = newTreeShaRes.body.sha
    // create a new commit
    const commitRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/commits`,
      getOptions('POST', this.commonHeaders, undefined, 'json', JSON.stringify({
        message: 'deleted by PicList',
        tree: newTreeSha,
        parents: [refSha]
      }), undefined, this.proxy)
    ) as any
    if (commitRes.statusCode !== 201) return false
    const commitSha = commitRes.body.sha
    // update the branch
    const updateRefRes = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/git/refs/heads/${branch}`,
      getOptions('PATCH', this.commonHeaders, undefined, 'json', JSON.stringify({
        sha: commitSha
      }), undefined, this.proxy)
    ) as any
    return updateRefRes.statusCode === 200
  }

  /**
     * 获取预签名url
     * @param configMap
     * configMap = {
     * bucketName: string,
     * region: string,
     * key: string,
     * expires: number,
     * customUrl: string
     * }
     */
  async getPreSignedUrl (configMap: IStringKeyMap): Promise<string> {
    const { bucketName: repo, customUrl: branch, key, rawUrl, githubPrivate: isPrivate } = configMap
    if (!isPrivate) return rawUrl
    const res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/contents/${key}`,
      getOptions('GET', this.commonHeaders, {
        ref: branch
      }, 'json', undefined, undefined, this.proxy)
    ) as any
    return res.statusCode === 200 ? res.body.download_url : ''
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName: repo, githubBranch: branch, key } = configMap
    const newFileKey = `${trimPath(key)}/.gitkeep`
    const base64Content = Buffer.from('created by PicList').toString('base64')
    const body = {
      message: `created a new folder named ${key} by PicList`,
      content: base64Content,
      branch
    }
    const res = await got(
      `${this.baseUrl}/repos/${this.username}/${repo}/contents/${newFileKey}`,
      getOptions('PUT', this.commonHeaders, undefined, 'json', JSON.stringify(body), undefined, this.proxy)
    )
    return res.statusCode === 201
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    fileArray.forEach((item: any) => {
      item.key.startsWith('/') && (item.key = item.key.slice(1))
    })
    const filteredFileArray = fileArray.filter((item: any) => item.fileSize < 100 * 1024 * 1024)
    for (const item of filteredFileArray) {
      const { bucketName: repo, region, githubBranch: branch, key, filePath, fileName } = item
      const id = `${repo}-${branch}-${key}-${filePath}`
      if (instance.getUploadTask(id)) {
        continue
      }
      const trimKey = trimPath(key)
      const base64Content = fs.readFileSync(filePath, { encoding: 'base64' })
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: repo,
        targetFileRegion: region
      })
      gotUpload(
        instance,
        `${this.baseUrl}/repos/${this.username}/${repo}/contents/${trimKey}`,
        'PUT',
        JSON.stringify({
          message: 'uploaded by PicList',
          branch,
          content: base64Content
        }),
        this.commonHeaders,
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
      const { bucketName: repo, customUrl: branch, key, fileName, githubPrivate, githubUrl } = item
      const id = `${repo}-${branch}-${key}-${fileName}`
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
      let downloadUrl: string
      if (githubPrivate) {
        const preSignedUrl = await this.getPreSignedUrl({
          bucketName: repo,
          customUrl: branch,
          key,
          rawUrl: githubUrl,
          githubPrivate
        })
        downloadUrl = preSignedUrl
      } else {
        downloadUrl = githubUrl
      }
      promises.push(() => new Promise((resolve, reject) => {
        NewDownloader(
          instance,
          downloadUrl,
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
      this.logger.error(formatError(error, { class: 'GithubApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default GithubApi
