import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pendingStats = new Map<string, Promise<string>>()

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

export const getClipboardTextFilePath = async (text: string, { verifyFile = true } = {}): Promise<string> => {
  const filePath = normalizeClipboardPathText(text)
  if (!filePath || !path.isAbsolute(filePath)) return ''
  if (!verifyFile) return filePath

  // A timed-out UNC stat can still be running in libuv. Reuse it on the next poll.
  let pending = pendingStats.get(filePath)
  if (!pending) {
    pending = stat(filePath)
      .then(
        info => (info.isFile() ? path.normalize(filePath) : ''),
        () => '',
      )
      .finally(() => pendingStats.delete(filePath))
    pendingStats.set(filePath, pending)
  }
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      pending,
      new Promise<string>(resolve => {
        timer = setTimeout(() => resolve(''), 500)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
