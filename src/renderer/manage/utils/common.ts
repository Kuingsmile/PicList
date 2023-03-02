import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import crypto from 'crypto'
import { availableIconList } from './icon'

export function randomStringGenerator (length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

export function renameFileNameWithTimestamp (oldName: string): string {
  return `${Math.floor(Date.now() / 1000)}${randomStringGenerator(5)}${path.extname(oldName)}`
}

export function renameFileNameWithRandomString (oldName: string, length: number = 5): string {
  return `${randomStringGenerator(length)}${path.extname(oldName)}`
}

export function renameFileNameWithCustomString (oldName: string, customFormat: string, affixFileName?: string): string {
  const conversionMap : {[key: string]: () => string} = {
    '{Y}': () => new Date().getFullYear().toString(),
    '{y}': () => new Date().getFullYear().toString().slice(2),
    '{m}': () => (new Date().getMonth() + 1).toString().length === 1 ? `0${new Date().getMonth() + 1}` : (new Date().getMonth() + 1).toString(),
    '{d}': () => new Date().getDate().toString().length === 1 ? `0${new Date().getDate()}` : new Date().getDate().toString(),
    '{md5}': () => crypto.createHash('md5').update(path.basename(oldName, path.extname(oldName))).digest('hex'),
    '{md5-16}': () => crypto.createHash('md5').update(path.basename(oldName, path.extname(oldName))).digest('hex').slice(0, 16),
    '{str-10}': () => randomStringGenerator(10),
    '{str-20}': () => randomStringGenerator(20),
    '{filename}': () => affixFileName ? path.basename(affixFileName, path.extname(affixFileName)) : path.basename(oldName, path.extname(oldName)),
    '{uuid}': () => uuidv4().replace(/-/g, ''),
    '{timestamp}': () => Math.floor(Date.now() / 1000).toString()
  }
  if (customFormat === undefined || !Object.keys(conversionMap).some(item => customFormat.includes(item))) {
    return oldName
  }
  const ext = path.extname(oldName)
  return Object.keys(conversionMap).reduce((acc, cur) => {
    return acc.replace(new RegExp(cur, 'g'), conversionMap[cur]())
  }, customFormat) + ext
}

export function renameFile (typeMap : IStringKeyMap, oldName: string): string {
  if (typeMap.timestampRename) {
    return renameFileNameWithTimestamp(oldName)
  } else if (typeMap.randomStringRename) {
    return renameFileNameWithRandomString(oldName, 20)
  } else {
    return renameFileNameWithCustomString(oldName, typeMap.customRenameFormat)
  }
}

export function formatLink (url: string, fileName: string, type: string, format?: string) : string {
  switch (type) {
    case 'markdown':
      return `![${fileName}](${url})`
    case 'html':
      return `<img src="${url}" alt="${fileName}"/>`
    case 'bbcode':
      return `[img]${url}[/img]`
    case 'url':
      return url
    case 'markdown-with-link':
      return `[![${fileName}](${url})](${url})`
    case 'custom':
      if (format && (format.includes('$url') || format.includes('$fileName'))) {
        return format.replace(/\$url/g, url).replace(/\$fileName/g, fileName)
      }
      return url
    default:
      return url
  }
}

export function getFileIconPath (fileName: string) {
  const ext = path.extname(fileName).slice(1)
  return availableIconList.includes(ext) ? `${ext}.webp` : 'unknown.webp'
}

const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatFileSize (size: number) {
  if (size === 0) return ''
  const index = Math.floor(Math.log2(size) / 10)
  return `${(size / Math.pow(2, index * 10)).toFixed(2)} ${units[index]}`
}

export function formatFileName (fileName: string, length: number = 20) {
  let ext = path.extname(fileName)
  ext = ext.length > 5 ? ext.slice(ext.length - 5) : ext
  const name = path.basename(fileName, ext)
  return name.length > length ? `${name.slice(0, length)}...${ext}` : fileName
}

export const getExtension = (fileName: string) => path.extname(fileName).slice(1)

export const isImage = (fileName: string) =>
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'svg'].includes(getExtension(fileName))

export function formObjToTableData (obj: any) {
  const exclude = [undefined, null, '', 'transformedConfig']
  return Object.keys(obj).filter(key => !exclude.includes(obj[key])).map(key => ({
    key,
    value: typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key]
  })).sort((a, b) => a.key.localeCompare(b.key))
}

export function isValidUrl (str: string) {
  try {
    return !!new URL(str)
  } catch (e) {
    return false
  }
}

export interface IHTTPProxy {
  host: string
  port: number
  protocol: string
}

export const formatHttpProxy = (proxy: string | undefined, type: 'object' | 'string'): IHTTPProxy | undefined | string => {
  if (proxy === undefined || proxy === '') return undefined
  if (/^https?:\/\//.test(proxy)) {
    const { protocol, hostname, port } = new URL(proxy)
    return type === 'string'
      ? `${protocol}//${hostname}:${port}`
      : {
        host: hostname,
        port: Number(port),
        protocol: protocol.slice(0, -1)
      }
  } else {
    const [host, port] = proxy.split(':')
    return type === 'string'
      ? `http://${host}:${port}`
      : {
        host,
        port: port ? Number(port) : 80,
        protocol: 'http'
      }
  }
}

export const svg = `
  <path class="path" d="
    M 30 15
    L 28 17
    M 25.61 25.61
    A 15 15, 0, 0, 1, 15 30
    A 15 15, 0, 1, 1, 27.99 7.5
    L 15 15
  " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
  `

export function customStrMatch (str: string, pattern: string) : boolean {
  if (!str || !pattern) return false
  try {
    const reg = new RegExp(pattern, 'g')
    return reg.test(str)
  } catch (e) {
    console.error(e)
    return false
  }
}

export function customStrReplace (str: string, pattern: string, replacement: string) : string {
  if (!str || !pattern) return str
  replacement = replacement || ''
  let result = str
  try {
    const reg = new RegExp(pattern, 'g')
    result = str.replace(reg, replacement)
    result = renameFileNameWithCustomString(result, result, str)
  } catch (e) {
    console.error(e)
  }
  return result
}

export const customRenameFormatTable = [
  {
    placeholder: '{Y}',
    description: '年份，4位数',
    placeholderB: '{y}',
    descriptionB: '年份，2位数'
  },
  {
    placeholder: '{m}',
    description: '月份(01-12)',
    placeholderB: '{d}',
    descriptionB: '日期(01-31)'
  },
  {
    placeholder: '{timestamp}',
    description: '时间戳（秒）',
    placeholderB: '{uuid}',
    descriptionB: 'uuid字符串'
  },
  {
    placeholder: '{md5}',
    description: 'md5',
    placeholderB: '{md5-16}',
    descriptionB: 'md5前16位'
  },
  {
    placeholder: '{str-10}',
    description: '10位随机字符串',
    placeholderB: '{str-20}',
    descriptionB: '20位随机字符串'
  },
  {
    placeholder: '{filename}',
    description: '原文件名'
  }
]
