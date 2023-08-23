// External dependencies
import fs from 'fs-extra'
import { cloneDeep } from 'lodash'

// Electron modules
import {
  Notification,
  WebContents
} from 'electron'

// Custom utilities and modules
import windowManager from 'apis/app/window/windowManager'
import pasteTemplate from '~/main/utils/pasteTemplate'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/main/utils/common'
import { T } from '~/main/i18n/index'
import ALLApi from '@/apis/allApi'
import picgo from '@core/picgo'
import GuiApi from '../../gui'
import uploader from '.'
import { IWindowList } from '#/types/enum'
import { picBedsCanbeDeleted } from '#/utils/static'
import path from 'path'
import SSHClient from '~/main/utils/sshClient'
import { ISftpPlistConfig } from 'piclist'
import { getRawData } from '~/renderer/utils/common'

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
      const isShowResultNotification = db.get('settings.uploadResultNotification') === undefined ? true : !!db.get('settings.uploadResultNotification')
      if (isShowResultNotification) {
        const notification = new Notification({
          title: T('UPLOAD_SUCCEED'),
          body: img[0].imgUrl!
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

export const uploadChoosedFiles = async (webContents: WebContents, files: IFileWithPath[]): Promise<IStringKeyMap[]> => {
  const input = files.map(item => item.path)
  const rawInput = cloneDeep(input)
  const imgs = await uploader.setWebContents(webContents).upload(input)
  const result = []
  if (imgs !== false) {
    const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
    const deleteLocalFile = db.get('settings.deleteLocalFile') || false
    const pasteText: string[] = []
    for (let i = 0; i < imgs.length; i++) {
      if (deleteLocalFile) {
        fs.remove(rawInput[i]).then(() => {
          picgo.log.info(`delete local file: ${rawInput[i]}`)
        }).catch((err: Error) => {
          picgo.log.error(err)
        })
      }
      pasteText.push(await (pasteTemplate(pasteStyle, imgs[i], db.get('settings.customLink'))))
      const isShowResultNotification = db.get('settings.uploadResultNotification') === undefined ? true : !!db.get('settings.uploadResultNotification')
      if (isShowResultNotification) {
        const notification = new Notification({
          title: T('UPLOAD_SUCCEED'),
          body: imgs[i].imgUrl!
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

async function deleteWebdavFile (config: ISftpPlistConfig, fileName: string) {
  try {
    const client = SSHClient.instance
    await client.connect(config)
    const uploadPath = `/${(config.uploadPath || '')}/`.replace(/\/+/g, '/')
    const remote = path.join(uploadPath, fileName)
    const deleteResult = await client.deleteFile(remote)
    client.close()
    return deleteResult
  } catch (err: any) {
    console.error(err)
    return false
  }
}

export const deleteChoosedFiles = async (list: ImgInfo[]): Promise<boolean[]> => {
  const result = []
  for (const item of list) {
    if (item.id) {
      try {
        const dbStore = GalleryDB.getInstance()
        const file = await dbStore.removeById(item.id)
        if (await picgo.getConfig('settings.deleteCloudFile')) {
          if (item.type !== undefined && picBedsCanbeDeleted.includes(item.type)) {
            const noteFunc = (value: boolean) => {
              const notification = new Notification({
                title: T('MANAGE_BUCKET_BATCH_DELETE_ERROR_MSG_MSG2'),
                body: T(value ? 'GALLERY_SYNC_DELETE_NOTICE_SUCCEED' : 'GALLERY_SYNC_DELETE_NOTICE_FAILED')
              })
              notification.show()
            }
            if (item.type === 'webdavplist') {
              const { fileName, config } = item
              setTimeout(() => {
                deleteWebdavFile(getRawData(config), fileName || '').then(noteFunc)
              }, 0)
            } else {
              setTimeout(() => {
                ALLApi.delete(item).then(noteFunc)
              }, 0)
            }
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
