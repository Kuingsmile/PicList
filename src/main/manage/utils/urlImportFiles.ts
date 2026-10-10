import path from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import axios from 'axios'
import { app } from 'electron'
import fs from 'fs-extra'

interface ImportedFile {
  directory: string
  awaitingUpload: boolean
  uploads: Set<string>
}

const importedFiles = new Map<string, ImportedFile>()
const uploadFiles = new Map<string, string>()
const getTempDirPath = () => path.join(app.getPath('temp'), 'piclistTemp')

const removeImportedFile = (filePath: string) => {
  const file = importedFiles.get(filePath)
  if (!file) return
  try {
    fs.removeSync(file.directory)
    importedFiles.delete(filePath)
  } catch (_error) {
    // A provider may still be closing a file handle. Retry during shutdown cleanup.
  }
}

export const downloadFileFromUrl = async (urls: string[]): Promise<IUrlImportResult> => {
  const tempPath = getTempDirPath()
  await fs.ensureDir(tempPath)
  const result: IUrlImportResult = { files: [], failures: [] }
  for (const url of urls) {
    let filePath: string | undefined
    let downloadStream: Readable | undefined
    try {
      const fileName = path.posix.basename(new URL(url).pathname) || 'download'
      const directory = await fs.mkdtemp(path.join(tempPath, 'url-'))
      filePath = path.join(directory, fileName.replace(/[\\/:*?"<>|]/g, '_'))
      importedFiles.set(filePath, { directory, awaitingUpload: true, uploads: new Set() })
      const res = await axios({ method: 'get', url, responseType: 'stream' })
      downloadStream = res.data
      await pipeline(res.data, fs.createWriteStream(filePath))
      result.files.push({ filePath, fileName, fileSize: (await fs.stat(filePath)).size })
    } catch (error) {
      downloadStream?.destroy()
      const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined
      if (axios.isAxiosError(error)) error.response?.data?.destroy?.()
      if (filePath) {
        importedFiles.get(filePath)!.awaitingUpload = false
        removeImportedFile(filePath)
      }
      // Return only safe failure details; Axios errors can contain credentials and response bodies.
      result.failures.push({
        url,
        reason: statusCode === undefined ? 'download' : 'http',
        ...(statusCode === undefined ? {} : { statusCode }),
      })
    }
  }
  return result
}

export const retainImportedFileForUpload = (filePath: string, taskId: string) => {
  const normalizedPath = path.resolve(filePath)
  const file = importedFiles.get(normalizedPath)
  if (!file) return
  file.awaitingUpload = false
  file.uploads.add(taskId)
  uploadFiles.set(taskId, normalizedPath)
}

export const finishImportedFileUpload = (taskId: string) => {
  const filePath = uploadFiles.get(taskId)
  if (!filePath) return
  uploadFiles.delete(taskId)
  const file = importedFiles.get(filePath)!
  file.uploads.delete(taskId)
  if (file.uploads.size === 0) removeImportedFile(filePath)
}

export const clearTempFolder = () => {
  const tempPath = getTempDirPath()
  fs.ensureDirSync(tempPath)
  const protectedDirectories = new Set(
    [...importedFiles.values()]
      .filter(file => file.awaitingUpload || file.uploads.size > 0)
      .map(file => file.directory),
  )
  for (const entry of fs.readdirSync(tempPath)) {
    const directory = path.join(tempPath, entry)
    if (!protectedDirectories.has(directory)) fs.removeSync(directory)
  }
  for (const [filePath, file] of importedFiles) {
    if (!protectedDirectories.has(file.directory)) importedFiles.delete(filePath)
  }
}
