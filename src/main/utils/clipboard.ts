import picgo from '@core/picgo'
import { clipboard } from 'electron'
import fs from 'fs-extra'

import { getClipboardTextFilePath } from '~/utils/clipboardFilePath'
import { configPaths } from '~/utils/configPaths'

export const handleCopyUrl = (str: string): void => {
  if (picgo.getConfig<boolean>(configPaths.settings.autoCopy) !== false) {
    clipboard.writeText(str)
  }
}

/**
 * macOS public.file-url will get encoded file path,
 * so we need to decode it
 */
export const ensureFilePath = (filePath: string, prefix = 'file://'): string => {
  filePath = filePath.replace(prefix, '')
  if (fs.existsSync(filePath)) {
    return `${prefix}${filePath}`
  }
  filePath = decodeURIComponent(filePath)
  if (fs.existsSync(filePath)) {
    return `${prefix}${filePath}`
  }
  return ''
}

/**
 * for builtin clipboard to get image path from clipboard
 * @returns
 */
export const getClipboardFilePath = (): string => {
  // TODO: linux support
  const img = clipboard.readImage()
  const platform = process.platform

  if (!img.isEmpty() && platform === 'darwin') {
    let imgPath = clipboard.read('public.file-url') // will get file://xxx/xxx
    imgPath = ensureFilePath(imgPath)
    return imgPath ? imgPath.replace('file://', '') : ''
  }

  if (img.isEmpty() && platform === 'win32') {
    const imgPath = clipboard
      .readBuffer('FileNameW')
      ?.toString('ucs2')
      ?.replace(RegExp(String.fromCharCode(0), 'g'), '')
    if (imgPath) return imgPath
  }

  if (img.isEmpty()) {
    return getClipboardTextFilePath(clipboard.readText())
  }

  return ''
}
