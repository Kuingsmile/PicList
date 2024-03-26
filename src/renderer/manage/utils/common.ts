// UUID
import { v4 as uuidv4 } from 'uuid'

// 路径处理库
import path from 'path'

// 加密库
import crypto from 'crypto'

// 可用图标列表
import { availableIconList } from './icon'

// 数据发送工具函数
import { getConfig } from './dataSender'

// 工具函数
import { handleUrlEncode, safeSliceF, isNeedToShorten } from '~/universal/utils/common'

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

function renameFormatHelper (num: number): string {
  return num.toString().length === 1 ? `0${num}` : num.toString()
}

function getMd5 (input: crypto.BinaryLike): string {
  return crypto.createHash('md5').update(input).digest('hex')
}

export function renameFileNameWithCustomString (oldName: string, customFormat: string, affixFileName?: string): string {
  const date = new Date()
  const year = date.getFullYear().toString()
  const fileBaseName = path.basename(oldName, path.extname(oldName))
  const conversionMap : {[key: string]: () => string} = {
    '{Y}': () => year,
    '{y}': () => year.slice(2),
    '{m}': () => renameFormatHelper(date.getMonth() + 1),
    '{d}': () => renameFormatHelper(date.getDate()),
    '{md5}': () => getMd5(fileBaseName),
    '{md5-16}': () => getMd5(fileBaseName).slice(0, 16),
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

export function renameFile ({ timestampRename, randomStringRename, customRename, customRenameFormat }: IStringKeyMap, oldName = ''): string {
  switch (true) {
    case timestampRename:
      return renameFileNameWithTimestamp(oldName)
    case randomStringRename:
      return renameFileNameWithRandomString(oldName, 20)
    case customRename:
      return renameFileNameWithCustomString(oldName, customRenameFormat)
    default:
      return oldName
  }
}

export async function formatLink (url: string, fileName: string, type: string, format?: string) : Promise<string> {
  const encodedUrl = await getConfig('settings.isEncodeUrl') ? handleUrlEncode(url) : url
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

export function getFileIconPath (fileName: string) {
  const ext = path.extname(fileName).slice(1).toLowerCase()
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
  return isNeedToShorten(fileName, length) ? `${safeSliceF(name, length - 3 - ext.length)}...${ext}` : fileName
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
  if (!proxy) return undefined
  if (/^https?:\/\//.test(proxy)) {
    const { protocol, hostname, port } = new URL(proxy)
    return type === 'string'
      ? `${protocol}//${hostname}:${port}`
      : {
        host: hostname,
        port: Number(port),
        protocol: protocol.slice(0, -1)
      }
  }
  const [host, port] = proxy.split(':')
  return type === 'string'
    ? `http://${host}:${port}`
    : {
      host,
      port: port ? Number(port) : 80,
      protocol: 'http'
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

export const buildInRenameFormatTable = [
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
    placeholder: '{h}',
    description: '小时(00-23)',
    placeholderB: '{i}',
    descriptionB: '分钟(00-59)'
  },
  {
    placeholder: '{s}',
    description: '秒(00-59)',
    placeholderB: '{localFolder:<number>}',
    descriptionB: '本地文件夹层级'
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
