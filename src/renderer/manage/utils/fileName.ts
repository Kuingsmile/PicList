import { ulid } from 'ulid'
import { v4 as uuidv4 } from 'uuid'

import { IRPCActionType } from '#/constants/rpcActions'
import { customStrMatch, randomStringGenerator } from '#/utils/strings'

export function splitFileName(fileName: string): { baseName: string; extension: string } {
  const dotIndex = fileName.lastIndexOf('.')
  // A leading dot belongs to the basename; a later dot starts the extension.
  if (dotIndex <= 0 || fileName === '..') {
    return { baseName: fileName, extension: '' }
  }
  return { baseName: fileName.slice(0, dotIndex), extension: fileName.slice(dotIndex) }
}

export function renameFileNameWithTimestamp(oldName: string): string {
  return `${Math.floor(Date.now() / 1000)}${randomStringGenerator(5)}${window.node.path.extname(oldName)}`
}

export function renameFileNameWithRandomString(oldName: string, length: number = 5): string {
  return `${randomStringGenerator(length)}${window.node.path.extname(oldName)}`
}

function renameFormatHelper(num: number): string {
  return num.toString().length === 1 ? `0${num}` : num.toString()
}

type HashAlgorithm = 'md5' | 'sha1' | 'sha256'

export function renameFileNameWithCustomString(
  oldName: string,
  customFormat: string,
  affixFileName?: string,
  getFileHash?: (algorithm: HashAlgorithm) => string,
  appendExtension: boolean = true,
): string {
  const date = new Date()
  const year = date.getFullYear().toString()
  const fileBaseName = window.node.path.basename(oldName, window.node.path.extname(oldName))
  const hash = getFileHash ?? ((algorithm: HashAlgorithm) => window.node.crypto.createHash(algorithm, fileBaseName))
  const conversionMap: Record<string, () => string> = {
    '{Y}': () => year,
    '{y}': () => year.slice(2),
    '{m}': () => renameFormatHelper(date.getMonth() + 1),
    '{d}': () => renameFormatHelper(date.getDate()),
    '{h}': () => renameFormatHelper(date.getHours()),
    '{i}': () => renameFormatHelper(date.getMinutes()),
    '{s}': () => renameFormatHelper(date.getSeconds()),
    '{ms}': () => date.getMilliseconds().toString().padStart(3, '0'),
    '{md5}': () => hash('md5'),
    '{md5-16}': () => hash('md5').slice(0, 16),
    '{sha1}': () => hash('sha1'),
    '{sha256}': () => hash('sha256'),
    '{filename}': () =>
      affixFileName
        ? window.node.path.basename(affixFileName, window.node.path.extname(affixFileName))
        : window.node.path.basename(oldName, window.node.path.extname(oldName)),
    '{uuid}': () => uuidv4().replace(/-/g, ''),
    '{ulid}': () => ulid(),
    '{timestamp}': () => date.getTime().toString(),
    '{timestampS}': () => Math.floor(date.getTime() / 1000).toString(),
  }
  if (
    customFormat === undefined ||
    (!Object.keys(conversionMap).some(item => customFormat.includes(item)) &&
      !customFormat.includes('{str-') &&
      !/{sha256-\d+}/.test(customFormat) &&
      !/{sha1-\d+}/.test(customFormat))
  ) {
    return oldName
  }
  const ext = appendExtension ? window.node.path.extname(oldName) : ''
  let newName = customFormat
  for (const [token, getValue] of Object.entries(conversionMap)) {
    if (!newName.includes(token)) continue
    const value = getValue()
    newName = newName.replaceAll(token, () => value)
  }
  newName += ext
  const strRegex = /{str-(\d+)}/gi
  const sha256nRegex = /{sha256-(\d+)}/gi
  const sha1nRegex = /{sha1-(\d+)}/gi
  newName = newName.replace(sha256nRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return hash('sha256').slice(0, length)
  })
  newName = newName.replace(sha1nRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return hash('sha1').slice(0, length)
  })
  newName = newName.replace(strRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return randomStringGenerator(length)
  })
  return newName
}

export async function renameFile(
  { timestampRename, randomStringRename, customRename, customRenameFormat }: IStringKeyMap,
  oldName: string,
  filePath: string,
): Promise<string> {
  switch (true) {
    case timestampRename:
      return renameFileNameWithTimestamp(oldName)
    case randomStringRename:
      return renameFileNameWithRandomString(oldName, 20)
    case customRename: {
      const algorithms: HashAlgorithm[] = []
      if (/{md5(?:-16)?}/.test(customRenameFormat)) algorithms.push('md5')
      if (/{sha1(?:-[0-9]+)?}/i.test(customRenameFormat)) algorithms.push('sha1')
      if (/{sha256(?:-[0-9]+)?}/i.test(customRenameFormat)) algorithms.push('sha256')
      if (!algorithms.length) return renameFileNameWithCustomString(oldName, customRenameFormat)
      const hashes = await window.electron.triggerRPC<Record<HashAlgorithm, string>>(
        IRPCActionType.MANAGE_HASH_UPLOAD_FILE,
        filePath,
        algorithms,
      )
      if (!hashes || algorithms.some(algorithm => !hashes[algorithm])) throw new Error('Upload hash unavailable')
      return renameFileNameWithCustomString(oldName, customRenameFormat, undefined, algorithm => hashes[algorithm])
    }
    default:
      return oldName
  }
}

export function customStrReplace(str: string, pattern: string, replacement: string): string {
  if (!str || !pattern) return str
  replacement = replacement || ''
  let result = str
  try {
    const reg = new RegExp(pattern, 'ug')
    result = str.replace(reg, replacement)
    // The replacement already contains the full URL or filename, including any extension.
    result = renameFileNameWithCustomString(result, result, str, undefined, false)
  } catch {}
  return result
}

export function matchFileName(fileName: string, pattern: string, includeExtension: boolean): boolean {
  const name = includeExtension ? fileName : splitFileName(fileName).baseName
  return customStrMatch(name, pattern)
}

export function replaceFileName(
  fileName: string,
  pattern: string,
  replacement: string,
  includeExtension: boolean,
): string {
  if (includeExtension) return customStrReplace(fileName, pattern, replacement)
  const { baseName, extension } = splitFileName(fileName)
  return customStrReplace(baseName, pattern, replacement) + extension
}
