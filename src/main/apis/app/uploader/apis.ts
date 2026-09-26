import { GalleryDB } from '@core/datastore'
import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'
import { Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash-es'
import type { IUploadOptions } from 'piclist'

import { t } from '~/i18n'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { IPasteStyle, IWindowList } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'
import { runScriptInStage } from '~/utils/runScript'
import { sendToWindow, UploadJob, withUploadJob } from '~/utils/uploadJob'
import { getUploadedSourcePath } from '~/utils/uploadResult'

const handleClipboardUploadingReturnCtx = async (
  img?: IUploadOption,
  options?: IUploadOptions,
  job = new UploadJob({ profile: options, origin: windowManager.getAvailableWindow()?.webContents }),
): Promise<IuploadReturnCtxResult> => {
  const useBuiltinClipboardConfig = picgo.getConfig<boolean | undefined>(configPaths.settings.useBuiltinClipboard)
  const useBuiltinClipboard = useBuiltinClipboardConfig === undefined ? true : !!useBuiltinClipboardConfig
  if (useBuiltinClipboard) {
    return await uploader.uploadWithBuildInClipboardReturnCtx(img, options, job)
  }
  return await uploader.uploadReturnCtx(img, options, job)
}

export const uploadClipboardFiles = async (
  options?: IUploadOptions,
  job = new UploadJob({ profile: options, origin: windowManager.getAvailableWindow()?.webContents }),
): Promise<IStringKeyMap> =>
  withUploadJob(
    job,
    async () => {
      const res = await handleClipboardUploadingReturnCtx(undefined, options, job)
      job.throwIfStopped()
      const img = res.ctx?.output ? res.ctx.output : false
      const backImg = res.backupCtx?.output ? res.backupCtx.output : false
      const allConfig = picgo.getConfig<any>() || {}
      if (img !== false) {
        if (img.length > 0) {
          const pasteStyle = allConfig.settings?.pasteStyle || IPasteStyle.MARKDOWN
          const [pastedText, shortUrl] = await pasteTemplate(pasteStyle, img[0], allConfig.settings?.customLink)
          job.throwIfStopped()
          img[0].shortUrl = shortUrl
          handleCopyUrl(pastedText)
          const isShowResultNotification =
            allConfig.settings?.uploadResultNotification === undefined
              ? true
              : !!allConfig.settings?.uploadResultNotification
          if (isShowResultNotification) {
            const notification = new Notification({
              title: t('main.notification.uploadSuccess'),
              body: shortUrl || img[0].imgUrl!,
              // icon: img[0].imgUrl
            })
            setTimeout(() => {
              notification.show()
            }, 100)
          }
          const inserted = await GalleryDB.getInstance().insert(img[0])
          job.throwIfStopped()
          runScriptInStage('onUploadSuccess', res.ctx || picgo, { galleryItem: inserted })
          // trayWindow just be created in mac/windows, not in linux
          const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
          sendToWindow(trayWindow?.webContents, 'clipboardFiles', [])
          sendToWindow(trayWindow?.webContents, 'uploadFiles')
          const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
          sendToWindow(settingWindow?.webContents, 'updateGallery')
          if (backImg !== false) {
            await GalleryDB.getInstance().insert(backImg[0])
            job.throwIfStopped()
            sendToWindow(trayWindow?.webContents, 'uploadFiles')
            sendToWindow(settingWindow?.webContents, 'updateGallery')
          }
          return {
            url: handleUrlEncodeWithSetting(inserted.imgUrl as string),
            fullResult: inserted,
          }
        } else {
          const notification = new Notification({
            title: t('main.notification.uploadFailed'),
            body: t('main.notification.uploadNotPicturesTips'),
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
    },
    () => ({ url: '', fullResult: {} }),
  )

export const uploadChoosedFiles = async (
  webContents: WebContents | undefined,
  files: IFileWithPath[],
  options?: IUploadOptions,
  job = new UploadJob({ origin: webContents, profile: options }),
): Promise<IStringKeyMap[]> =>
  withUploadJob(
    job,
    async () => {
      const input = files.map(item => item.path)
      const rawInput = cloneDeep(input)
      const res = await uploader.uploadReturnCtx(input, options, job)
      job.throwIfStopped()
      const imgs = res.ctx?.output ? res.ctx.output : false
      const backImgs = res.backupCtx?.output ? res.backupCtx.output : false
      const result = []
      const allConfig = picgo.getConfig<any>() || {}
      if (imgs !== false) {
        const pasteStyle = allConfig.settings?.pasteStyle || IPasteStyle.MARKDOWN
        const deleteLocalFile = allConfig.settings?.deleteLocalFile || false
        const pasteText: string[] = []
        const imgLength = imgs.length
        for (let i = 0; i < imgLength; i++) {
          job.throwIfStopped()
          const sourcePath = getUploadedSourcePath(rawInput, imgs[i], i, imgLength)
          if (deleteLocalFile && sourcePath) {
            fs.remove(sourcePath)
              .then(() => {
                picgo.log.info(`delete local file: ${sourcePath}`)
              })
              .catch((err: Error) => {
                picgo.log.error(err)
              })
          }
          const [pasteTextItem, shortUrl] = await pasteTemplate(pasteStyle, imgs[i], allConfig.settings?.customLink)
          job.throwIfStopped()
          imgs[i].shortUrl = shortUrl
          pasteText.push(pasteTextItem)
          const isShowResultNotification =
            allConfig.settings?.uploadResultNotification === undefined
              ? true
              : !!allConfig.settings?.uploadResultNotification
          if (isShowResultNotification) {
            if (imgLength <= 3) {
              const notification = new Notification({
                title: t('main.notification.uploadSuccess'),
                body: shortUrl || imgs[i].imgUrl!,
                // icon: files[i].path
              })
              setTimeout(() => {
                notification.show()
              }, i * 100)
            } else if (i === imgLength - 1) {
              const notification = new Notification({
                title: t('main.notification.multipleUploadSuccess', { num: imgLength }),
                body: '',
              })
              setTimeout(() => {
                notification.show()
              }, i * 100)
            }
          }
          const inserted = await GalleryDB.getInstance().insert(imgs[i])
          job.throwIfStopped()
          runScriptInStage('onUploadSuccess', res.ctx || picgo, { galleryItem: inserted })
          result.push({
            url: handleUrlEncodeWithSetting(inserted.imgUrl!),
            fullResult: inserted,
          })
        }
        handleCopyUrl(pasteText.join('\n'))
        // trayWindow just be created in mac/windows, not in linux
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
        sendToWindow(trayWindow?.webContents, 'uploadFiles')
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
        sendToWindow(settingWindow?.webContents, 'updateGallery')
        if (backImgs !== false) {
          for (const backImg of backImgs) {
            await GalleryDB.getInstance().insert(backImg)
            job.throwIfStopped()
          }
          sendToWindow(trayWindow?.webContents, 'uploadFiles')
          sendToWindow(settingWindow?.webContents, 'updateGallery')
        }
        return result
      } else {
        return []
      }
    },
    () => [],
  )
