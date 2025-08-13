import path from 'node:path'

import db from '@core/datastore'
import logger from '@core/picgo/logger'
import axios from 'axios'
import { clipboard, Notification, Tray } from 'electron'
import FormData from 'form-data'
import fs from 'fs-extra'
import { isReactive, isRef, toRaw, unref } from 'vue'

import type { IHTTPProxy, IPrivateShowNotificationOption, IStringKeyMap } from '#/types/types'
import { configPaths } from '~/utils/configPaths'
import { IShortUrlServer } from '~/utils/enum'

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  if (isRef(args)) return unref(args)
  if (isReactive(args)) return toRaw(args)
  if (Array.isArray(args)) return args.map(getRawData)
  if (typeof args === 'object' && args !== null) {
    const data = {} as Record<string, any>
    for (const key in args) {
      data[key] = getRawData(args[key])
    }
    return data
  }
  return args
}

const getExtension = (fileName: string) => path.extname(fileName).slice(1)

export const isImage = (fileName: string) =>
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif'].includes(getExtension(fileName))

export let tray: Tray

export const setTray = (t: Tray) => {
  tray = t
}

export const getTray = () => tray

export function setTrayToolTip (title: string): void {
  if (tray) {
    tray.setToolTip(title)
  }
}

export const handleCopyUrl = (str: string): void => {
  if (db.get(configPaths.settings.autoCopy) !== false) {
    clipboard.writeText(str)
  }
}

/**
 * show notification
 * @param options
 */
export const showNotification = (
  options: IPrivateShowNotificationOption = {
    title: '',
    body: '',
    clickToCopy: false,
    copyContent: '',
    clickFn: () => {}
  }
) => {
  const notification = new Notification({
    title: options.title,
    body: options.body
  })
  const handleClick = () => {
    if (options.clickToCopy) {
      clipboard.writeText(options.copyContent || options.body)
    }
    if (options.clickFn) {
      options.clickFn()
    }
  }
  notification.once('click', handleClick)
  notification.once('close', () => {
    notification.removeListener('click', handleClick)
  })
  notification.show()
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
    return imgPath || ''
  }

  return ''
}

const c1nApi = 'https://c1n.cn/link/short'

const createC1NShortUrl = async (url: string) => {
  const c1nToken = db.get(configPaths.settings.c1nToken) || ''
  if (!c1nToken) {
    logger.warn('c1n token is not set')
    return url
  }
  try {
    const form = new FormData()
    form.append('url', url)
    const res = await axios.post(c1nApi, form, {
      headers: {
        token: c1nToken
      }
    })
    if (res.status >= 200 && res.status < 300 && res.data?.code === 0) {
      return res.data.data
    }
  } catch (e: any) {
    logger.error(e)
  }
  return url
}

const createYOURLSShortLink = async (url: string) => {
  let domain = db.get(configPaths.settings.yourlsDomain) || ''
  const signature = db.get(configPaths.settings.yourlsSignature) || ''

  if (!domain || !signature) {
    logger.warn('Yourls server or signature is not set')
    return url
  }
  if (!/^https?:\/\//.test(domain)) {
    domain = `http://${domain}`
  }
  const params = new URLSearchParams({
    signature,
    action: 'shorturl',
    format: 'json',
    url
  })
  try {
    const res = await axios.get(`${domain}/yourls-api.php?${params.toString()}`)
    if (res.data?.shorturl) {
      return res.data.shorturl
    }
  } catch (e: any) {
    if (e.response?.data?.message?.includes('already exists in database')) {
      return e.response.data.shorturl
    }
    logger.error(e)
  }

  return url
}

const createShortUrlForCFWorker = async (url: string) => {
  let cfWorkerHost = db.get(configPaths.settings.cfWorkerHost) || ''
  cfWorkerHost = cfWorkerHost.replace(/\/$/, '')
  if (!cfWorkerHost) {
    logger.warn('CF Worker host is not set')
    return url
  }

  try {
    const res = await axios.post(cfWorkerHost, { url })
    if (res.data?.status === 200 && res.data?.key?.startsWith('/')) {
      return `${cfWorkerHost}${res.data.key}`
    }
  } catch (e: any) {
    logger.error(e)
  }

  return url
}

const createShortUrlFromSink = async (url: string) => {
  let sinkDomain = db.get(configPaths.settings.sinkDomain) || ''
  const sinkToken = db.get(configPaths.settings.sinkToken) || ''
  if (!sinkDomain || !sinkToken) {
    logger.warn('Sink domain or token is not set')
    return url
  }
  if (!/^https?:\/\//.test(sinkDomain)) {
    sinkDomain = `http://${sinkDomain}`
  }
  if (sinkDomain.endsWith('/')) {
    sinkDomain = sinkDomain.slice(0, -1)
  }
  try {
    const res = await axios.post(
      `${sinkDomain}/api/link/create`,
      { url },
      { headers: { Authorization: `Bearer ${sinkToken}` } }
    )
    if (res.data?.link?.slug) {
      return `${sinkDomain}/${res.data.link.slug}`
    }
  } catch (e: any) {
    logger.error(e)
  }
  return url
}

export const generateShortUrl = async (url: string) => {
  const server = db.get(configPaths.settings.shortUrlServer) || IShortUrlServer.C1N
  switch (server) {
    case IShortUrlServer.C1N:
      return createC1NShortUrl(url)
    case IShortUrlServer.YOURLS:
      return createYOURLSShortLink(url)
    case IShortUrlServer.CFWORKER:
      return createShortUrlForCFWorker(url)
    case IShortUrlServer.SINK:
      return createShortUrlFromSink(url)
    default:
      return url
  }
}

export const isUrl = (url: string): boolean => {
  try {
    return Boolean(new URL(url))
  } catch {
    return false
  }
}

export const isUrlEncode = (url: string): boolean => {
  url = url || ''
  try {
    return url !== decodeURI(url)
  } catch {
    return false
  }
}

export const handleUrlEncode = (url: string): string => (isUrlEncode(url) ? url : encodeURI(url))

export const handleUrlEncodeWithSetting = (url: string) =>
  db.get(configPaths.settings.encodeOutputURL) ? handleUrlEncode(url) : url

export const handleStreamlinePluginName = (name: string) => name.replace(/(@[^/]+\/)?picgo-plugin-/, '')
export const simpleClone = (obj: any) => JSON.parse(JSON.stringify(obj))
export const enforceNumber = (num: number | string) => (isNaN(+num) ? 0 : +num)

export const trimValues = <T extends IStringKeyMap>(
  obj: T
): { [K in keyof T]: T[K] extends string ? string : T[K] } => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  ) as { [K in keyof T]: T[K] extends string ? string : T[K] }
}

export const formatEndpoint = (endpoint: string, sslEnabled: boolean): string => {
  const hasProtocol = /^https?:\/\//.test(endpoint)
  if (!hasProtocol) {
    return `${sslEnabled ? 'https' : 'http'}://${endpoint}`
  }
  return sslEnabled ? endpoint.replace(/^http:\/\//, 'https://') : endpoint.replace(/^https:\/\//, 'http://')
}

export const formatHttpProxy = (
  proxy: string | undefined,
  type: 'object' | 'string'
): IHTTPProxy | undefined | string => {
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

export function encodeFilePath (filePath: string) {
  return filePath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')
}

export const trimPath = (path: string) => path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
