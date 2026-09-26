import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { finished, pipeline } from 'node:stream/promises'

import fs from 'fs-extra'

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
          .split(path.posix.sep)
          .join(path.sep)
          .replace(/^\\+|\\+$/g, '')
      : `/${filePath.replace(/^\/+|\/+$/g, '')}`
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
      const directories = [this.transBack(prefix)]
      const visited = new Set<string>()
      while (directories.length) {
        const directory = directories.pop()!
        const realPath = await listing.wait(() => fs.realpath(directory))
        if (visited.has(realPath)) continue
        visited.add(realPath)
        const entries = await listing.wait(() => fs.readdir(directory, { withFileTypes: true }))
        for (const entry of entries) {
          const filePath = path.join(directory, entry.name)
          const stats = await listing.wait(() =>
            fs.stat(filePath).catch(error => {
              if (entry.isSymbolicLink() && error.code === 'ENOENT') return undefined
              throw error
            }),
          )
          if (stats?.isDirectory()) directories.push(filePath)
          else if (stats?.isFile()) result.fullList.push(this.formatFile(stats, urlPrefix, entry.name, filePath, true))
        }
        await listing.publish(result)
        result.fullList = []
      }
      result.success = true
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListRecursively')
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
      const res = await listing.wait(() =>
        fs.readdir(prefix, {
          withFileTypes: true,
        }),
      )
      if (res.length) {
        let urlPrefixF
        for (const item of res) {
          const pathOfFile = path.join(prefix, item.name)
          let relative
          if (customUrl) {
            const relativePath = path.relative(this.transBack(baseDir), pathOfFile)
            relative = urlPrefix + `/${path.join(webPath, relativePath)}`.replace(/\\/g, '/').replace(/\/+/g, '/')
            urlPrefixF = this.isWindows ? relative.replace(/\/[a-zA-Z]:\//, '/') : relative
          } else {
            urlPrefixF = pathOfFile
          }
          const stats = await listing.wait(() => fs.stat(pathOfFile))
          if (item.isDirectory()) {
            result.fullList.push(this.formatFolder(stats, urlPrefixF, item.name, pathOfFile))
          } else {
            result.fullList.push(this.formatFile(stats, urlPrefixF, item.name, pathOfFile))
          }
        }
      }
      result.success = true
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListBackstage')
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
