import { BrowserWindow, dialog, ipcMain, Notification } from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash'
import { DBStore } from '@picgo/store'

import { getWindowId, getSettingWindowId } from '@core/bus/apis'

import db, { GalleryDB } from '@core/datastore'
import { dbPathChecker, defaultConfigPath, getGalleryDBPath } from '@core/datastore/dbChecker'

import uploader from 'apis/app/uploader'

import { T } from '~/i18n'
import { handleCopyUrl } from '~/utils/common'
import pasteTemplate from '~/utils/pasteTemplate'

import { SHOW_INPUT_BOX } from '#/events/constants'
import { IPasteStyle } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'
import { handleSecondaryUpload } from '../app/uploader/apis'

// Cross-process support may be required in the future
class GuiApi implements IGuiApi {
  // eslint-disable-next-line no-use-before-define
  private static instance: GuiApi
  private windowId: number = -1
  private settingWindowId: number = -1
  private constructor() {
    console.log('init guiapi')
  }

  static getInstance(): GuiApi {
    if (!GuiApi.instance) {
      GuiApi.instance = new GuiApi()
    }
    return GuiApi.instance
  }

  private async showSettingWindow() {
    this.settingWindowId = await getSettingWindowId()
    const settingWindow = BrowserWindow.fromId(this.settingWindowId)
    if (settingWindow?.isVisible()) {
      return true
    }
    settingWindow?.show()
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve()
      }, 1000) // TODO: a better way to wait page loaded.
    })
  }

  private getWebcontentsByWindowId(id: number) {
    return BrowserWindow.fromId(id)?.webContents
  }

  async showInputBox(
    options: IShowInputBoxOption = {
      title: '',
      placeholder: ''
    }
  ) {
    await this.showSettingWindow()
    this.getWebcontentsByWindowId(this.settingWindowId)?.send(SHOW_INPUT_BOX, options)
    return new Promise<string>(resolve => {
      ipcMain.once(SHOW_INPUT_BOX, (_: Event, value: string) => {
        resolve(value)
      })
    })
  }

  async showFileExplorer(options: IShowFileExplorerOption = {}) {
    this.windowId = await getWindowId()
    const res = await dialog.showOpenDialog(BrowserWindow.fromId(this.windowId)!, options)
    return res.filePaths || []
  }

  async upload(input: IUploadOption) {
    this.windowId = await getWindowId()
    const webContents = this.getWebcontentsByWindowId(this.windowId)
    const rawInput = cloneDeep(input)
    const { needRestore, ctx } = await handleSecondaryUpload(webContents!, input)
    let imgs: ImgInfo[] | false = false
    if (needRestore) {
      const res = await uploader.setWebContents(webContents!).uploadReturnCtx(ctx ? ctx.processedInput : input, true)
      imgs = res ? res.output : false
    } else {
      imgs = await uploader.setWebContents(webContents!).upload(input)
    }
    if (imgs !== false) {
      const pasteStyle = db.get(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
      const deleteLocalFile = db.get(configPaths.settings.deleteLocalFile) || false
      const pasteText: string[] = []
      for (let i = 0; i < imgs.length; i++) {
        if (deleteLocalFile) {
          await fs.remove(rawInput[i])
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
            body: shortUrl || (imgs[i].imgUrl! as string)
            // icon: imgs[i].imgUrl
          })
          setTimeout(() => {
            notification.show()
          }, i * 100)
        }
        await GalleryDB.getInstance().insert(imgs[i])
      }
      handleCopyUrl(pasteText.join('\n'))
      webContents?.send('uploadFiles', imgs)
      webContents?.send('updateGallery')
      return imgs
    }
    return []
  }

  showNotification(
    options: IShowNotificationOption = {
      title: '',
      body: ''
    }
  ) {
    const notification = new Notification({
      title: options.title,
      body: options.body
    })
    notification.show()
  }

  showMessageBox(
    options: IShowMessageBoxOption = {
      title: '',
      message: '',
      type: 'info',
      buttons: ['Yes', 'No']
    }
  ) {
    return new Promise<IShowMessageBoxResult>(async resolve => {
      this.windowId = await getWindowId()
      dialog.showMessageBox(BrowserWindow.fromId(this.windowId)!, options).then(res => {
        resolve({
          result: res.response,
          checkboxChecked: res.checkboxChecked
        })
      })
    })
  }

  /**
   * get picgo config/data path
   */
  async getConfigPath() {
    const currentConfigPath = dbPathChecker()
    const galleryDBPath = getGalleryDBPath().dbPath
    return {
      defaultConfigPath,
      currentConfigPath,
      galleryDBPath
    }
  }

  get galleryDB(): DBStore {
    return new Proxy<DBStore>(GalleryDB.getInstance(), {
      get(target, prop: keyof DBStore) {
        if (prop === 'overwrite') {
          return new Proxy(GalleryDB.getInstance().overwrite, {
            apply(target, ctx, args) {
              return new Promise(resolve => {
                const guiApi = GuiApi.getInstance()
                guiApi
                  .showMessageBox({
                    title: T('TIPS_WARNING'),
                    message: T('TIPS_PLUGIN_REMOVE_GALLERY_ITEM'),
                    type: 'info',
                    buttons: ['Yes', 'No']
                  })
                  .then(res => {
                    if (res.result === 0) {
                      resolve(Reflect.apply(target, ctx, args))
                    } else {
                      resolve(undefined)
                    }
                  })
              })
            }
          })
        }
        if (prop === 'removeById') {
          return new Proxy(GalleryDB.getInstance().removeById, {
            apply(target, ctx, args) {
              return new Promise(resolve => {
                const guiApi = GuiApi.getInstance()
                guiApi
                  .showMessageBox({
                    title: T('TIPS_WARNING'),
                    message: T('TIPS_PLUGIN_REMOVE_GALLERY_ITEM'),
                    type: 'info',
                    buttons: ['Yes', 'No']
                  })
                  .then(res => {
                    if (res.result === 0) {
                      resolve(Reflect.apply(target, ctx, args))
                    } else {
                      resolve(undefined)
                    }
                  })
              })
            }
          })
        }
        return Reflect.get(target, prop)
      }
    })
  }
}

export default GuiApi
