import { Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash'

import picgo from '@core/picgo'
import db, { GalleryDB } from '@core/datastore'

import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'

import { T } from '~/i18n/index'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/utils/common'
import pasteTemplate from '~/utils/pasteTemplate'

import { IPasteStyle, IWindowList } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'
import { changeCurrentUploader } from '~/utils/handleUploaderConfig'
import { IPicGo } from 'piclist'

const handleClipboardUploading = async (): Promise<false | ImgInfo[]> => {
  const useBuiltinClipboard =
    db.get(configPaths.settings.useBuiltinClipboard) === undefined
      ? true
      : !!db.get(configPaths.settings.useBuiltinClipboard)
  const win = windowManager.getAvailableWindow()
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win!.webContents).uploadWithBuildInClipboard()
  }
  return await uploader.setWebContents(win!.webContents).upload()
}

const handleClipboardUploadingReturnCtx = async (img?: IUploadOption, skipProcess = false): Promise<false | IPicGo> => {
  const useBuiltinClipboard =
    db.get(configPaths.settings.useBuiltinClipboard) === undefined
      ? true
      : !!db.get(configPaths.settings.useBuiltinClipboard)
  const win = windowManager.getAvailableWindow()
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win!.webContents).uploadWithBuildInClipboardReturnCtx(img, skipProcess)
  }
  return await uploader.setWebContents(win!.webContents).uploadReturnCtx(img, skipProcess)
}

export const uploadClipboardFiles = async (): Promise<IStringKeyMap> => {
  const { needRestore, ctx } = await handleSecondaryUpload(undefined, undefined, 'clipboard')
  let img: ImgInfo[] | false = false
  if (needRestore) {
    const res = await handleClipboardUploadingReturnCtx(ctx ? ctx.processedInput : undefined, true)
    img = res ? res.output : false
  } else {
    img = await handleClipboardUploading()
  }
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
          title: T('UPLOAD_SUCCEED'),
          body: shortUrl || img[0].imgUrl!
          // icon: img[0].imgUrl
        })
        setTimeout(() => {
          notification.show()
        }, 100)
      }
      await GalleryDB.getInstance().insert(img[0])
      // trayWindow just be created in mac/windows, not in linux
      trayWindow?.webContents?.send('clipboardFiles', [])
      trayWindow?.webContents?.send('uploadFiles', img)
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
      }
      return {
        url: handleUrlEncodeWithSetting(img[0].imgUrl as string),
        fullResult: img[0]
      }
    } else {
      const notification = new Notification({
        title: T('UPLOAD_FAILED'),
        body: T('TIPS_UPLOAD_NOT_PICTURES')
      })
      notification.show()
      return {
        url: '',
        fullResult: {}
      }
    }
  } else {
    return {
      url: '',
      fullResult: {}
    }
  }
}

export const uploadChoosedFiles = async (
  webContents: WebContents,
  files: IFileWithPath[]
): Promise<IStringKeyMap[]> => {
  const input = files.map(item => item.path)
  const rawInput = cloneDeep(input)
  const { needRestore, ctx } = await handleSecondaryUpload(webContents, input)
  let imgs: ImgInfo[] | false = false
  if (needRestore) {
    const res = await uploader.setWebContents(webContents).uploadReturnCtx(ctx ? ctx.processedInput : input, true)
    imgs = res ? res.output : false
  } else {
    imgs = await uploader.setWebContents(webContents).upload(input)
  }
  const result = []
  if (imgs !== false) {
    const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
    const deleteLocalFile = db.get(configPaths.settings.deleteLocalFile) || false
    const pasteText: string[] = []
    for (let i = 0; i < imgs.length; i++) {
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
        db.get(configPaths.settings.customLink)
      )
      imgs[i].shortUrl = shortUrl
      pasteText.push(pasteTextItem)
      const isShowResultNotification =
        db.get(configPaths.settings.uploadResultNotification) === undefined
          ? true
          : !!db.get(configPaths.settings.uploadResultNotification)
      if (isShowResultNotification) {
        const notification = new Notification({
          title: T('UPLOAD_SUCCEED'),
          body: shortUrl || imgs[i].imgUrl!
          // icon: files[i].path
        })
        setTimeout(() => {
          notification.show()
        }, i * 100)
      }
      await GalleryDB.getInstance().insert(imgs[i])
      result.push({
        url: handleUrlEncodeWithSetting(imgs[i].imgUrl!),
        fullResult: imgs[i]
      })
    }
    handleCopyUrl(pasteText.join('\n'))
    // trayWindow just be created in mac/windows, not in linux
    windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send('uploadFiles', imgs)
    if (windowManager.has(IWindowList.SETTING_WINDOW)) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
    }
    return result
  } else {
    return []
  }
}

export const handleSecondaryUpload = async (
  webContents?: WebContents,
  input?: string[],
  uploadType: 'clipboard' | 'file' | 'tray' = 'file'
): Promise<{ needRestore: boolean; ctx: IPicGo | false }> => {
  const enableSecondUploader = db.get(configPaths.settings.enableSecondUploader) || false
  let currentPicBedType = ''
  let currentPicBedConfig = {} as IStringKeyMap
  let currentPicBedConfigId = ''
  let needRestore = false
  let ctx: IPicGo | false = false
  if (enableSecondUploader) {
    const secondUploader = db.get(configPaths.picBed.secondUploader)
    const secondUploaderConfig = db.get(configPaths.picBed.secondUploaderConfig)
    const secondUploaderId = db.get(configPaths.picBed.secondUploaderId)
    const currentPicBed = db.get('picBed') || ({} as IStringKeyMap)
    currentPicBedType = currentPicBed.uploader || currentPicBed.current || 'smms'
    currentPicBedConfig = currentPicBed[currentPicBedType] || ({} as IStringKeyMap)
    currentPicBedConfigId = currentPicBedConfig._id
    if (
      secondUploader === currentPicBedType &&
      secondUploaderConfig._configName === currentPicBedConfig._configName &&
      secondUploaderId === currentPicBedConfigId
    ) {
      picgo.log.info('second uploader is the same as current uploader')
    } else {
      needRestore = true
      let secondImgs: ImgInfo[] | false = false
      changeCurrentUploader(secondUploader, secondUploaderConfig, secondUploaderId)
      if (uploadType === 'clipboard') {
        ctx = await handleClipboardUploadingReturnCtx(undefined)
      } else {
        ctx = await uploader.setWebContents(webContents!).uploadReturnCtx(input)
      }
      secondImgs = ctx ? ctx.output : false
      if (secondImgs !== false) {
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
        if (uploadType === 'clipboard') {
          if (secondImgs.length > 0) {
            await GalleryDB.getInstance().insert(secondImgs[0])
            trayWindow?.webContents?.send('clipboardFiles', [])
            trayWindow?.webContents?.send('uploadFiles', secondImgs)
          }
        } else {
          for (let i = 0; i < secondImgs.length; i++) {
            await GalleryDB.getInstance().insert(secondImgs[i])
          }
          if (uploadType === 'tray') {
            trayWindow?.webContents?.send('dragFiles', secondImgs)
          } else {
            trayWindow?.webContents?.send('uploadFiles', secondImgs)
          }
        }
        if (windowManager.has(IWindowList.SETTING_WINDOW) && uploadType !== 'tray') {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
        }
      }
    }
  }
  if (needRestore) {
    changeCurrentUploader(currentPicBedType, currentPicBedConfig, currentPicBedConfigId)
  }
  return {
    needRestore,
    ctx
  }
}
