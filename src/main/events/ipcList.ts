// Electron 相关
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

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// 上传器
import uploader from 'apis/app/uploader'

// 粘贴模板函数
import pasteTemplate from '~/main/utils/pasteTemplate'

// 数据存储库和类型声明
import db, { GalleryDB } from '~/main/apis/core/datastore'

// 服务器模块
import server from '~/main/server'

// 获取图片床模块
import getPicBeds from '~/main/utils/getPicBeds'

// 快捷键处理器
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'

// 全局事件总线
import bus from '@core/bus'

// 文件系统库
import fs from 'fs-extra'

// 事件常量
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

// 上传剪贴板文件和已选文件的函数
import {
  uploadClipboardFiles,
  uploadChoosedFiles
} from '~/main/apis/app/uploader/apis'

// 核心 IPC 模块
import picgoCoreIPC from './picgoCoreIPC'

// 处理复制的 URL 和生成短链接的函数
import { handleCopyUrl, generateShortUrl } from '~/main/utils/common'

// 构建主页面、迷你页面、插件页面、图片床列表的菜单函数
import { buildMainPageMenu, buildMiniPageMenu, buildPluginPageMenu, buildPicBedListMenu } from './remotes/menu'

// 路径处理库
import path from 'path'

// i18n 模块
import { T } from '~/main/i18n'

// 同步设置的上传和下载文件函数
import { uploadFile, downloadFile } from '../utils/syncSettings'

// SSH 客户端模块
import SSHClient from '../utils/sshClient'

// Sftp 配置类型声明
import { ISftpPlistConfig } from 'piclist'

import { removeFileFromS3InMain } from '~/main/utils/deleteFunc'

const STORE_PATH = app.getPath('userData')

export default {
  listen () {
    picgoCoreIPC.listen()
    // Upload Related IPC
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

    // ShortKey Related IPC
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

    // Gallery image cloud delete IPC
    ipcMain.handle('delete-sftp-file', async (_evt: IpcMainInvokeEvent, config: ISftpPlistConfig, fileName: string) => {
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
    })

    ipcMain.handle('delete-aws-s3-file', async (_evt: IpcMainInvokeEvent, configMap: IStringKeyMap) => {
      const result = await removeFileFromS3InMain(configMap)
      return result
    })

    // migrate from PicGo

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

    // PicList Setting page IPC

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

    // Window operation API

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
