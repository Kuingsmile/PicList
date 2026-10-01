import { randomUUID } from 'node:crypto'

import { getWindowId } from '@core/bus/apis'
import { GalleryDB } from '@core/datastore'
import { appConfigPath, defaultConfigPath as defaultConfigPathF, galleryDBPath } from '@core/datastore/dirs'
import { DBStore } from '@piclist/store'
import { uploadChoosedFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import { BrowserWindow, dialog, ipcMain, IpcMainEvent, MessageBoxOptions, Notification } from 'electron'

import { CANCEL_INPUT_BOX, SHOW_INPUT_BOX } from '~/events/constant'
import { t } from '~/i18n'
import { IWindowList } from '~/utils/enum'
import { currentUploadJob, sendToWindow, UploadJob } from '~/utils/uploadJob'

// Cross-process support may be required in the future
class GuiApi implements IGuiApi {
  private static instance: GuiApi
  private constructor() {}

  static getInstance(): GuiApi {
    if (!GuiApi.instance) {
      GuiApi.instance = new GuiApi()
    }
    return GuiApi.instance
  }

  private async showSettingWindow(signal?: AbortSignal): Promise<BrowserWindow> {
    signal?.throwIfAborted()
    const window = windowManager.get(IWindowList.SETTING_WINDOW) || windowManager.create(IWindowList.SETTING_WINDOW)
    if (!window || window.isDestroyed() || window.webContents.isDestroyed()) {
      throw new Error('The settings window is unavailable')
    }
    const sender = window.webContents
    window.show()
    if (sender.isLoadingMainFrame()) {
      await new Promise<void>((resolve, reject) => {
        const finish = (failed = false) => {
          clearTimeout(timer)
          sender.removeListener('did-finish-load', onReady)
          sender.removeListener('did-fail-load', onClosed)
          sender.removeListener('destroyed', onClosed)
          window.removeListener('closed', onClosed)
          signal?.removeEventListener('abort', onClosed)
          if (failed) reject(new Error('The settings window did not become ready'))
          else resolve()
        }
        const onReady = () => finish()
        const onClosed = () => finish(true)
        const timer = setTimeout(onClosed, 30_000)
        sender.once('did-finish-load', onReady)
        sender.once('did-fail-load', onClosed)
        sender.once('destroyed', onClosed)
        window.once('closed', onClosed)
        signal?.addEventListener('abort', onClosed, { once: true })
        if (sender.isDestroyed() || signal?.aborted) onClosed()
        else if (!sender.isLoadingMainFrame()) onReady()
      })
    }
    return window
  }

  private getWebcontentsByWindowId(id: number) {
    if (!Number.isInteger(id) || id < 0) return undefined
    return BrowserWindow.fromId(id)?.webContents
  }

  async showInputBox(
    options: IShowInputBoxOption = {
      title: '',
      placeholder: '',
    },
  ) {
    const job = currentUploadJob()
    const window = await this.showSettingWindow(job?.signal)
    const sender = window.webContents
    const requestId = randomUUID()
    job?.throwIfStopped()
    return new Promise<string>((resolve, reject) => {
      let settled = false
      const finish = (value: string, error?: unknown) => {
        if (settled) return
        settled = true
        ipcMain.removeListener(SHOW_INPUT_BOX, onReply)
        sender.removeListener('destroyed', onClosed)
        sender.removeListener('did-start-loading', onClosed)
        sender.removeListener('render-process-gone', onClosed)
        window.removeListener('closed', onClosed)
        job?.signal.removeEventListener('abort', onAbort)
        if (error) reject(error)
        else resolve(value)
      }
      const onReply = (event: IpcMainEvent, value: string, responseId?: string) => {
        if (event.sender !== sender || responseId !== requestId || typeof value !== 'string') return
        finish(value)
      }
      const onClosed = () => finish('')
      const onAbort = () => {
        finish('', job?.signal.reason)
        sendToWindow(sender, CANCEL_INPUT_BOX, requestId)
      }
      ipcMain.on(SHOW_INPUT_BOX, onReply)
      sender.once('destroyed', onClosed)
      sender.once('did-start-loading', onClosed)
      sender.once('render-process-gone', onClosed)
      window.once('closed', onClosed)
      job?.signal.addEventListener('abort', onAbort, { once: true })
      if (job?.signal.aborted) onAbort()
      else if (sender.isDestroyed() || window.isDestroyed()) onClosed()
      else {
        try {
          // Install the response listener before the renderer can reply.
          sender.send(SHOW_INPUT_BOX, options, requestId)
        } catch {
          finish('', new Error('Unable to open the input dialog'))
        }
      }
    })
  }

  async showFileExplorer(options: IShowFileExplorerOption = {}) {
    const id = await getWindowId()
    const window = Number.isInteger(id) && id >= 0 ? BrowserWindow.fromId(id) : undefined
    const res = await (window ? dialog.showOpenDialog(window, options) : dialog.showOpenDialog(options))
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

  async showMessageBox(
    options: IShowMessageBoxOption = {
      title: '',
      message: '',
      type: 'info',
      buttons: ['Yes', 'No'],
    },
  ) {
    const id = await getWindowId()
    const window = Number.isInteger(id) && id >= 0 ? BrowserWindow.fromId(id) : undefined
    const result = await (window
      ? dialog.showMessageBox(window, options as MessageBoxOptions)
      : dialog.showMessageBox(options as MessageBoxOptions))
    return { result: result.response, checkboxChecked: result.checkboxChecked } satisfies IShowMessageBoxResult
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
