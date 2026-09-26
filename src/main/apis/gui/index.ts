import { getSettingWindowId, getWindowId } from '@core/bus/apis'
import { GalleryDB } from '@core/datastore'
import { appConfigPath, defaultConfigPath as defaultConfigPathF, galleryDBPath } from '@core/datastore/dirs'
import { DBStore } from '@piclist/store'
import { uploadChoosedFiles } from 'apis/app/uploader/apis'
import { BrowserWindow, dialog, ipcMain, IpcMainEvent, MessageBoxOptions, Notification } from 'electron'

import { SHOW_INPUT_BOX } from '~/events/constant'
import { t } from '~/i18n'
import { UploadJob } from '~/utils/uploadJob'

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
    const windowId = await getWindowId()
    const webContents = this.getWebcontentsByWindowId(windowId)
    const results = await uploadChoosedFiles(
      webContents,
      input.map(path => ({ path })),
      undefined,
      new UploadJob({ origin: webContents }),
      { copy: true, notification: 'individual' },
    )
    return results.map(result => result.fullResult)
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
        if (prop === 'overwrite' || prop === 'removeById' || prop === 'removeMany') {
          return new Proxy(target[prop], {
            async apply(method, _ctx, args) {
              const res = await GuiApi.getInstance().showMessageBox({
                title: t('main.notification.warning'),
                message: t('main.notification.pluginRemoveGalleryItem'),
                type: 'info',
                buttons: ['Yes', 'No'],
              })
              if (res.result === 0) {
                return Reflect.apply(method, target, args)
              }
            },
          })
        }
        return Reflect.get(target, prop)
      },
    })
  }
}

export default GuiApi
