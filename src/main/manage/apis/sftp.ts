import { constants } from 'node:fs'
import path from 'node:path'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'

import type { FileEntry } from 'ssh2'

import { LISTING_PAGE_ITEMS } from '#/listing'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { createDownloadTask, formatError, runDownloadTask } from '~/manage/utils/common'
import ManageLogger from '~/manage/utils/logger'
import { onUploadAbort, scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/common'
import SSHClient from '~/utils/sshClient'

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

// SFTP attributes are optional on the wire, even though ssh2's types mark them as required.
const hasListingStats = (attrs: FileEntry['attrs']) =>
  Number.isFinite(attrs.mode) &&
  (attrs.mode & constants.S_IFMT) !== 0 &&
  Number.isFinite(attrs.size) &&
  Number.isFinite(attrs.mtime)

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

  private async withClient<T>(action: (client: SSHClient) => Promise<T>, signal?: AbortSignal): Promise<T> {
    const client = new SSHClient()
    let closed = false
    const close = () => {
      if (!closed) {
        closed = true
        client.close()
      }
    }
    signal?.addEventListener('abort', close, { once: true })
    try {
      signal?.throwIfAborted()
      await client.connect(this.config)
      signal?.throwIfAborted()
      if (!client.isConnected) {
        throw new Error('SSH client is not connected')
      }
      return await action(client)
    } finally {
      signal?.removeEventListener('abort', close)
      close()
    }
  }

  /** Use protocol attributes only; skip links/special files and fail on permission or metadata errors. */
  private async *walkDirectory(prefix: string, listing: ListingContext, client: SSHClient, recursive: boolean) {
    const directories = [path.posix.normalize(prefix).replace(/\/+$/, '') || '/']
    let isRoot = true
    while (directories.length) {
      const directory = directories.pop()!
      // Recheck queued directories in case an entry was replaced by a symbolic link.
      const stats = await listing.wait(() => client.lstat(directory))
      const type = stats.mode & constants.S_IFMT
      if (type === constants.S_IFLNK && !isRoot) continue
      if (type !== constants.S_IFDIR) throw new Error('Listing path must be a directory without a symbolic link')
      isRoot = false
      const entries = await listing.wait(() => client.readDirectory(directory))
      let scanned = 0
      for (const entry of entries) {
        listing.signal.throwIfAborted()
        // Even a directory containing only links must yield to cancellation and timers.
        if (++scanned % 64 === 0) await listing.wait(() => yieldToEventLoop())
        if (entry.filename === '.' || entry.filename === '..') continue
        if (!entry.filename || /[/\0]/.test(entry.filename)) throw new Error('Invalid SFTP directory entry')
        let { attrs } = entry
        if ((attrs.mode & constants.S_IFMT) === constants.S_IFLNK) continue
        const filePath = path.posix.join(directory, entry.filename)
        if (!hasListingStats(attrs)) attrs = await listing.wait(() => client.lstat(filePath))
        const type = attrs.mode & constants.S_IFMT
        if (!Number.isFinite(attrs.mode) || !type) throw new Error('SFTP entry is missing its file type')
        if (type !== constants.S_IFDIR && type !== constants.S_IFREG) continue
        if (!hasListingStats(attrs)) throw new Error('SFTP entry is missing listing metadata')
        if (type === constants.S_IFDIR && recursive) directories.push(filePath)
        else yield this.formatEntry({ ...entry, attrs }, directory)
      }
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
          for await (const item of this.walkDirectory(prefix, listing, client, true)) {
            result.fullList.push(this.formatFile(item, urlPrefix))
            if (result.fullList.length === LISTING_PAGE_ITEMS) {
              await listing.publish(result)
              result.fullList = []
            }
          }
        }, listing.signal),
      )
      result.success = !listing.signal.aborted
    } catch (error) {
      if (listing.signal.aborted) return
      this.logParam(error, 'getBucketListRecursively')
    }
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  private formatEntry({ filename, attrs }: FileEntry, cwd: string): listDirResult {
    const type = attrs.mode & constants.S_IFMT
    const permissions = Array.from({ length: 9 }, (_, i) => (attrs.mode & (1 << (8 - i)) ? 'rwx'[i % 3] : '-'))
    for (const [flag, index, executable, nonExecutable] of [
      [0o4000, 2, 's', 'S'],
      [0o2000, 5, 's', 'S'],
      [0o1000, 8, 't', 'T'],
    ] as const) {
      if (attrs.mode & flag) permissions[index] = permissions[index] === 'x' ? executable : nonExecutable
    }
    return {
      permissions: `${type === constants.S_IFDIR ? 'd' : type === constants.S_IFLNK ? 'l' : '-'}${permissions.join('')}`,
      isDir: type === constants.S_IFDIR,
      owner: String(attrs.uid ?? ''),
      group: String(attrs.gid ?? ''),
      size: attrs.size,
      mtime: new Date(attrs.mtime * 1000).toISOString(),
      filename,
      key: path.posix.join(cwd, filename).replace(/^\/+/, ''),
    }
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
      await listing.wait(() =>
        this.withClient(async client => {
          for await (const item of this.walkDirectory(prefix, listing, client, false)) {
            const relativePath = path.posix.relative(baseDir, `/${item.key}`)
            const relative = webPath && `${urlPrefix}${path.posix.join('/', webPath, relativePath)}`
            result.fullList.push(
              item.isDir
                ? this.formatFolder(item, webPath ? relative : urlPrefix, !!webPath)
                : this.formatFile(item, webPath ? relative : urlPrefix, !!webPath),
            )
            if (result.fullList.length === LISTING_PAGE_ITEMS) {
              await listing.publish(result)
              result.fullList = []
            }
          }
        }, listing.signal),
      )
    } catch (error) {
      if (listing.signal.aborted) return
      this.logParam(error, 'getBucketListBackstage')
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
      await this.withClient(client =>
        client.renameFile(`/${oldKey.replace(/^\/+/, '')}`, `/${newKey.replace(/^\/+/, '')}`),
      )
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
      await this.withClient(client => client.deleteFile(`/${key.replace(/^\/+/, '')}`, true))
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
      await this.withClient(client => client.deleteDirectory(`/${key.replace(/^\/+/, '')}`))
      result = true
    } catch (error) {
      this.logParam(error, 'deleteBucketFolder')
    }
    return result
  }

  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleUploadBatch(
      configMap,
      { provider: 'sftp', account: [this.host, this.port, this.username] },
      async ({ key, filePath }, { signal }) => {
        // A connection belongs to one job so canceling it cannot interrupt another upload.
        const client = new SSHClient()
        const detach = onUploadAbort(signal, () => client.close())
        try {
          await client.connect(this.config)
          signal.throwIfAborted()
          await client.putFile(filePath, '/' + key.replace(/^\/+/, ''), {
            fileMode: this.fileMode,
            dirMode: this.dirMode,
          })
        } finally {
          detach()
          client.close()
        }
      },
    )
  }

  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await this.withClient(client => client.mkdir(`/${key.replace(/^\/+/, '')}`, { dirMode: this.dirMode }))
      result = true
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray, downloadConflictPolicy = 'rename' } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const client = new SSHClient()
    try {
      for (const item of fileArray) {
        const { alias, bucketName, region, key, fileName } = item
        const id = `${alias}-${bucketName}-${region}-${key}`
        const destination = createDownloadTask(
          instance,
          id,
          downloadPath,
          fileName,
          downloadConflictPolicy,
          this.logger,
        )
        if (!destination) continue
        await runDownloadTask(
          instance,
          id,
          destination,
          async (_partPath, createWriteStream) => {
            if (!client.isConnected) await client.connect(this.config)
            await client.getFileToStream(`/${key.replace(/^\/+/, '')}`, createWriteStream)
          },
          this.logger,
        )
      }
    } finally {
      client.close()
    }
    return true
  }
}

export default SftpApi
