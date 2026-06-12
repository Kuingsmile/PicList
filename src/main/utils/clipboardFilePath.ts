import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fs from 'fs-extra'

const unwrapClipboardPathText = (text: string): string => {
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1).trim()
  }
  return text
}

const normalizeClipboardPathText = (text: string): string => {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length !== 1) return ''

  const filePath = unwrapClipboardPathText(lines[0])
  if (!filePath) return ''

  if (/^file:\/\//i.test(filePath)) {
    try {
      return fileURLToPath(filePath)
    } catch (_e) {
      return ''
    }
  }

  return filePath
}

export const getClipboardTextFilePath = (text: string): string => {
  const filePath = normalizeClipboardPathText(text)
  if (!filePath || !path.isAbsolute(filePath)) return ''

  try {
    const stats = fs.statSync(filePath)
    return stats.isFile() ? path.normalize(filePath) : ''
  } catch (_e) {
    return ''
  }
}
