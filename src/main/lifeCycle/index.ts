import '~/lifeCycle/errorHandler'

import path from 'node:path'

import bus from '@core/bus'
import db from '@core/datastore'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import { remoteNoticeHandler } from 'apis/app/remoteNotice'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { createTray, setDockMenu } from 'apis/app/system'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import axios from 'axios'
import { app, globalShortcut, Notification, protocol, screen } from 'electron'
import updater from 'electron-updater'
import fs from 'fs-extra'

import busEventList from '~/events/busEventList'
import { rpcServer } from '~/events/rpc'
import { startFileServer, stopFileServer } from '~/fileServer'
import fixPath from '~/lifeCycle/fixPath'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import getManageApi from '~/manage/Main'
import { clearTempFolder } from '~/manage/utils/common'
import server from '~/server/index'
import webServer from '~/server/webServer'
import { isAutoStartEnabled, setAutoStart } from '~/utils/autoStart'
import beforeOpen from '~/utils/beforeOpen'
import clipboardPoll from '~/utils/clipboardPoll'
import { configPaths } from '~/utils/configPaths'
import { II18nLanguage, IRemoteNoticeTriggerHook, ISartMode, IWindowList } from '~/utils/enum'
import { getUploadFiles } from '~/utils/handleArgv'
import { initI18n } from '~/utils/handleI18n'
import { notificationList } from '~/utils/notification'
import { MemoryMonitor } from '~/utils/performanceOptimizer'
import { CLIPBOARD_IMAGE_FOLDER } from '~/utils/static'
import updateChecker from '~/utils/updateChecker'

const isDevelopment = process.env.NODE_ENV !== 'production'
process.noDeprecation = true

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

updater.autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://release.piclist.cn/latest',
  channel: 'latest',
})

updater.autoUpdater.forceDevUpdateConfig = true
updater.autoUpdater.autoDownload = false

updater.autoUpdater.on('update-available', async (info: updater.UpdateInfo) => {
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

  const maxLogLength = 8000
  let displayLog = updateLog
  let truncatedNote = ''

  if (updateLog.length > maxLogLength) {
    const truncatePoint = updateLog.lastIndexOf('\n', maxLogLength)
    displayLog = updateLog.substring(0, truncatePoint > 0 ? truncatePoint : maxLogLength)
    truncatedNote =
      lang === II18nLanguage.ZH_CN
        ? '\n\n... (更多详情请查看完整更新日志)'
        : '\n\n... (See full changelog for more details)'
  }

  windowManager.create(IWindowList.UPDATE_WINDOW)
  const updateWindow = windowManager.get(IWindowList.UPDATE_WINDOW)!

  updateWindow.webContents.once('did-finish-load', () => {
    updateWindow.webContents.send('SHOW_UPDATE_INFO', {
      type: 'update-available',
      title: lang === II18nLanguage.ZH_CN ? '发现新版本' : 'New Update Available',
      version: info.version,
      releaseNotes: displayLog + truncatedNote,
    })
  })

  updateWindow.show()
})

updater.autoUpdater.on('download-progress', progressObj => {
  const percent = {
    progress: progressObj.percent,
  }
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
  const updateWindow = windowManager.get(IWindowList.UPDATE_WINDOW)

  if (settingWindow) {
    settingWindow.webContents.send('updateProgress', percent)
  }
  if (updateWindow) {
    updateWindow.webContents.send('UPDATE_PROGRESS', percent)
  }
})

updater.autoUpdater.on('update-downloaded', () => {
  const lang = db.get(configPaths.settings.language) || II18nLanguage.ZH_CN

  if (!windowManager.has(IWindowList.UPDATE_WINDOW)) {
    windowManager.create(IWindowList.UPDATE_WINDOW)
  }
  const updateWindow = windowManager.get(IWindowList.UPDATE_WINDOW)!

  const sendUpdateInfo = () => {
    updateWindow.webContents.send('SHOW_UPDATE_INFO', {
      type: 'update-downloaded',
      title: lang === II18nLanguage.ZH_CN ? '更新已下载' : 'Update Downloaded',
      message:
        lang === II18nLanguage.ZH_CN
          ? '更新已下载完成，将在下次重启应用时安装。是否立即重启？'
          : 'The update has been downloaded and will be installed on the next app restart. Would you like to restart now?',
    })
  }

  if (updateWindow.webContents.isLoading()) {
    updateWindow.webContents.once('did-finish-load', sendUpdateInfo)
  } else {
    sendUpdateInfo()
  }

  if (!updateWindow.isVisible()) {
    updateWindow.show()
  }
})

updater.autoUpdater.on('error', err => {
  logger.error(err)
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

    if (process.env.NODE_ENV === 'development') {
      MemoryMonitor.start(30000)
    }
  }

  #onReady() {
    const readyFunction = async () => {
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
        isHideDock ? app.dock?.hide() : setDockMenu()
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

      if (notificationList && notificationList.length > 0) {
        while (notificationList.length) {
          const option = notificationList.pop()
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
          if (lastPosition[0] < 0 || lastPosition[0] > width || lastPosition[1] < 0 || lastPosition[1] > height) {
            miniWindow.setPosition(width - 100, height - 100)
            db.set(configPaths.settings.miniWindowPosition, [width - 100, height - 100])
          } else if (
            lastPosition[0] + miniWindow.getSize()[0] > width ||
            lastPosition[1] + miniWindow.getSize()[1] > height
          ) {
            miniWindow.setPosition(width - miniWindow.getSize()[0], height - miniWindow.getSize()[1])
            db.set(configPaths.settings.miniWindowPosition, [
              width - miniWindow.getSize()[0],
              height - miniWindow.getSize()[1],
            ])
          } else {
            miniWindow.setPosition(lastPosition[0], lastPosition[1])
          }
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
      if (!windowManager.has(IWindowList.TRAY_WINDOW)) {
        windowManager.create(IWindowList.TRAY_WINDOW)
      }
      if (!windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.create(IWindowList.SETTING_WINDOW)
      }
    })
    const storedAutoStartEnabled = db.get(configPaths.settings.autoStart) || false
    isAutoStartEnabled()
      .then(actualAutoStartEnabled => {
        if (actualAutoStartEnabled !== storedAutoStartEnabled) {
          logger.warn(
            `Auto-start state mismatch detected. Stored: ${storedAutoStartEnabled}, Actual: ${actualAutoStartEnabled}. Syncing...`,
          )
          setAutoStart(storedAutoStartEnabled).catch(err => {
            logger.error('Failed to sync auto-start:', err)
          })
        }
      })
      .catch(err => {
        logger.error('Failed to check auto-start status:', err)
        setAutoStart(storedAutoStartEnabled).catch(fallbackErr => {
          logger.error('Failed to set auto-start as fallback:', fallbackErr)
        })
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
      MemoryMonitor.stop()
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

const lifeCycle = new LifeCycle()

export { lifeCycle }
