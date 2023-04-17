import {
  Notification,
  WebContents
} from 'electron'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import uploader from '.'
import pasteTemplate from '~/main/utils/pasteTemplate'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import { handleCopyUrl } from '~/main/utils/common'
import { handleUrlEncode } from '#/utils/common'
import { T } from '~/main/i18n/index'
import ALLApi from '@/apis/allApi'
import picgo from '@core/picgo'
import GuiApi from '../../gui'

const handleClipboardUploading = async (): Promise<false | ImgInfo[]> => {
  const useBuiltinClipboard = db.get('settings.useBuiltinClipboard') === undefined ? true : !!db.get('settings.useBuiltinClipboard')
  const win = windowManager.getAvailableWindow()
  if (useBuiltinClipboard) {
    return await uploader.setWebContents(win!.webContents).uploadWithBuildInClipboard()
  }
  return await uploader.setWebContents(win!.webContents).upload()
}

export const uploadClipboardFiles = async (): Promise<IStringKeyMap> => {
  const img = await handleClipboardUploading()
  console.log(img)
  if (img !== false) {
    if (img.length > 0) {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
      const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
      handleCopyUrl(await (pasteTemplate(pasteStyle, img[0], db.get('settings.customLink'))))
      const notification = new Notification({
        title: T('UPLOAD_SUCCEED'),
        body: img[0].imgUrl!
        // icon: img[0].imgUrl
      })
      setTimeout(() => {
        notification.show()
      }, 100)
      await GalleryDB.getInstance().insert(img[0])
      // trayWindow just be created in mac/windows, not in linux
      trayWindow?.webContents?.send('clipboardFiles', [])
      trayWindow?.webContents?.send('uploadFiles', img)
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
      }
      return {
        url: handleUrlEncode(img[0].imgUrl as string),
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

export const uploadChoosedFiles = async (webContents: WebContents, files: IFileWithPath[]): Promise<IStringKeyMap[]> => {
  const input = files.map(item => item.path)
  const imgs = await uploader.setWebContents(webContents).upload(input)
  const result = []
  if (imgs !== false) {
    const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
    const pasteText: string[] = []
    for (let i = 0; i < imgs.length; i++) {
      pasteText.push(await (pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink'))))
      const notification = new Notification({
        title: T('UPLOAD_SUCCEED'),
        body: imgs[i].imgUrl!
        // icon: files[i].path
      })
      setTimeout(() => {
        notification.show()
      }, i * 100)
      await GalleryDB.getInstance().insert(imgs[i])
      result.push({
        url: handleUrlEncode(imgs[i].imgUrl!),
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

export const deleteChoosedFiles = async (list: ImgInfo[]): Promise<boolean[]> => {
  const result = []
  const picBedsCanbeDeleted = ['smms', 'github', 'imgur', 'tcyun', 'aliyun', 'qiniu', 'upyun', 'aws-s3', 'webdavplist']
  for (const item of list) {
    if (item.id) {
      try {
        const dbStore = GalleryDB.getInstance()
        const file = await dbStore.removeById(item.id)
        if (await picgo.getConfig('settings.deleteCloudFile')) {
          if (item.type !== undefined && picBedsCanbeDeleted.includes(item.type)) {
            setTimeout(() => {
              ALLApi.delete(item).then((value: boolean) => {
                if (value) {
                  const notification = new Notification({
                    title: T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2'),
                    body: T('GALLERY_SYNC_DELETE_NOTICE_SUCCEED')
                  })
                  notification.show()
                } else {
                  const notification = new Notification({
                    title: T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2'),
                    body: T('GALLERY_SYNC_DELETE_NOTICE_FAILED')
                  })
                  notification.show()
                }
              })
            }, 0)
          }
        }
        setTimeout(() => {
          picgo.emit('remove', [file], GuiApi.getInstance())
        }, 500)
        result.push(true)
      } catch (e) {
        result.push(false)
      }
    }
  }
  if (windowManager.has(IWindowList.SETTING_WINDOW)) {
    windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
  }
  return result
}
