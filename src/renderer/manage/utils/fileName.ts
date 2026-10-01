import { ulid } from 'ulid'
import { v4 as uuidv4 } from 'uuid'

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

function getMd5(input: Buffer | string): string {
  return window.node.crypto.createHash('md5', input)
}

function getSha256(input: Buffer | string): string {
  return window.node.crypto.createHash('sha256', input)
}

function getSha1(input: Buffer | string): string {
  return window.node.crypto.createHash('sha1', input)
}

export function renameFileNameWithCustomString(
  oldName: string,
  customFormat: string,
  affixFileName?: string,
  fileBuffer?: Buffer | (() => Buffer),
  appendExtension: boolean = true,
): string {
  const date = new Date()
  const year = date.getFullYear().toString()
  const fileBaseName = window.node.path.basename(oldName, window.node.path.extname(oldName))
  const getHashInput = () => {
    // Resolve upload contents once, and only when a hash placeholder needs them.
    if (typeof fileBuffer === 'function') fileBuffer = fileBuffer()
    return fileBuffer || fileBaseName
  }
  const conversionMap: Record<string, () => string> = {
    '{Y}': () => year,
    '{y}': () => year.slice(2),
    '{m}': () => renameFormatHelper(date.getMonth() + 1),
    '{d}': () => renameFormatHelper(date.getDate()),
    '{h}': () => renameFormatHelper(date.getHours()),
    '{i}': () => renameFormatHelper(date.getMinutes()),
    '{s}': () => renameFormatHelper(date.getSeconds()),
    '{ms}': () => date.getMilliseconds().toString().padStart(3, '0'),
    '{md5}': () => getMd5(getHashInput()),
    '{md5-16}': () => getMd5(getHashInput()).slice(0, 16),
    '{sha1}': () => getSha1(getHashInput()),
    '{sha256}': () => getSha256(getHashInput()),
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
  let newName =
    Object.keys(conversionMap).reduce((acc, cur) => {
      return acc.includes(cur) ? acc.replace(new RegExp(cur, 'g'), conversionMap[cur]()) : acc
    }, customFormat) + ext
  const strRegex = /{str-(\d+)}/gi
  const sha256nRegex = /{sha256-(\d+)}/gi
  const sha1nRegex = /{sha1-(\d+)}/gi
  newName = newName.replace(sha256nRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return getSha256(getHashInput()).slice(0, length)
  })
  newName = newName.replace(sha1nRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return getSha1(getHashInput()).slice(0, length)
  })
  newName = newName.replace(strRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return randomStringGenerator(length)
  })
  return newName
}

export function renameFile(
  { timestampRename, randomStringRename, customRename, customRenameFormat }: IStringKeyMap,
  oldName = '',
  fileBuffer?: Buffer | (() => Buffer),
): string {
  switch (true) {
    case timestampRename:
      return renameFileNameWithTimestamp(oldName)
    case randomStringRename:
      return renameFileNameWithRandomString(oldName, 20)
    case customRename:
      return renameFileNameWithCustomString(oldName, customRenameFormat, undefined, fileBuffer)
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
