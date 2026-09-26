import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { finished, pipeline } from 'node:stream/promises'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'

import fs from 'fs-extra'

import { LISTING_PAGE_ITEMS } from '#/listing'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { createDownloadTask, formatError, runDownloadTask } from '~/manage/utils/common'
import ManageLogger from '~/manage/utils/logger'
import { scheduleUploadBatch, withUploadStream } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/common'

class LocalApi {
  logger: ManageLogger
  isWindows: boolean

  constructor(logger: ManageLogger) {
    this.logger = logger
    this.isWindows = process.platform === 'win32'
  }

  logParam = (error: any, method: string) => this.logger.error(formatError(error, { class: 'LocalApi', method }))

  // windows 系统下将路径转换为 unix 风格
  transPathToUnix(filePath: string | undefined) {
    if (!filePath) return ''
    return this.isWindows ? filePath.split(path.sep).join(path.posix.sep) : filePath.replace(/^\/+/, '')
  }

  transBack(filePath: string | undefined) {
    if (!filePath) return ''
    return this.isWindows
      ? filePath
          .replace(/^\/+([a-zA-Z]:)/, '$1')
          .replace(/^\/{3,}/, '//')
          .split(path.posix.sep)
          .join(path.sep)
      : `/${filePath.replace(/^\/+|\/+$/g, '')}`
  }

  /**
   * One open directory, one metadata request and a 64-entry directory buffer at a time.
   * Never follow links (including junctions); inaccessible or vanished entries fail the listing.
   * Keep only pending directory paths, not the contents of the tree.
   */
  private async *walkDirectory(prefix: string, listing: ListingContext, recursive: boolean) {
    // A trailing separator can make lstat follow the final link. Preserve filesystem roots.
    prefix = path.normalize(prefix)
    const root = path.parse(prefix).root
    prefix = prefix.slice(root.length).replace(this.isWindows ? /[\\/]+$/ : /\/+$/, '')
    const directories = [root + prefix]
    let isRoot = true
    while (directories.length) {
      const directory = directories.pop()!
      const stats = await listing.wait(() => fs.lstat(directory))
      if (stats.isSymbolicLink() && !isRoot) continue
      if (!stats.isDirectory() || stats.isSymbolicLink())
        throw new Error('Listing path must be a directory without a symbolic link')
      isRoot = false
      let handle: fs.Dir | undefined
      try {
        await listing.wait(async () => {
          const opened = await fs.opendir(directory, { bufferSize: 64 })
          // An open may complete after wait() has already returned on cancellation.
          if (listing.signal.aborted) {
            await opened.close()
            listing.signal.throwIfAborted()
          }
          // Retain ownership even if cancellation wins just as wait() receives the handle.
          handle = opened
        })
        let scanned = 0
        while (true) {
          const dirent = await listing.wait(() => handle!.read())
          if (!dirent) break
          if (++scanned % 64 === 0) await listing.wait(() => yieldToEventLoop())
          // Broken links and links to inaccessible targets need no target lookup.
          if (dirent.isSymbolicLink()) continue
          const filePath = path.join(directory, dirent.name)
          const stats = await listing.wait(() => fs.lstat(filePath))
          if (stats.isDirectory() && recursive) directories.push(filePath)
          else if (stats.isFile() || stats.isDirectory()) yield { name: dirent.name, path: filePath, stats }
        }
      } finally {
        await handle?.close()
      }
    }
  }

  formatFolder(item: fs.Stats, urlPrefix: string, fileName: string, filePath: string) {
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
      url: urlPrefix,
    }
  }

  formatFile(item: fs.Stats, urlPrefix: string, fileName: string, filePath: string, isDownload = false) {
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
      url: urlPrefix,
    }
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { prefix, customUrl = '' } = configMap
    const urlPrefix = customUrl.replace(/\/+$/, '')
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    try {
      for await (const entry of this.walkDirectory(this.transBack(prefix), listing, true)) {
        result.fullList.push(this.formatFile(entry.stats, urlPrefix, entry.name, entry.path, true))
        if (result.fullList.length === LISTING_PAGE_ITEMS) {
          await listing.publish(result)
          result.fullList = []
        }
      }
      listing.signal.throwIfAborted()
      result.success = true
    } catch (error) {
      if (listing.signal.aborted) return
      this.logParam(error, 'getBucketListRecursively')
    }
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const { customUrl = '', baseDir } = configMap
    let prefix = configMap.prefix
    prefix = this.transBack(prefix)
    const urlPrefix = customUrl.replace(/\/+$/, '')
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
      for await (const entry of this.walkDirectory(prefix, listing, false)) {
        let urlPrefixF = entry.path
        if (customUrl) {
          const relativePath = path.relative(this.transBack(baseDir), entry.path)
          const relative =
            urlPrefix + `/${path.join(webPath, relativePath)}`.split(path.sep).join('/').replace(/\/+/g, '/')
          urlPrefixF = this.isWindows ? relative.replace(/\/[a-zA-Z]:\//, '/') : relative
        }
        result.fullList.push(
          entry.stats.isDirectory()
            ? this.formatFolder(entry.stats, urlPrefixF, entry.name, entry.path)
            : this.formatFile(entry.stats, urlPrefixF, entry.name, entry.path),
        )
        if (result.fullList.length === LISTING_PAGE_ITEMS) {
          await listing.publish(result)
          result.fullList = []
        }
      }
      listing.signal.throwIfAborted()
      result.success = true
    } catch (error) {
      if (listing.signal.aborted) return
      this.logParam(error, 'getBucketListBackstage')
    }
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async renameBucketFile(configMap: IStringKeyMap): Promise<boolean> {
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

  async deleteBucketFile(configMap: IStringKeyMap): Promise<boolean> {
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

  async deleteBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await fs.rm(this.transBack(key), {
        recursive: true,
      })
      result = true
    } catch (error) {
      this.logParam(error, 'deleteBucketFolder')
    }
    return result
  }

  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleUploadBatch(
      configMap,
      { provider: 'local', account: ['local'] },
      async ({ key, filePath }, { signal }) => {
        const target = this.transBack(key)
        // Stage the copy so cancellation never leaves a partial destination or truncates the source.
        await fs.ensureDir(path.dirname(target))
        const staged = path.join(path.dirname(target), '.piclist-upload-' + randomUUID() + '.tmp')
        try {
          await withUploadStream(filePath, signal, source =>
            pipeline(source, fs.createWriteStream(staged, { flags: 'wx' }), { signal }),
          )
          signal.throwIfAborted()
          await fs.rename(staged, target)
        } finally {
          await fs.remove(staged)
        }
      },
    )
  }

  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { key } = configMap
    let result = false
    try {
      await fs.mkdir(this.transBack(key), {
        recursive: true,
      })
      result = true
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray, downloadConflictPolicy = 'rename' } = configMap
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { alias, bucketName, key, fileName } = item
      const id = `${alias}-${bucketName}-local-${key}`
      const destination = createDownloadTask(instance, id, downloadPath, fileName, downloadConflictPolicy, this.logger)
      if (!destination) continue
      await runDownloadTask(
        instance,
        id,
        destination,
        async (_partPath, createWriteStream) => {
          const output = createWriteStream()
          try {
            await pipeline(fs.createReadStream(this.transBack(key)), output)
          } finally {
            output.destroy()
            await finished(output).catch(() => {})
          }
        },
        this.logger,
      )
    }
    return true
  }
}

export default LocalApi
