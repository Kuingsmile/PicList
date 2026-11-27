import { constants } from 'node:fs'
import path from 'node:path'
import { Writable } from 'node:stream'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'

import type { FileEntry } from 'ssh2'

import { LISTING_PAGE_ITEMS } from '#/listing'
import type { ListingContext } from '~/manage/listingRequest'
import { encodeObjectPath, formatError } from '~/manage/utils/common'
import { scheduleDownloadBatch } from '~/manage/utils/downloadBatch'
import ManageLogger from '~/manage/utils/logger'
import { scheduleUploadBatch } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/filesystem'
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
    readonly baseDir: string,
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

  private getWebUrl(key: string, urlPrefix: string, baseDir: string, webPath = '') {
    const relativePath = path.posix.relative(baseDir || '/', `/${key}`)
    const urlPath = encodeObjectPath(path.posix.join('/', webPath, relativePath))
    return `${urlPrefix.replace(/\/+$/, '')}${urlPath}`
  }

  private getSftpUrl(key: string, urlPrefix: string) {
    return `${urlPrefix.replace(/\/+$/, '')}/${encodeObjectPath(key.replace(/^\/+/, ''))}`
  }

  formatFolder(item: listDirResult, urlPrefix: string, isWebPath = false) {
    const key = item.key
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
      url: isWebPath ? urlPrefix : this.getSftpUrl(key, urlPrefix),
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
      url: isWebPath ? urlPrefix : this.getSftpUrl(key, urlPrefix),
    }
  }

  private shared?: { ssh: SSHClient; ready?: Promise<void> }
  private readonly idle: SSHClient[] = []
  private readonly connections = new Set<SSHClient>()
  private closed = false

  private openConnection() {
    if (this.closed) throw new Error('SFTP account is closed')
    const ssh = new SSHClient()
    this.connections.add(ssh)
    return ssh
  }

  private closeConnection(ssh: SSHClient) {
    this.connections.delete(ssh)
    ssh.close()
  }

  destroy() {
    this.closed = true
    for (const ssh of this.connections) this.closeConnection(ssh)
    this.idle.length = 0
    this.shared = undefined
  }

  // Metadata requests can multiplex on a single channel, including preview, commit and retry.
  async withMetadataClient<T>(action: (ssh: SSHClient) => Promise<T>): Promise<T> {
    if (this.shared && !this.shared.ready && !this.shared.ssh.isConnected) {
      this.closeConnection(this.shared.ssh)
      this.shared = undefined
    }
    if (!this.shared) {
      const ssh = this.openConnection()
      this.shared = { ssh, ready: ssh.connect(this.config) }
    }
    const connection = this.shared
    try {
      await connection.ready
      connection.ready = undefined
      if (!connection.ssh.isConnected) throw new Error('SSH connection closed')
      return await action(connection.ssh)
    } catch (error) {
      if (!connection.ssh.isConnected && this.shared === connection) {
        this.shared = undefined
        this.closeConnection(connection.ssh)
      }
      throw error
    }
  }

  private async withClient<T>(action: (ssh: SSHClient) => Promise<T>, signal?: AbortSignal): Promise<T> {
    signal?.throwIfAborted()
    const ssh = this.idle.pop() ?? this.openConnection()
    const close = () => this.closeConnection(ssh)
    signal?.addEventListener('abort', close, { once: true })
    try {
      if (!ssh.isConnected) await ssh.connect(this.config)
      signal?.throwIfAborted()
      return await action(ssh)
    } finally {
      signal?.removeEventListener('abort', close)
      if (!this.closed && !signal?.aborted && ssh.isConnected && this.idle.length < 2) {
        ssh.clearDirectories()
        this.idle.push(ssh)
      } else close()
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
    const { prefix, customUrl, baseDir, webPath } = configMap
    const urlPrefix = customUrl || `sftp://${this.host}:${this.port}`
    const isWebPath = !!(customUrl || webPath)
    const result = {
      fullList: [] as ReturnType<SftpApi['formatFile']>[],
      success: false,
      finished: false,
    }
    try {
      await listing.wait(() =>
        this.withClient(async client => {
          const directory = await client.scopedPath(this.baseDir, prefix, true)
          for await (const item of this.walkDirectory(directory, listing, client, true)) {
            const url = isWebPath ? this.getWebUrl(item.key, urlPrefix, baseDir, webPath) : urlPrefix
            result.fullList.push(this.formatFile(item, url, isWebPath))
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
    const { prefix, customUrl, baseDir, webPath } = configMap
    const urlPrefix = customUrl || `sftp://${this.host}:${this.port}`
    const isWebPath = !!(customUrl || webPath)
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    try {
      await listing.wait(() =>
        this.withClient(async client => {
          const directory = await client.scopedPath(this.baseDir, prefix, true)
          for await (const item of this.walkDirectory(directory, listing, client, false)) {
            const url = isWebPath ? this.getWebUrl(item.key, urlPrefix, baseDir, webPath) : urlPrefix
            result.fullList.push(
              item.isDir ? this.formatFolder(item, url, isWebPath) : this.formatFile(item, url, isWebPath),
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
      await this.withClient(async client =>
        client.renameFile(await client.scopedPath(this.baseDir, oldKey), await client.scopedPath(this.baseDir, newKey)),
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
      await this.withClient(async client => client.deleteFile(await client.scopedPath(this.baseDir, key), true))
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
      await this.withClient(async client => client.deleteDirectory(await client.scopedPath(this.baseDir, key)))
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
        await this.withClient(async client => {
          await client.putFile(filePath, await client.scopedPath(this.baseDir, key), {
            fileMode: this.fileMode,
            dirMode: this.dirMode,
          })
        }, signal)
      },
    )
  }

  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await this.withClient(async client =>
        client.mkdir(await client.scopedPath(this.baseDir, key), { dirMode: this.dirMode }),
      )
      result = true
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  async getFilePreview({ key }: { key: string }): Promise<Uint8Array> {
    if (typeof key !== 'string' || !key || key.includes('\0')) throw new Error('Invalid SFTP preview key')
    return this.withClient(async client => {
      const chunks: Buffer[] = []
      await client.getFileToStream(
        await client.scopedPath(this.baseDir, key),
        () =>
          new Writable({
            write(chunk: Buffer, _encoding, callback) {
              chunks.push(chunk)
              callback()
            },
          }),
      )
      return Buffer.concat(chunks)
    })
  }

  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleDownloadBatch(configMap, this.logger, ({ key }, { createWriteStream, signal }) =>
      this.withClient(
        async ssh => ssh.getFileToStream(await ssh.scopedPath(this.baseDir, key), createWriteStream),
        signal,
      ),
    )
  }
}

export default SftpApi
