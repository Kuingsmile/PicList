import db, { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'
import { Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash-es'

import { T as $t } from '~/i18n/index'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { IPasteStyle, IWindowList } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'

const handleClipboardUploadingReturnCtx = async (img?: IUploadOption): Promise<(ImgInfo[] | false)[]> => {
  const useBuiltinClipboard =
    db.get(configPaths.settings.useBuiltinClipboard) === undefined
      ? true
      : !!db.get(configPaths.settings.useBuiltinClipboard)
  const win = windowManager.getAvailableWindow()
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win!.webContents).uploadWithBuildInClipboardReturnCtx(img)
  }
  return await uploader.setWebContents(win!.webContents).uploadReturnCtx(img)
}

export const uploadClipboardFiles = async (): Promise<IStringKeyMap> => {
  let img: ImgInfo[] | false = false
  let backImg: ImgInfo[] | false = false
  const res = await handleClipboardUploadingReturnCtx()
  img = res[0] ? res[0] : false
  backImg = res[1] ? res[1] : false
  if (img !== false) {
    if (img.length > 0) {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
      const [pastedText, shortUrl] = await pasteTemplate(pasteStyle, img[0], db.get(configPaths.settings.customLink))
      img[0].shortUrl = shortUrl
      handleCopyUrl(pastedText)
      const isShowResultNotification =
        db.get(configPaths.settings.uploadResultNotification) === undefined
          ? true
          : !!db.get(configPaths.settings.uploadResultNotification)
      if (isShowResultNotification) {
        const notification = new Notification({
          title: $t('UPLOAD_SUCCEED'),
          body: shortUrl || img[0].imgUrl!,
          // icon: img[0].imgUrl
        })
        setTimeout(() => {
          notification.show()
        }, 100)
      }
      const inserted = await GalleryDB.getInstance().insert(img[0])
      // trayWindow just be created in mac/windows, not in linux
      trayWindow?.webContents?.send('clipboardFiles', [])
      trayWindow?.webContents?.send('uploadFiles')
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
      }
      if (backImg !== false) {
        await GalleryDB.getInstance().insert(backImg[0])
        trayWindow?.webContents?.send('uploadFiles')
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
        }
      }
      return {
        url: handleUrlEncodeWithSetting(inserted.imgUrl as string),
        fullResult: inserted,
      }
    } else {
      const notification = new Notification({
        title: $t('UPLOAD_FAILED'),
        body: $t('TIPS_UPLOAD_NOT_PICTURES'),
      })
      notification.show()
      return {
        url: '',
        fullResult: {},
      }
    }
  } else {
    return {
      url: '',
      fullResult: {},
    }
  }
}

export const uploadChoosedFiles = async (
  webContents: WebContents,
  files: IFileWithPath[],
): Promise<IStringKeyMap[]> => {
  const input = files.map(item => item.path)
  const rawInput = cloneDeep(input)
  let imgs: ImgInfo[] | false = false
  let backImgs: ImgInfo[] | false = false
  const res = await uploader.setWebContents(webContents).uploadReturnCtx(input)
  imgs = res[0] ? res[0] : false
  backImgs = res[1] ? res[1] : false
  const result = []
  if (imgs !== false) {
    const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
    const deleteLocalFile = db.get(configPaths.settings.deleteLocalFile) || false
    const pasteText: string[] = []
    const imgLength = imgs.length
    for (let i = 0; i < imgLength; i++) {
      if (deleteLocalFile) {
        fs.remove(rawInput[i])
          .then(() => {
            picgo.log.info(`delete local file: ${rawInput[i]}`)
          })
          .catch((err: Error) => {
            picgo.log.error(err)
          })
      }
      const [pasteTextItem, shortUrl] = await pasteTemplate(
        pasteStyle,
        imgs[i],
        db.get(configPaths.settings.customLink),
      )
      imgs[i].shortUrl = shortUrl
      pasteText.push(pasteTextItem)
      const isShowResultNotification =
        db.get(configPaths.settings.uploadResultNotification) === undefined
          ? true
          : !!db.get(configPaths.settings.uploadResultNotification)
      if (isShowResultNotification) {
        if (imgLength <= 3) {
          const notification = new Notification({
            title: $t('UPLOAD_SUCCEED'),
            body: shortUrl || imgs[i].imgUrl!,
            // icon: files[i].path
          })
          setTimeout(() => {
            notification.show()
          }, i * 100)
        } else if (i === imgLength - 1) {
          const notification = new Notification({
            title: $t('MULTI_UPLOAD_SUCCEED', { n: imgLength }),
            body: '',
          })
          setTimeout(() => {
            notification.show()
          }, i * 100)
        }
      }
      const inserted = await GalleryDB.getInstance().insert(imgs[i])
      result.push({
        url: handleUrlEncodeWithSetting(inserted.imgUrl!),
        fullResult: inserted,
      })
    }
    handleCopyUrl(pasteText.join('\n'))
    // trayWindow just be created in mac/windows, not in linux
    windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send('uploadFiles')
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
    }
    if (backImgs !== false) {
      for (const backImg of backImgs) {
        await GalleryDB.getInstance().insert(backImg)
      }
      windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send('uploadFiles')
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
      }
    }
    return result
  } else {
    return []
  }
}
