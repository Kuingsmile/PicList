import { constants } from 'node:fs'
import path from 'node:path'

import fs from 'fs-extra'

import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { formatError } from '~/manage/utils/common'
import ManageLogger from '~/manage/utils/logger'
import { isImage } from '~/utils/common'
import { commonTaskStatus, downloadTaskSpecialStatus, uploadTaskSpecialStatus } from '~/utils/enum'
import SSHClient, { quoteShellArgument } from '~/utils/sshClient'

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
  config: {
    host: string
    port: number
    username: string
    password: string
    privateKey: string
    passphrase: string
  }

  constructor(
    host: string,
    port: Undefinable<number>,
    username: Undefinable<string>,
    password: Undefinable<string>,
    privateKey: Undefinable<string>,
    passphrase: Undefinable<string>,
    fileMode: Undefinable<string>,
    dirMode: Undefinable<string>,
    logger: ManageLogger,
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
    this.config = {
      host: this.host,
      port: this.port,
      username: this.username,
      password: this.password,
      privateKey: this.privateKey,
      passphrase: this.passphrase,
    }
  }

  logParam = (error: any, method: string) => this.logger.error(formatError(error, { class: 'SftpApi', method }))

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

  formatFolder(item: listDirResult, urlPrefix: string, isWebPath = false) {
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
      url,
    }
  }

  formatFile(item: Pick<listDirResult, 'key' | 'filename' | 'size' | 'mtime'>, urlPrefix: string, isWebPath = false) {
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
      url: isWebPath ? urlPrefix : `${urlPrefix}${item.filename}`,
    }
  }

  isRequestSuccess = (code: number | null) => code === 0

  private async withClient<T>(action: (client: SSHClient) => Promise<T>, signal?: AbortSignal): Promise<T> {
    const client = new SSHClient()
    let closed = false
    const close = () => {
      if (!closed) client.close()
      closed = true
    }
    signal?.addEventListener('abort', close, { once: true })
    try {
      signal?.throwIfAborted()
      await client.connect(this.config)
      signal?.throwIfAborted()
      if (!client.isConnected) {
        throw new Error('SSH 未连接')
      }
      return await action(client)
    } finally {
      signal?.removeEventListener('abort', close)
      close()
    }
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { prefix, customUrl } = configMap
    const urlPrefix = customUrl || `${this.host}:${this.port}`
    const result = {
      fullList: [] as ReturnType<SftpApi['formatFile']>[],
      success: false,
      finished: false,
    }
    try {
      await listing.wait(() =>
        this.withClient(async client => {
          const directories = [path.posix.normalize(prefix)]
          while (directories.length && !listing.signal.aborted) {
            const directory = directories.pop()!
            const entries = await listing.wait(() => client.readDirectory(directory))
            if (listing.signal.aborted) break
            for (const { filename, attrs } of entries) {
              if (filename === '.' || filename === '..') continue
              const remotePath = path.posix.join(directory, filename)
              const type = attrs.mode & constants.S_IFMT
              // Do not follow symbolic links, which can escape the folder or form cycles.
              if (type === constants.S_IFDIR) {
                directories.push(remotePath)
              } else if (type === constants.S_IFREG) {
                result.fullList.push(
                  this.formatFile(
                    {
                      key: remotePath.replace(/^\/+/, ''),
                      filename,
                      size: attrs.size,
                      mtime: new Date(attrs.mtime * 1000).toISOString(),
                    },
                    urlPrefix,
                  ),
                )
              }
            }
            listing.publish(result)
          }
        }, listing.signal),
      )
      result.success = !listing.signal.aborted
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListRecursively')
    }
    result.finished = true
    listing.publish(result)
  }

  formatLSResult(res: string, cwd: string): listDirResult[] {
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
        key,
      })
    })
    return result
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { prefix, customUrl, baseDir } = configMap
    let urlPrefix = customUrl || `${this.host}:${this.port}`
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
      const res = await listing.wait(() =>
        this.withClient(
          client => client.execCommand(`cd -- ${quoteShellArgument(prefix)} && ls -la --time-style=long-iso`),
          listing.signal,
        ),
      )
      if (this.isRequestSuccess(res.code)) {
        const formatedLSRes = this.formatLSResult(res.stdout, prefix)
        if (formatedLSRes.length) {
          formatedLSRes.forEach((item: listDirResult) => {
            const relativePath = path.relative(baseDir, item.key.startsWith('/') ? item.key : `/${item.key}`)
            const relative =
              webPath && urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, '/').replace(/\/+/g, '/')
            if (item.isDir) {
              result.fullList.push(this.formatFolder(item, webPath ? relative : urlPrefix, !!webPath))
            } else {
              result.fullList.push(this.formatFile(item, webPath ? relative : urlPrefix, !!webPath))
            }
          })
        }
      } else {
        result.finished = true
        listing.publish(result)
        return
      }
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListBackstage')
      result.finished = true
      listing.publish(result)
      return
    }
    result.success = true
    result.finished = true
    listing.publish(result)
  }

  async renameBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { oldKey, newKey } = configMap
    let result = false
    try {
      const res = await this.withClient(client =>
        client.execCommand(
          `mv -f -- ${quoteShellArgument(`/${oldKey.replace(/^\/+/, '')}`)} ${quoteShellArgument(`/${newKey.replace(/^\/+/, '')}`)}`,
        ),
      )
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'renameBucketFile')
    }
    return result
  }

  async deleteBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      const res = await this.withClient(client =>
        client.execCommand(`rm -f -- ${quoteShellArgument(`/${key.replace(/^\/+/, '')}`)}`),
      )
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'deleteBucketFile')
    }
    return result
  }

  async deleteBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      if (key.replace(/^\/+/, '') === '' || key.includes('*')) {
        throw new Error('禁止删除')
      }
      const res = await this.withClient(client =>
        client.execCommand(`rm -rf -- ${quoteShellArgument(`/${key.replace(/^\/+/, '')}`)}`),
      )
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'deleteBucketFolder')
    }
    return result
  }

  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
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
        noProgress: false,
      })
      try {
        const res = await this.withClient(client =>
          client.putFile(filePath, `/${key.replace(/^\/+/, '')}`, {
            fileMode: this.fileMode,
            dirMode: this.dirMode,
          }),
        )
        if (res) {
          instance.updateUploadTask({
            id,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            finishTime: new Date().toLocaleString(),
          })
        } else {
          instance.updateUploadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: new Date().toLocaleString(),
          })
        }
      } catch (error) {
        this.logParam(error, 'uploadBucketFile')
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: new Date().toLocaleString(),
        })
      }
    }
    return true
  }

  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      const res = await this.withClient(client =>
        client.execCommand(`mkdir -p -- ${quoteShellArgument(`/${key.replace(/^\/+/, '')}`)}`),
      )
      result = this.isRequestSuccess(res.code)
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
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
        targetFilePath: savedFilePath,
      })
      try {
        await fs.ensureDir(path.dirname(savedFilePath))
        const res = await this.withClient(client => client.getFile(savedFilePath, `/${key.replace(/^\/+/, '')}`))
        if (res) {
          instance.updateDownloadTask({
            id,
            progress: 100,
            status: downloadTaskSpecialStatus.downloaded,
            finishTime: new Date().toLocaleString(),
          })
        } else {
          instance.updateDownloadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: new Date().toLocaleString(),
          })
        }
      } catch (error) {
        this.logParam(error, 'downloadBucketFile')
        instance.updateDownloadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          finishTime: new Date().toLocaleString(),
        })
      }
    }
    return true
  }
}

export default SftpApi
