import { ulid } from 'ulid'
import { v4 as uuidv4 } from 'uuid'

import { getConfig } from '@/manage/utils/dataSender'
import { availableIconList } from '@/manage/utils/icon'
import { isNeedToShorten, safeSliceF } from '@/utils/common'

export const isUrlEncode = (url: string): boolean => {
  url = url || ''
  try {
    return url !== decodeURI(url)
  } catch {
    return false
  }
}

export const handleUrlEncode = (url: string): string => (isUrlEncode(url) ? url : encodeURI(url))

const mask = 0b111111
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
export function randomStringGenerator(length: number): string {
  const out = new Array(length)
  let i = 0
  let pool = 0
  let bits = 0
  while (i < length) {
    if (bits < 6) {
      pool = (pool << 30) | ((Math.random() * 0x40000000) >>> 0)
      bits += 30
      continue
    }
    const idx = pool & mask
    pool >>>= 6
    bits -= 6
    if (idx < 62) out[i++] = chars[idx]
  }
  return out.join('')
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
  fileBuffer?: Buffer,
): string {
  const date = new Date()
  const year = date.getFullYear().toString()
  const fileBaseName = window.node.path.basename(oldName, window.node.path.extname(oldName))
  const conversionMap: Record<string, () => string> = {
    '{Y}': () => year,
    '{y}': () => year.slice(2),
    '{m}': () => renameFormatHelper(date.getMonth() + 1),
    '{d}': () => renameFormatHelper(date.getDate()),
    '{h}': () => renameFormatHelper(date.getHours()),
    '{i}': () => renameFormatHelper(date.getMinutes()),
    '{s}': () => renameFormatHelper(date.getSeconds()),
    '{ms}': () => date.getMilliseconds().toString().padStart(3, '0'),
    '{md5}': () => getMd5(fileBuffer || fileBaseName),
    '{md5-16}': () => getMd5(fileBuffer || fileBaseName).slice(0, 16),
    '{sha1}': () => getSha1(fileBuffer || fileBaseName),
    '{sha256}': () => getSha256(fileBuffer || fileBaseName),
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
  const ext = window.node.path.extname(oldName)
  let newName =
    Object.keys(conversionMap).reduce((acc, cur) => {
      return acc.replace(new RegExp(cur, 'g'), conversionMap[cur]())
    }, customFormat) + ext
  const strRegex = /{str-(\d+)}/gi
  const sha256nRegex = /{sha256-(\d+)}/gi
  const sha1nRegex = /{sha1-(\d+)}/gi
  newName = newName.replace(sha256nRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return getSha256(fileBuffer || fileBaseName).slice(0, length)
  })
  newName = newName.replace(sha1nRegex, (_, group1) => {
    const length = parseInt(group1, 10)
    return getSha1(fileBuffer || fileBaseName).slice(0, length)
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
  fileBuffer?: Buffer,
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

export async function formatLink(url: string, fileName: string, type: string, format?: string): Promise<string> {
  const encodedUrl = (await getConfig('settings.isEncodeUrl')) ? handleUrlEncode(url) : url
  switch (type) {
    case 'markdown':
      return `![${fileName}](${encodedUrl})`
    case 'html':
      return `<img src="${encodedUrl}" alt="${fileName}"/>`
    case 'bbcode':
      return `[img]${encodedUrl}[/img]`
    case 'url':
      return encodedUrl
    case 'markdown-with-link':
      return `[![${fileName}](${encodedUrl})](${encodedUrl})`
    case 'custom':
      if (format && (format.includes('$url') || format.includes('$fileName'))) {
        return format.replace(/\$url/g, encodedUrl).replace(/\$fileName/g, fileName)
      }
      return encodedUrl
    default:
      return encodedUrl
  }
}

export function getFileIconPath(fileName: string) {
  const ext = window.node.path.extname(fileName).slice(1).toLowerCase()
  return availableIconList.includes(ext) ? `${ext}.webp` : 'unknown.webp'
}

const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatFileSize(size: number) {
  if (size === 0) return ''
  const index = Math.floor(Math.log2(size) / 10)
  return `${(size / Math.pow(2, index * 10)).toFixed(2)} ${units[index]}`
}

export function formatFileName(fileName: string, length: number = 20) {
  let ext = window.node.path.extname(fileName)
  ext = ext.length > 5 ? ext.slice(ext.length - 5) : ext
  const name = window.node.path.basename(fileName, ext)
  return isNeedToShorten(fileName, length) ? `${safeSliceF(name, length - 3 - ext.length)}...${ext}` : fileName
}

export function formObjToTableData(obj: any) {
  const exclude = [undefined, null, '', 'transformedConfig']
  return Object.keys(obj)
    .filter(key => !exclude.includes(obj[key]))
    .map(key => ({
      key,
      value: typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key],
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

export function isValidUrl(str: string) {
  try {
    return !!new URL(str)
  } catch (_e) {
    return false
  }
}

export function customStrMatch(str: string, pattern: string): boolean {
  if (!str || !pattern) return false
  try {
    const reg = new RegExp(pattern, 'ug')
    return reg.test(str)
  } catch (e) {
    console.error(e)
    return false
  }
}

export function customStrReplace(str: string, pattern: string, replacement: string): string {
  if (!str || !pattern) return str
  replacement = replacement || ''
  let result = str
  try {
    const reg = new RegExp(pattern, 'ug')
    result = str.replace(reg, replacement)
    result = renameFileNameWithCustomString(result, result, str)
  } catch (e) {
    console.error(e)
  }
  return result
}
