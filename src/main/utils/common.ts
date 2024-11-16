import axios from 'axios'
import { clipboard, Notification, dialog, Tray } from 'electron'
import FormData from 'form-data'
import fs from 'fs-extra'

import db from '@core/datastore'
import logger from '@core/picgo/logger'

import { IShortUrlServer } from '#/types/enum'
import { handleUrlEncode } from '#/utils/common'
import { configPaths } from '#/utils/configPaths'

export let tray: Tray

export const setTray = (t: Tray) => {
  tray = t
}

export const getTray = () => tray

export function setTrayToolTip(title: string): void {
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
    // icon: options.icon || undefined
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

export const showMessageBox = (options: any) => {
  return new Promise<IShowMessageBoxResult>(async resolve => {
    dialog.showMessageBox(options).then(res => {
      resolve({
        result: res.response,
        checkboxChecked: res.checkboxChecked
      })
    })
  })
}

export const calcDurationRange = (duration: number) => {
  if (duration < 1000) return 500
  if (duration < 1500) return 1000
  if (duration < 3000) return 2000
  if (duration < 5000) return 3000
  if (duration < 7000) return 5000
  if (duration < 10000) return 8000
  if (duration < 12000) return 10000
  if (duration < 20000) return 15000
  if (duration < 30000) return 20000
  // max range
  return 100000
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

export const handleUrlEncodeWithSetting = (url: string) =>
  db.get(configPaths.settings.encodeOutputURL) ? handleUrlEncode(url) : url

const c1nApi = 'https://c1n.cn/link/short'

const generateC1NShortUrl = async (url: string) => {
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

const generateYOURLSShortUrl = async (url: string) => {
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

const generateCFWORKERShortUrl = async (url: string) => {
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

const generateSinkShortUrl = async (url: string) => {
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
      return generateC1NShortUrl(url)
    case IShortUrlServer.YOURLS:
      return generateYOURLSShortUrl(url)
    case IShortUrlServer.CFWORKER:
      return generateCFWORKERShortUrl(url)
    case IShortUrlServer.SINK:
      return generateSinkShortUrl(url)
    default:
      return url
  }
}
