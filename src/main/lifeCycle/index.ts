import axios from 'axios'
import fs from 'fs-extra'
import { app, globalShortcut, protocol, Notification, dialog, screen, shell } from 'electron'
import { UpdateInfo, autoUpdater } from 'electron-updater'
import path from 'path'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

import bus from '@core/bus'
import db from '@core/datastore'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'

import { remoteNoticeHandler } from 'apis/app/remoteNotice'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { createTray, setDockMenu } from 'apis/app/system'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'

import busEventList from '~/events/busEventList'
import { startFileServer, stopFileServer } from '~/fileServer'
import { T } from '~/i18n'
import '~/lifeCycle/errorHandler'
import fixPath from '~/lifeCycle/fixPath'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import getManageApi from '~/manage/Main'
import { clearTempFolder } from '~/manage/utils/common'
import server from '~/server/index'
import webServer from '~/server/webServer'
import beforeOpen from '~/utils/beforeOpen'
import clipboardPoll from '~/utils/clipboardPoll'
import { getUploadFiles } from '~/utils/handleArgv'
import { initI18n } from '~/utils/handleI18n'
import updateChecker from '~/utils/updateChecker'

import { II18nLanguage, IRemoteNoticeTriggerHook, ISartMode, IWindowList } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'
import { CLIPBOARD_IMAGE_FOLDER } from '#/utils/static'
import { rpcServer } from '~/events/rpc'

const isDevelopment = process.env.NODE_ENV !== 'production'

const handleStartUpFiles = (argv: string[], cwd: string) => {
  const files = getUploadFiles(argv, cwd, logger)

  if (files === null) {
    logger.info('cli -> uploading file from clipboard')
    uploadClipboardFiles()
    return true
  }

  if (files.length > 0) {
    logger.info('cli -> uploading files from cli', ...files.map(file => file.path))
    const win = windowManager.getAvailableWindow()
    uploadChoosedFiles(win.webContents, files)
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

autoUpdater.on('update-available', async (info: UpdateInfo) => {
  const lang = db.get(configPaths.settings.language) || II18nLanguage.ZH_CN
  let updateLog = ''
  try {
    const url =
      lang === II18nLanguage.ZH_CN
        ? 'https://release.piclist.cn/currentVersion.md'
        : 'https://release.piclist.cn/currentVersion_en.md'
    const res = await axios.get(url)
    updateLog = res.data
  } catch (e: any) {
    logger.error(e)
  }
  dialog
    .showMessageBox({
      type: 'info',
      title: T('FIND_NEW_VERSION'),
      buttons: ['Yes', 'Go to download page'],
      message:
        T('TIPS_FIND_NEW_VERSION', {
          v: info.version
        }) +
        '\n\n' +
        updateLog,
      checkboxLabel: T('NO_MORE_NOTICE'),
      checkboxChecked: false
    })
    .then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      } else {
        shell.openExternal('https://github.com/Kuingsmile/PicList/releases/latest')
      }
      db.set(configPaths.settings.showUpdateTip, !result.checkboxChecked)
    })
    .catch(err => {
      logger.error(err)
    })
})

autoUpdater.on('download-progress', progressObj => {
  const percent = {
    progress: progressObj.percent
  }
  const window = windowManager.get(IWindowList.SETTING_WINDOW)!
  window.webContents.send('updateProgress', percent)
})

autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'info',
      title: T('UPDATE_DOWNLOADED'),
      buttons: ['Yes', 'No'],
      message: T('TIPS_UPDATE_DOWNLOADED')
    })
    .then(result => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      window.webContents.send('updateProgress', { progress: 100 })
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
    .catch(err => {
      logger.error(err)
    })
})

autoUpdater.on('error', err => {
  console.log(err)
})

class LifeCycle {
  async #beforeReady() {
    protocol.registerSchemesAsPrivileged([{ scheme: 'picgo', privileges: { secure: true, standard: true } }])
    // fix the $PATH in macOS & linux
    fixPath()
    beforeOpen()
    getManageApi()
    UpDownTaskQueue.getInstance()
    initI18n()
    rpcServer.start()
    busEventList.listen()
  }

  #onReady() {
    const readyFunction = async () => {
      createProtocol('picgo')
      windowManager.create(IWindowList.TRAY_WINDOW)
      windowManager.create(IWindowList.SETTING_WINDOW)
      const isAutoListenClipboard = db.get(configPaths.settings.isAutoListenClipboard) || false
      const ClipboardWatcher = clipboardPoll
      if (isAutoListenClipboard) {
        db.set(configPaths.settings.isListeningClipboard, true)
        ClipboardWatcher.startListening()
        ClipboardWatcher.on('change', () => {
          picgo.log.info('clipboard changed')
          uploadClipboardFiles()
        })
      } else {
        db.set(configPaths.settings.isListeningClipboard, false)
      }
      const isHideDock = db.get(configPaths.settings.isHideDock) || false
      let startMode = db.get(configPaths.settings.startMode) || ISartMode.QUIET
      if (process.platform === 'darwin' && startMode === ISartMode.MINI) {
        startMode = ISartMode.QUIET
      }
      const currentPicBed = db.get(configPaths.picBed.uploader) || db.get(configPaths.picBed.current) || 'smms'
      const currentPicBedConfig = db.get(`picBed.${currentPicBed}`)?._configName || 'Default'
      const tooltip = `${currentPicBed} ${currentPicBedConfig}`
      if (process.platform === 'darwin') {
        isHideDock ? app.dock.hide() : setDockMenu()
        startMode !== ISartMode.NO_TRAY && createTray(tooltip)
      } else {
        createTray(tooltip)
      }
      db.set(configPaths.needReload, false)
      updateChecker()
      // 不需要阻塞
      process.nextTick(() => {
        shortKeyHandler.init()
      })
      server.startup()
      webServer.start()
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
      if (startMode === ISartMode.MINI && process.platform !== 'darwin') {
        windowManager.create(IWindowList.MINI_WINDOW)
        const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
        miniWindow.removeAllListeners()
        if (db.get(configPaths.settings.miniWindowOntop)) {
          miniWindow.setAlwaysOnTop(true)
        }
        const { width, height } = screen.getPrimaryDisplay().workAreaSize
        const lastPosition = db.get(configPaths.settings.miniWindowPosition)
        if (lastPosition) {
          miniWindow.setPosition(lastPosition[0], lastPosition[1])
        } else {
          miniWindow.setPosition(width - 100, height - 100)
        }
        const setPositionFunc = () => {
          const position = miniWindow.getPosition()
          db.set(configPaths.settings.miniWindowPosition, position)
        }
        miniWindow.on('close', setPositionFunc)
        miniWindow.on('move', setPositionFunc)
        miniWindow.show()
        miniWindow.focus()
      } else if (startMode === ISartMode.MAIN) {
        const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
        settingWindow.show()
        settingWindow.focus()
      }
      const clipboardDir = path.join(picgo.baseDir, CLIPBOARD_IMAGE_FOLDER)
      fs.emptyDir(clipboardDir)
    }
    app.whenReady().then(readyFunction)
  }

  #onRunning() {
    app.on('second-instance', (_, commandLine, workingDirectory) => {
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
      openAtLogin: db.get(configPaths.settings.autoStart) || false
    })
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.kuingsmile.piclist')
    }

    if (process.env.XDG_CURRENT_DESKTOP && process.env.XDG_CURRENT_DESKTOP.includes('Unity')) {
      process.env.XDG_CURRENT_DESKTOP = 'Unity'
    }
  }

  #onQuit() {
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
      webServer.stop()
      stopFileServer()
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

  async launchApp() {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    } else {
      await this.#beforeReady()
      this.#onReady()
      this.#onRunning()
      this.#onQuit()
    }
  }
}

const bootstrap = new LifeCycle()

export { bootstrap }
