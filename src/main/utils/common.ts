import fs from 'fs-extra'
import db from '~/main/apis/core/datastore'
import { clipboard, Notification, dialog } from 'electron'
import { handleUrlEncode } from '~/universal/utils/common'

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
