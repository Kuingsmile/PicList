import { GalleryDB } from '@core/datastore'
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
import { runScriptInStage } from '~/utils/runScript'

const handleClipboardUploadingReturnCtx = async (img?: IUploadOption): Promise<IuploadReturnCtxResult> => {
  const useBuiltinClipboardConfig = picgo.getConfig<boolean | undefined>(configPaths.settings.useBuiltinClipboard)
  const useBuiltinClipboard = useBuiltinClipboardConfig === undefined ? true : !!useBuiltinClipboardConfig
  const win = windowManager.getAvailableWindow()
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win?.webContents).uploadWithBuildInClipboardReturnCtx(img)
  }
  return await uploader.setWebContents(win?.webContents).uploadReturnCtx(img)
}

export const uploadClipboardFiles = async (): Promise<IStringKeyMap> => {
  let img: ImgInfo[] | false = false
  let backImg: ImgInfo[] | false = false
  const res = await handleClipboardUploadingReturnCtx()
  img = res.ctx?.output ? res.ctx.output : false
  backImg = res.backupCtx?.output ? res.backupCtx.output : false
  const allConfig = picgo.getConfig<any>() || {}
  if (img !== false) {
    if (img.length > 0) {
      const pasteStyle = allConfig.settings?.pasteStyle || IPasteStyle.MARKDOWN
      const [pastedText, shortUrl] = await pasteTemplate(pasteStyle, img[0], allConfig.settings?.customLink)
      img[0].shortUrl = shortUrl
      handleCopyUrl(pastedText)
      const isShowResultNotification =
        allConfig.settings?.uploadResultNotification === undefined
          ? true
          : !!allConfig.settings?.uploadResultNotification
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
      runScriptInStage('onUploadSuccess', res.ctx || picgo, { galleryItem: inserted })
      // trayWindow just be created in mac/windows, not in linux
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      trayWindow?.webContents?.send('clipboardFiles', [])
      trayWindow?.webContents?.send('uploadFiles')
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
      settingWindow?.webContents?.send('updateGallery')
      if (backImg !== false) {
        await GalleryDB.getInstance().insert(backImg[0])
        trayWindow?.webContents?.send('uploadFiles')
        settingWindow?.webContents?.send('updateGallery')
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
  webContents: WebContents | undefined,
  files: IFileWithPath[],
): Promise<IStringKeyMap[]> => {
  const input = files.map(item => item.path)
  const rawInput = cloneDeep(input)
  let imgs: ImgInfo[] | false = false
  let backImgs: ImgInfo[] | false = false
  const res = await uploader.setWebContents(webContents).uploadReturnCtx(input)
  imgs = res.ctx?.output ? res.ctx.output : false
  backImgs = res.backupCtx?.output ? res.backupCtx.output : false
  const result = []
  const allConfig = picgo.getConfig<any>() || {}
  if (imgs !== false) {
    const pasteStyle = allConfig.settings?.pasteStyle || IPasteStyle.MARKDOWN
    const deleteLocalFile = allConfig.settings?.deleteLocalFile || false
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
      const [pasteTextItem, shortUrl] = await pasteTemplate(pasteStyle, imgs[i], allConfig.settings?.customLink)
      imgs[i].shortUrl = shortUrl
      pasteText.push(pasteTextItem)
      const isShowResultNotification =
        allConfig.settings?.uploadResultNotification === undefined
          ? true
          : !!allConfig.settings?.uploadResultNotification
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
      runScriptInStage('onUploadSuccess', res.ctx || picgo, { galleryItem: inserted })
      result.push({
        url: handleUrlEncodeWithSetting(inserted.imgUrl!),
        fullResult: inserted,
      })
    }
    handleCopyUrl(pasteText.join('\n'))
    // trayWindow just be created in mac/windows, not in linux
    const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
    trayWindow?.webContents?.send('uploadFiles')
    const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
    settingWindow?.webContents?.send('updateGallery')
    if (backImgs !== false) {
      for (const backImg of backImgs) {
        await GalleryDB.getInstance().insert(backImg)
      }
      trayWindow?.webContents?.send('uploadFiles')
      settingWindow?.webContents?.send('updateGallery')
    }
    return result
  } else {
    return []
  }
}
