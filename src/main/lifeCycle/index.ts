import './errorHandler'
import {
  app,
  globalShortcut,
  protocol,
  Notification,
  dialog,
  screen
} from 'electron'
import {
  createProtocol
} from 'vue-cli-plugin-electron-builder/lib'
import beforeOpen from '~/main/utils/beforeOpen'
import ipcList from '~/main/events/ipcList'
import busEventList from '~/main/events/busEventList'
import { IRemoteNoticeTriggerHook, IWindowList } from '#/types/enum'
import windowManager from 'apis/app/window/windowManager'
import {
  uploadChoosedFiles,
  uploadClipboardFiles
} from 'apis/app/uploader/apis'
import {
  createTray, setDockMenu
} from 'apis/app/system'
import server from '~/main/server/index'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { getUploadFiles } from '~/main/utils/handleArgv'
import db from '~/main/apis/core/datastore'
import bus from '@core/bus'
import logger from 'apis/core/picgo/logger'
import picgo from 'apis/core/picgo'
import fixPath from './fixPath'
import { clearTempFolder } from '../manage/utils/common'
import { initI18n } from '~/main/utils/handleI18n'
import { remoteNoticeHandler } from 'apis/app/remoteNotice'
import { manageIpcList } from '../manage/events/ipcList'
import getManageApi from '../manage/Main'
import UpDownTaskQueue from '../manage/datastore/upDownTaskQueue'
import { T } from '~/main/i18n'
import { UpdateInfo, autoUpdater } from 'electron-updater'
import updateChecker from '../utils/updateChecker'
import clipboardPoll from '../utils/clipboardPoll'
import path from 'path'
import { CLIPBOARD_IMAGE_FOLDER } from '~/universal/utils/static'
import fs from 'fs-extra'
import { startFileServer } from '../fileServer'
const isDevelopment = process.env.NODE_ENV !== 'production'

const handleStartUpFiles = (argv: string[], cwd: string) => {
  const files = getUploadFiles(argv, cwd, logger)
  if (files === null || files.length > 0) { // 如果有文件列表作为参数，说明是命令行启动
    if (files === null) {
      logger.info('cli -> uploading file from clipboard')
      uploadClipboardFiles()
    } else {
      logger.info('cli -> uploading files from cli', ...files.map(item => item.path))
      const win = windowManager.getAvailableWindow()
      uploadChoosedFiles(win.webContents, files)
    }
    return true
  }
  return false
}

autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://release.piclist.cn/latest',
  channel: 'latest'
})

autoUpdater.autoDownload = false

autoUpdater.on('update-available', (info: UpdateInfo) => {
  dialog.showMessageBox({
    type: 'info',
    title: T('FIND_NEW_VERSION'),
    buttons: ['Yes', 'No'],
    message: T('TIPS_FIND_NEW_VERSION', {
      v: info.version
    }),
    checkboxLabel: T('NO_MORE_NOTICE'),
    checkboxChecked: false
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate()
    }
    db.set('settings.showUpdateTip', !result.checkboxChecked)
  }).catch((err) => {
    logger.error(err)
  })
})

autoUpdater.on('download-progress', (progressObj) => {
  const percent = {
    progress: progressObj.percent
  }
  const window = windowManager.get(IWindowList.SETTING_WINDOW)!
  window.webContents.send('updateProgress', percent)
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: T('UPDATE_DOWNLOADED'),
    buttons: ['Yes', 'No'],
    message: T('TIPS_UPDATE_DOWNLOADED')
  }).then((result) => {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    window.webContents.send('updateProgress', { progress: 100 })
    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  }).catch((err) => {
    logger.error(err)
  })
})

autoUpdater.on('error', (err) => {
  console.log(err)
})

class LifeCycle {
  private async beforeReady () {
    protocol.registerSchemesAsPrivileged([{ scheme: 'picgo', privileges: { secure: true, standard: true } }])
    // fix the $PATH in macOS & linux
    fixPath()
    beforeOpen()
    initI18n()
    ipcList.listen()
    getManageApi()
    UpDownTaskQueue.getInstance()
    manageIpcList.listen()
    busEventList.listen()
  }

  private onReady () {
    const readyFunction = async () => {
      console.log('on ready')
      createProtocol('picgo')
      windowManager.create(IWindowList.TRAY_WINDOW)
      windowManager.create(IWindowList.SETTING_WINDOW)
      const isAutoListenClipboard = db.get('settings.isAutoListenClipboard') || false
      const ClipboardWatcher = clipboardPoll
      if (isAutoListenClipboard) {
        db.set('settings.isListeningClipboard', true)
        ClipboardWatcher.startListening()
        ClipboardWatcher.on('change', () => {
          picgo.log.info('clipboard changed')
          uploadClipboardFiles()
        })
      } else {
        db.set('settings.isListeningClipboard', false)
      }
      const isHideDock = db.get('settings.isHideDock') || false
      const startMode = db.get('settings.startMode') || 'quiet'
      if (process.platform === 'darwin') {
        isHideDock ? app.dock.hide() : setDockMenu()
        startMode !== 'no-tray' && createTray()
      } else {
        createTray()
      }
      db.set('needReload', false)
      updateChecker()
      // 不需要阻塞
      process.nextTick(() => {
        shortKeyHandler.init()
      })
      server.startup()
      startFileServer()
      if (process.env.NODE_ENV !== 'development') {
        handleStartUpFiles(process.argv, process.cwd())
      }

      if (global.notificationList && global.notificationList?.length > 0) {
        while (global.notificationList?.length) {
          const option = global.notificationList.pop()
          const notice = new Notification(option!)
          notice.show()
        }
      }
      await remoteNoticeHandler.init()
      remoteNoticeHandler.triggerHook(IRemoteNoticeTriggerHook.APP_START)
      if (startMode === 'mini') {
        windowManager.create(IWindowList.MINI_WINDOW)
        const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
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
      } else if (startMode === 'main') {
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
        settingWindow.show()
        settingWindow.focus()
      }
      const clipboardDir = path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER)
      fs.ensureDir(clipboardDir)
    }
    app.whenReady().then(readyFunction)
  }

  private onRunning () {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      logger.info('detect second instance')
      const result = handleStartUpFiles(commandLine, workingDirectory)
      if (!result) {
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
          if (settingWindow.isMinimized()) {
            settingWindow.restore()
          }
          settingWindow.focus()
        }
      }
    })
    app.on('activate', () => {
      createProtocol('picgo')
      if (!windowManager.has(IWindowList.TRAY_WINDOW)) {
        windowManager.create(IWindowList.TRAY_WINDOW)
      }
      if (!windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.create(IWindowList.SETTING_WINDOW)
      }
    })
    app.setLoginItemSettings({
      openAtLogin: db.get('settings.autoStart') || false
    })
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.kuingsmile.piclist')
    }

    if (process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('Unity')) {
      process.env.XDG_CURRENT_DESKTOP = 'Unity'
    }
  }

  private onQuit () {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('will-quit', () => {
      UpDownTaskQueue.getInstance().persist()
      clearTempFolder()
      globalShortcut.unregisterAll()
      bus.removeAllListeners()
      server.shutdown()
    })
    // Exit cleanly on request from parent process in development mode.
    if (isDevelopment) {
      if (process.platform === 'win32') {
        process.on('message', data => {
          if (data === 'graceful-exit') {
            app.quit()
          }
        })
      } else {
        process.on('SIGTERM', () => {
          app.quit()
        })
      }
    }
  }

  async launchApp () {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    } else {
      await this.beforeReady()
      this.onReady()
      this.onRunning()
      this.onQuit()
    }
  }
}

const bootstrap = new LifeCycle()

export {
  bootstrap
}
