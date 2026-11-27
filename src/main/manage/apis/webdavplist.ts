import { readFile } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'

import { AuthType, createClient, FileStat, ProgressEvent, WebDAVClient, WebDAVClientOptions } from 'webdav'

import { formatEndpoint } from '#/utils/url'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import { encodeObjectPath, formatError, getInnerAgent } from '~/manage/utils/common'
import { scheduleHttpDownloads } from '~/manage/utils/downloadBatch'
import ManageLogger from '~/manage/utils/logger'
import { MIB, scheduleUploadBatch, withUploadStream } from '~/manage/utils/uploadFile'
import { getAuthHeader } from '~/utils/digestAuth'
import { isImage } from '~/utils/filesystem'
import { formatHttpProxy } from '~/utils/network'
import { scopedRemotePath } from '~/utils/scopedPath'

class WebdavplistApi {
  endpoint: string
  username: string
  password: string
  sslEnabled: boolean
  proxy: string | undefined
  proxyStr: string | undefined
  authType: 'basic' | 'digest' | undefined
  logger: ManageLogger
  agent: https.Agent | http.Agent
  ctx: WebDAVClient

  constructor(
    endpoint: string,
    username: string,
    password: string,
    sslEnabled: boolean,
    proxy: string | undefined,
    authType: 'basic' | 'digest' | undefined,
    logger: ManageLogger,
    readonly baseDir: string,
  ) {
    this.endpoint = formatEndpoint(endpoint, sslEnabled)
    this.username = username
    this.password = password
    this.sslEnabled = sslEnabled
    this.proxy = proxy
    this.proxyStr = formatHttpProxy(proxy, 'string') as string | undefined
    this.authType = authType || 'basic'
    this.logger = logger
    this.agent = getInnerAgent(proxy, sslEnabled).agent
    const options: WebDAVClientOptions = {
      username: this.username,
      password: this.password,
      maxBodyLength: 4 * 1024 * 1024 * 1024,
      maxContentLength: 4 * 1024 * 1024 * 1024,
      httpsAgent: sslEnabled ? this.agent : undefined,
      httpAgent: !sslEnabled ? this.agent : undefined,
    }
    if (this.authType === 'digest') {
      options.authType = AuthType.Digest
    }
    this.ctx = createClient(this.endpoint, options)
  }

  logParam = (error: any, method: string) => this.logger.error(formatError(error, { class: 'WebdavplistApi', method }))

  destroy() {
    this.agent.destroy()
  }

  scopedPath(key: string, allowBase = false): string {
    if (key.includes('\\')) throw new Error('Invalid WebDAV path separator')
    return scopedRemotePath(this.baseDir, key, allowBase)
  }

  formatFolder(item: FileStat, urlPrefix: string, isWebPath = false) {
    const key = item.filename.replace(/^\/+/, '')
    return {
      ...item,
      key,
      fileName: item.basename,
      fileSize: 0,
      Key: key,
      formatedTime: '',
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      url: isWebPath ? urlPrefix : `${urlPrefix}${item.filename}`,
    }
  }

  formatFile(item: FileStat, urlPrefix: string, isWebPath = false) {
    const key = item.filename.replace(/^\/+/, '')
    return {
      ...item,
      key,
      fileName: item.basename,
      fileSize: item.size,
      Key: key,
      formatedTime: new Date(item.lastmod).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.basename),
      url: isWebPath ? urlPrefix : `${urlPrefix}${item.filename}`,
    }
  }

  isRequestSuccess = (code: number) => code >= 200 && code < 300

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { prefix, customUrl } = configMap
    const urlPrefix = customUrl || this.endpoint
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    try {
      const res = (await listing.wait(() =>
        this.ctx.getDirectoryContents(this.scopedPath(prefix, true), {
          deep: true,
          details: true,
          signal: listing.signal,
        }),
      )) as any
      if (this.isRequestSuccess(res.status)) {
        if (res.data?.length) {
          res.data.forEach((item: FileStat) => {
            if (item.type !== 'directory') {
              result.fullList.push(this.formatFile(item, urlPrefix))
            }
          })
        }
        result.success = true
      }
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListRecursively')
    }
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { prefix, customUrl, baseDir } = configMap
    let urlPrefix = customUrl || this.endpoint
    urlPrefix = urlPrefix.replace(/\/+$/, '')
    let webPath = configMap.webPath || ''
    if (webPath && customUrl && webPath !== '/') {
      webPath = webPath.replace(/^\/+|\/+$/, '')
    }
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    try {
      const res = (await listing.wait(() =>
        this.ctx.getDirectoryContents(this.scopedPath(prefix, true), {
          deep: false,
          details: true,
          signal: listing.signal,
        }),
      )) as any
      if (this.isRequestSuccess(res.status)) {
        if (res.data?.length) {
          res.data.forEach((item: FileStat) => {
            const relativePath = path.relative(baseDir, item.filename)
            const relative =
              webPath && urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, '/').replace(/\/+/g, '/')
            if (item.type === 'directory') {
              result.fullList.push(this.formatFolder(item, webPath ? relative : urlPrefix, !!webPath))
            } else {
              result.fullList.push(this.formatFile(item, webPath ? relative : urlPrefix, !!webPath))
            }
          })
        }
      } else {
        result.finished = true
        await listing.publish(result)
        result.fullList = []
        return
      }
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListBackstage')
      result.finished = true
      await listing.publish(result)
      result.fullList = []
      return
    }
    result.success = true
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async renameBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { oldKey, newKey } = configMap
    let result = false
    try {
      await this.ctx.moveFile(this.scopedPath(oldKey), this.scopedPath(newKey))
      result = true
    } catch (error) {
      this.logParam(error, 'renameBucketFile')
    }
    return result
  }

  async deleteBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      const target = this.scopedPath(key)
      const stat = (await this.ctx.stat(target)) as FileStat
      if (stat.type !== 'file') return false
      await this.ctx.deleteFile(target)
      result = true
    } catch (error) {
      this.logParam(error, 'deleteBucketFile')
    }
    return result
  }

  async deleteBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await this.ctx.deleteFile(this.scopedPath(key))
      result = true
    } catch (error) {
      this.logParam(error, 'deleteBucketFolder')
    }
    return result
  }

  async getPreSignedUrl(configMap: IStringKeyMap): Promise<string> {
    const { key } = configMap
    let result = ''
    try {
      const res = this.ctx.getFileDownloadLink(this.scopedPath(key))
      result = res
    } catch (error) {
      this.logParam(error, 'getPreSignedUrl')
    }
    return result
  }

  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleUploadBatch(
      configMap,
      {
        provider: 'webdavplist',
        account: [this.endpoint, this.username],
        maxFileSize: 4 * 1024 * MIB,
        memory: file => (this.authType === 'digest' ? file.fileSize * 2 + MIB : MIB),
      },
      async ({ key, filePath }, { signal, progress }) => {
        const target = this.scopedPath(key)
        const options = {
          overwrite: true,
          signal,
          onUploadProgress: (event: ProgressEvent) => progress(event.total ? (event.loaded / event.total) * 100 : 0),
        }
        const result =
          this.authType === 'digest'
            ? await this.ctx.putFileContents(target, await readFile(filePath, { signal }), options)
            : await withUploadStream(filePath, signal, source => this.ctx.putFileContents(target, source, options))
        if (!result) throw new TransferError('provider')
      },
    )
  }

  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await this.ctx.createDirectory(this.scopedPath(key), {
        recursive: true,
      })
      result = true
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleHttpDownloads(configMap, this.logger, async (item, signal) => {
      const key = this.scopedPath(item.key)
      const target = new URL(this.endpoint)
      target.pathname = `${target.pathname.replace(/\/+$/, '')}/${encodeObjectPath(key.replace(/^\/+/, ''))}`
      target.hash = ''
      const authorization =
        this.authType === 'digest'
          ? await getAuthHeader(
              'GET',
              target.href,
              this.username,
              this.password,
              '',
              signal,
              this.proxyStr ? this.agent : undefined,
            )
          : `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
      return {
        url: target.href,
        headers: { authorization },
        agent: this.proxyStr ? { [target.protocol === 'https:' ? 'https' : 'http']: this.agent } : undefined,
      }
    })
  }
}

export default WebdavplistApi
