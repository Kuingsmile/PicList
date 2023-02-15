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

export function renameFileNameWithCustomString (oldName: string, customFormat: string): string {
  const conversionMap : {[key: string]: () => string} = {
    '{Y}': () => new Date().getFullYear().toString(),
    '{y}': () => new Date().getFullYear().toString().slice(2),
    '{m}': () => (new Date().getMonth() + 1).toString().length === 1 ? `0${new Date().getMonth() + 1}` : (new Date().getMonth() + 1).toString(),
    '{d}': () => new Date().getDate().toString().length === 1 ? `0${new Date().getDate()}` : new Date().getDate().toString(),
    '{md5}': () => crypto.createHash('md5').update(path.basename(oldName, path.extname(oldName))).digest('hex'),
    '{md5-16}': () => crypto.createHash('md5').update(path.basename(oldName, path.extname(oldName))).digest('hex').slice(0, 16),
    '{str-10}': () => randomStringGenerator(10),
    '{str-20}': () => randomStringGenerator(20),
    '{filename}': () => path.basename(oldName, path.extname(oldName)),
    '{uuid}': () => uuidv4().replace(/-/g, ''),
    '{timestamp}': () => Math.floor(Date.now() / 1000).toString()
  }
  if (customFormat === undefined || !Object.keys(conversionMap).some(item => customFormat.includes(item))) {
    return oldName
  }
  const ext = path.extname(oldName)
  return Object.keys(conversionMap).reduce((acc, cur) => {
    return acc.replace(cur, conversionMap[cur]())
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
  return availableIconList.includes(ext) ? `${ext}.png` : 'unknown.png'
}

export function formatFileSize (size: number) {
  if (size === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const index = Math.floor(Math.log2(size) / 10)
  return `${(size / Math.pow(2, index * 10)).toFixed(2)} ${units[index]}`
}

export function formatFileName (fileName: string) {
  const ext = path.extname(fileName)
  const name = path.basename(fileName, ext)
  return name.length > 20 ? `${name.slice(0, 20)}...${ext}` : fileName
}

export function getExtension (fileName: string) {
  return path.extname(fileName).slice(1)
}

export function isImage (fileName: string) {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico'].includes(getExtension(fileName))
}

export function formObjToTableData (obj: any) {
  const exclude = [undefined, null, '', 'transformedConfig']
  return Object.keys(obj).filter(key => !exclude.includes(obj[key])).map(key => ({
    key,
    value: typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key]
  })).sort((a, b) => a.key.localeCompare(b.key))
}

export function isValidUrl (str: string) {
  const pattern = new RegExp(
    '^([a-zA-Z]+:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$',
    'i'
  )
  return pattern.test(str)
}

export interface IHTTPProxy {
  host: string
  port: number
  protocol: string
}

export const formatHttpProxy = (proxy: string | undefined, type: 'object' | 'string'): IHTTPProxy | undefined | string => {
  if (proxy === undefined || proxy === '') return undefined
  if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
    const { protocol, hostname, port } = new URL(proxy)
    if (type === 'string') return `${protocol}//${hostname}:${port}`
    return {
      host: hostname,
      port: Number(port),
      protocol: protocol.slice(0, -1)
    }
  } else {
    const [host, port] = proxy.split(':')
    if (type === 'string') return `http://${host}:${port}`
    return {
      host,
      port: port ? Number(port) : 80,
      protocol: 'http'
    }
  }
}
