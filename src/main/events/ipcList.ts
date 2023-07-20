import {
  app,
  ipcMain,
  shell,
  Notification,
  IpcMainEvent,
  BrowserWindow,
  screen,
  IpcMainInvokeEvent
} from 'electron'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import uploader from 'apis/app/uploader'
import pasteTemplate from '~/main/utils/pasteTemplate'
import db, { GalleryDB } from '~/main/apis/core/datastore'
import server from '~/main/server'
import getPicBeds from '~/main/utils/getPicBeds'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import bus from '@core/bus'
import fs from 'fs-extra'
import {
  TOGGLE_SHORTKEY_MODIFIED_MODE,
  OPEN_DEVTOOLS,
  SHOW_MINI_PAGE_MENU,
  MINIMIZE_WINDOW,
  CLOSE_WINDOW,
  SHOW_MAIN_PAGE_MENU,
  SHOW_UPLOAD_PAGE_MENU,
  OPEN_USER_STORE_FILE,
  OPEN_URL,
  RELOAD_APP,
  SHOW_PLUGIN_PAGE_MENU,
  SET_MINI_WINDOW_POS,
  GET_PICBEDS,
  HIDE_DOCK
} from '#/events/constants'
import {
  uploadClipboardFiles,
  uploadChoosedFiles
} from '~/main/apis/app/uploader/apis'
import picgoCoreIPC from './picgoCoreIPC'
import { handleCopyUrl, generateShortUrl } from '~/main/utils/common'
import { buildMainPageMenu, buildMiniPageMenu, buildPluginPageMenu, buildPicBedListMenu } from './remotes/menu'
import path from 'path'
import { T } from '~/main/i18n'
import { uploadFile, downloadFile } from '../utils/syncSettings'

const STORE_PATH = app.getPath('userData')

export default {
  listen () {
    picgoCoreIPC.listen()
    // from macOS tray
    ipcMain.on('uploadClipboardFiles', async () => {
      const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)!
      // macOS use builtin clipboard is OK
      const img = await uploader.setWebContents(trayWindow.webContents).uploadWithBuildInClipboard()
      if (img !== false) {
        const pasteStyle = db.get('settings.pasteStyle') || 'markdown'
        handleCopyUrl(await (pasteTemplate(pasteStyle, img[0], db.get('settings.customLink'))))
        const isShowResultNotification = db.get('settings.uploadResultNotification') === undefined ? true : !!db.get('settings.uploadResultNotification')
        if (isShowResultNotification) {
          const notification = new Notification({
            title: T('UPLOAD_SUCCEED'),
            body: img[0].imgUrl!
            // icon: file[0]
            // icon: img[0].imgUrl
          })
          notification.show()
        }
        await GalleryDB.getInstance().insert(img[0])
        trayWindow.webContents.send('clipboardFiles', [])
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('updateGallery')
        }
      }
      trayWindow.webContents.send('uploadFiles')
    })

    ipcMain.on('uploadClipboardFilesFromUploadPage', () => {
      uploadClipboardFiles()
    })

    ipcMain.on('uploadChoosedFiles', async (evt: IpcMainEvent, files: IFileWithPath[]) => {
      return uploadChoosedFiles(evt.sender, files)
    })

    ipcMain.on('updateShortKey', (evt: IpcMainEvent, item: IShortKeyConfig, oldKey: string, from: string) => {
      const result = shortKeyHandler.updateShortKey(item, oldKey, from)
      evt.sender.send('updateShortKeyResponse', result)
      if (result) {
        const notification = new Notification({
          title: T('OPERATION_SUCCEED'),
          body: T('TIPS_SHORTCUT_MODIFIED_SUCCEED')
        })
        notification.show()
      } else {
        const notification = new Notification({
          title: T('OPERATION_FAILED'),
          body: T('TIPS_SHORTCUT_MODIFIED_CONFLICT')
        })
        notification.show()
      }
    })

    ipcMain.on('bindOrUnbindShortKey', (evt: IpcMainEvent, item: IShortKeyConfig, from: string) => {
      const result = shortKeyHandler.bindOrUnbindShortKey(item, from)
      if (result) {
        const notification = new Notification({
          title: T('OPERATION_SUCCEED'),
          body: T('TIPS_SHORTCUT_MODIFIED_SUCCEED')
        })
        notification.show()
      } else {
        const notification = new Notification({
          title: T('OPERATION_FAILED'),
          body: T('TIPS_SHORTCUT_MODIFIED_CONFLICT')
        })
        notification.show()
      }
    })

    ipcMain.handle('migrateFromPicGo', async () => {
      const picGoConfigPath = STORE_PATH.replace('piclist', 'picgo')
      const fileToMigration = [
        'data.json',
        'data.bak.json',
        'picgo.db',
        'picgo.bak.db'
      ]
      const targetFileNames = [
        'data.json',
        'data.bak.json',
        'piclist.db',
        'piclist.bak.db'
      ]
      try {
        for (let i = 0; i < fileToMigration.length; i++) {
          if (fs.existsSync(path.join(picGoConfigPath, fileToMigration[i]))) {
            fs.removeSync(path.join(STORE_PATH, targetFileNames[i]))
            fs.copyFileSync(path.join(picGoConfigPath, fileToMigration[i]), path.join(STORE_PATH, targetFileNames[i]))
          }
        }
        return true
      } catch (e) {
        return false
      }
    })

    ipcMain.on('updateCustomLink', () => {
      const notification = new Notification({
        title: T('OPERATION_SUCCEED'),
        body: T('TIPS_CUSTOM_LINK_STYLE_MODIFIED_SUCCEED')
      })
      notification.show()
    })

    ipcMain.on('autoStart', (evt: IpcMainEvent, val: boolean) => {
      app.setLoginItemSettings({
        openAtLogin: val
      })
    })

    ipcMain.handle('getShortUrl', async (evt: IpcMainInvokeEvent, url: string) => {
      const shortUrl = await generateShortUrl(url)
      return shortUrl
    })

    ipcMain.handle('uploadCommonConfig', async () => {
      const dataResult = await uploadFile('data.json')
      const bakResult = await uploadFile('data.bak.json')
      return dataResult + bakResult
    })

    ipcMain.handle('downloadCommonConfig', async () => {
      const dataResult = await downloadFile('data.json')
      const bakResult = await downloadFile('data.bak.json')
      return dataResult + bakResult
    })

    ipcMain.handle('uploadManageConfig', async () => {
      const manageResult = await uploadFile('manage.json')
      const bakResult = await uploadFile('manage.bak.json')
      return manageResult + bakResult
    })

    ipcMain.handle('downloadManageConfig', async () => {
      const manageResult = await downloadFile('manage.json')
      const bakResult = await downloadFile('manage.bak.json')
      return manageResult + bakResult
    })

    ipcMain.handle('uploadAllConfig', async () => {
      const dataResult = await uploadFile('data.json')
      const bakResult = await uploadFile('data.bak.json')
      const manageResult = await uploadFile('manage.json')
      const manageBakResult = await uploadFile('manage.bak.json')
      return dataResult + bakResult + manageResult + manageBakResult
    })

    ipcMain.handle('downloadAllConfig', async () => {
      const dataResult = await downloadFile('data.json')
      const bakResult = await downloadFile('data.bak.json')
      const manageResult = await downloadFile('manage.json')
      const manageBakResult = await downloadFile('manage.bak.json')
      return dataResult + bakResult + manageResult + manageBakResult
    })

    ipcMain.on('toggleMainWindowAlwaysOnTop', () => {
      const mainWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
      const isAlwaysOnTop = mainWindow.isAlwaysOnTop()
      mainWindow.setAlwaysOnTop(!isAlwaysOnTop)
    })

    ipcMain.on('openSettingWindow', () => {
      windowManager.get(IWindowList.SETTING_WINDOW)!.show()
      const autoCloseMiniWindow = db.get('settings.autoCloseMiniWindow') || false
      if (autoCloseMiniWindow) {
        if (windowManager.has(IWindowList.MINI_WINDOW)) {
          windowManager.get(IWindowList.MINI_WINDOW)!.hide()
        }
      }
    })

    ipcMain.on('openMiniWindow', () => {
      const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
      miniWindow.removeAllListeners()
      if (db.get('settings.miniWindowOntop')) {
        miniWindow.setAlwaysOnTop(true)
      }
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      const lastPosition = db.get('settings.miniWindowPosition')
      if (lastPosition) {
        miniWindow.setPosition(lastPosition[0], lastPosition[1])
      } else {
        miniWindow.setPosition(width - 100, height - 100)
      }
      const setPositionFunc = () => {
        const position = miniWindow.getPosition()
        db.set('settings.miniWindowPosition', position)
      }
      miniWindow.on('close', setPositionFunc)
      miniWindow.on('move', setPositionFunc)
      miniWindow.show()
      miniWindow.focus()
      settingWindow.hide()
    })

    //  from mini window
    ipcMain.on('syncPicBed', () => {
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
      }
    })

    ipcMain.on(GET_PICBEDS, (evt: IpcMainEvent) => {
      const picBeds = getPicBeds()
      evt.sender.send(GET_PICBEDS, picBeds)
      evt.returnValue = picBeds
    })

    ipcMain.on(TOGGLE_SHORTKEY_MODIFIED_MODE, (evt: IpcMainEvent, val: boolean) => {
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, val)
    })

    ipcMain.on('updateServer', () => {
      server.restart()
    })
    ipcMain.on(OPEN_DEVTOOLS, (event: IpcMainEvent) => {
      event.sender.openDevTools()
    })
    // menu & window methods
    ipcMain.on(SHOW_MINI_PAGE_MENU, () => {
      const window = windowManager.get(IWindowList.MINI_WINDOW)!
      const menu = buildMiniPageMenu()
      menu.popup({
        window
      })
    })
    ipcMain.on(SHOW_MAIN_PAGE_MENU, () => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildMainPageMenu(window)
      menu.popup({
        window
      })
    })
    ipcMain.on(SHOW_UPLOAD_PAGE_MENU, () => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildPicBedListMenu()
      menu.popup({
        window
      })
    })
    ipcMain.on(SHOW_PLUGIN_PAGE_MENU, (evt: IpcMainEvent, plugin: IPicGoPlugin) => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildPluginPageMenu(plugin)
      menu.popup({
        window
      })
    })
    ipcMain.on(MINIMIZE_WINDOW, () => {
      const window = BrowserWindow.getFocusedWindow()
      window?.minimize()
    })
    ipcMain.on(CLOSE_WINDOW, () => {
      const window = BrowserWindow.getFocusedWindow()
      if (process.platform === 'linux') {
        window?.hide()
      } else {
        window?.close()
      }
    })
    ipcMain.on(OPEN_USER_STORE_FILE, (evt: IpcMainEvent, filePath: string) => {
      const abFilePath = path.join(STORE_PATH, filePath)
      shell.openPath(abFilePath)
    })
    ipcMain.on(OPEN_URL, (evt: IpcMainEvent, url: string) => {
      shell.openExternal(url)
    })
    ipcMain.on(RELOAD_APP, () => {
      app.relaunch()
      app.exit(0)
    })
    ipcMain.on(SET_MINI_WINDOW_POS, (evt: IpcMainEvent, pos: IMiniWindowPos) => {
      const window = BrowserWindow.getFocusedWindow()
      window?.setBounds(pos)
    })
    ipcMain.on(HIDE_DOCK, (_evt: IpcMainEvent, val: boolean) => {
      if (val) {
        app.dock.hide()
      } else {
        app.dock.show()
      }
    })
  },
  dispose () {}
}
