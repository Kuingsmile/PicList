import fs from 'fs-extra'
import db from '~/main/apis/core/datastore'
import { clipboard, Notification, dialog } from 'electron'
import { handleUrlEncode } from '~/universal/utils/common'
import axios from 'axios'
import FormData from 'form-data'
import logger from '../apis/core/picgo/logger'

export const handleCopyUrl = (str: string): void => {
  if (db.get('settings.autoCopy') !== false) {
    clipboard.writeText(str)
  }
}

/**
 * show notification
 * @param options
 */
export const showNotification = (options: IPrivateShowNotificationOption = {
  title: '',
  body: '',
  clickToCopy: false,
  copyContent: '',
  clickFn: () => {}
}) => {
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
  return new Promise<IShowMessageBoxResult>(async (resolve) => {
    dialog.showMessageBox(
      options
    ).then((res) => {
      resolve({
        result: res.response,
        checkboxChecked: res.checkboxChecked
      })
    })
  })
}

export const calcDurationRange = (duration: number) => {
  if (duration < 1000) {
    return 500
  } else if (duration < 1500) {
    return 1000
  } else if (duration < 3000) {
    return 2000
  } else if (duration < 5000) {
    return 3000
  } else if (duration < 7000) {
    return 5000
  } else if (duration < 10000) {
    return 8000
  } else if (duration < 12000) {
    return 10000
  } else if (duration < 20000) {
    return 15000
  } else if (duration < 30000) {
    return 20000
  }
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
  if (img.isEmpty()) {
    if (process.platform === 'win32') {
      const imgPath = clipboard.readBuffer('FileNameW')?.toString('ucs2')?.replace(RegExp(String.fromCharCode(0), 'g'), '')
      if (imgPath) {
        return imgPath
      }
    }
  } else {
    if (process.platform === 'darwin') {
      let imgPath = clipboard.read('public.file-url') // will get file://xxx/xxx
      imgPath = ensureFilePath(imgPath)
      if (imgPath) {
        return imgPath.replace('file://', '')
      }
    }
  }
  return ''
}

export const handleUrlEncodeWithSetting = (url: string) => db.get('settings.encodeOutputURL') ? handleUrlEncode(url) : url

const c1nApi = 'https://c1n.cn/link/short'

export const generateShortUrl = async (url: string) => {
  const server = db.get('settings.shortUrlServer') || 'c1n'
  if (server === 'c1n') {
    const form = new FormData()
    form.append('url', url)
    const c1nToken = db.get('settings.c1nToken') || ''
    if (!c1nToken) {
      logger.warn('c1n token is not set')
      return url
    }
    try {
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
  } else if (server === 'yourls') {
    let domain = db.get('settings.yourlsDomain') || ''
    const signature = db.get('settings.yourlsSignature') || ''
    if (domain && signature) {
      if (!/^https?:\/\//.test(domain)) {
        domain = `http://${domain}`
      }
      try {
        const res = await axios.get(`${domain}/yourls-api.php?signature=${signature}&action=shorturl&format=json&url=${url}`)
        if (res.data.shorturl) {
          return res.data.shorturl
        }
      } catch (e: any) {
        if (e.response.data.message.indexOf('already exists in database') !== -1) {
          return e.response.data.shorturl
        }
        logger.error(e)
      }
    } else {
      logger.warn('Yourls server or signature is not set')
    }
  } else if (server === 'cf_worker') {
    let cfWorkerHost = db.get('settings.cfWorkerHost') || ''
    cfWorkerHost = cfWorkerHost.replace(/\/$/, '')
    if (cfWorkerHost) {
      try {
        const res = await axios.post(cfWorkerHost, {
          url
        })
        if (res.data.status === 200 && res.data.key.startsWith('/')) {
          return `${cfWorkerHost}${res.data.key}`
        }
      } catch (e: any) {
        logger.error(e)
      }
    } else {
      logger.warn('CF Worker host is not set')
    }
  }
  return url
}
