import { getSettingWindowId, getWindowId } from '@core/bus/apis'
import { GalleryDB } from '@core/datastore'
import { appConfigPath, defaultConfigPath as defaultConfigPathF, galleryDBPath } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import { DBStore } from '@piclist/store'
import uploader from 'apis/app/uploader'
import { BrowserWindow, dialog, ipcMain, IpcMainEvent, MessageBoxOptions, Notification } from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash-es'

import { SHOW_INPUT_BOX } from '~/events/constant'
import { T as $t } from '~/i18n'
import { handleCopyUrl } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { IPasteStyle } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'

// Cross-process support may be required in the future
class GuiApi implements IGuiApi {
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
      placeholder: '',
    },
  ) {
    await this.showSettingWindow()
    this.getWebcontentsByWindowId(this.settingWindowId)?.send(SHOW_INPUT_BOX, options)
    return new Promise<string>(resolve => {
      ipcMain.once(SHOW_INPUT_BOX, (_: IpcMainEvent, value: string) => {
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
    const res = await uploader.setWebContents(webContents!).uploadReturnCtx(input)
    const imgs = res[0] ? res[0] : false
    const backImgs = res[1] ? res[1] : false
    let result: ImgInfo[] = []
    if (imgs !== false) {
      const pasteStyle = picgo.getConfig<string>(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
      const deleteLocalFile = picgo.getConfig<boolean>(configPaths.settings.deleteLocalFile) || false
      const pasteText: string[] = []
      for (let i = 0; i < imgs.length; i++) {
        if (deleteLocalFile) {
          await fs.remove(rawInput[i])
        }
        const [pasteTextItem, shortUrl] = await pasteTemplate(
          pasteStyle,
          imgs[i],
          picgo.getConfig<string>(configPaths.settings.customLink),
        )
        imgs[i].shortUrl = shortUrl
        pasteText.push(pasteTextItem)
        const isShowResultNotification =
          picgo.getConfig<boolean>(configPaths.settings.uploadResultNotification) === undefined
            ? true
            : !!picgo.getConfig<boolean>(configPaths.settings.uploadResultNotification)
        if (isShowResultNotification) {
          const notification = new Notification({
            title: $t('UPLOAD_SUCCEED'),
            body: shortUrl || (imgs[i].imgUrl! as string),
            // icon: imgs[i].imgUrl
          })
          setTimeout(() => {
            notification.show()
          }, i * 100)
        }
        await GalleryDB.getInstance().insert(imgs[i])
      }
      handleCopyUrl(pasteText.join('\n'))
      webContents?.send('uploadFiles')
      webContents?.send('updateGallery')
      result = imgs
    }
    if (backImgs !== false) {
      for (const backImg of backImgs) {
        await GalleryDB.getInstance().insert(backImg)
      }
      webContents?.send('uploadFiles')
      webContents?.send('updateGallery')
    }
    return result
  }

  showNotification(
    options: IShowNotificationOption = {
      title: '',
      body: '',
    },
  ) {
    const notification = new Notification({
      title: options.title,
      body: options.body,
    })
    notification.show()
  }

  showMessageBox(
    options: IShowMessageBoxOption = {
      title: '',
      message: '',
      type: 'info',
      buttons: ['Yes', 'No'],
    },
  ) {
    return new Promise<IShowMessageBoxResult>(resolve => {
      getWindowId().then(id => {
        this.windowId = id
        dialog.showMessageBox(BrowserWindow.fromId(id)!, options as MessageBoxOptions).then(res => {
          resolve({
            result: res.response,
            checkboxChecked: res.checkboxChecked,
          })
        })
      })
    })
  }

  /**
   * get picgo config/data path
   */
  async getConfigPath() {
    const currentConfigPath = appConfigPath()
    const galleryDBPathValue = galleryDBPath()
    return {
      defaultConfigPath: defaultConfigPathF(),
      currentConfigPath,
      galleryDBPath: galleryDBPathValue,
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
                    title: $t('TIPS_WARNING'),
                    message: $t('TIPS_PLUGIN_REMOVE_GALLERY_ITEM'),
                    type: 'info',
                    buttons: ['Yes', 'No'],
                  })
                  .then(res => {
                    if (res.result === 0) {
                      resolve(Reflect.apply(target, ctx, args))
                    } else {
                      resolve(undefined)
                    }
                  })
              })
            },
          })
        }
        if (prop === 'removeById') {
          return new Proxy(GalleryDB.getInstance().removeById, {
            apply(target, ctx, args) {
              return new Promise(resolve => {
                const guiApi = GuiApi.getInstance()
                guiApi
                  .showMessageBox({
                    title: $t('TIPS_WARNING'),
                    message: $t('TIPS_PLUGIN_REMOVE_GALLERY_ITEM'),
                    type: 'info',
                    buttons: ['Yes', 'No'],
                  })
                  .then(res => {
                    if (res.result === 0) {
                      resolve(Reflect.apply(target, ctx, args))
                    } else {
                      resolve(undefined)
                    }
                  })
              })
            },
          })
        }
        return Reflect.get(target, prop)
      },
    })
  }
}

export default GuiApi
