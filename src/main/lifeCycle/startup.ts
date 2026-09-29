import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { themesDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import shortKeyHandler from 'apis/app/shortKey/shortKeyHandler'
import { createTray, setDockMenu } from 'apis/app/system'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import { app, net, Notification, protocol } from 'electron'

import { startFileServer } from '~/fileServer'
import { initializeI18n } from '~/i18n'
import server from '~/server/index'
import clipboardPoll from '~/utils/clipboardPoll'
import { configPaths, type IConfigStruct } from '~/utils/configPaths'
import { II18nLanguage, ISartMode, IWindowList } from '~/utils/enum'
import { getUploadFiles } from '~/utils/handleArgv'
import { notificationList } from '~/utils/notification'
import { runScriptInStage } from '~/utils/runScript'
import updateChecker from '~/utils/updateChecker'
import { showMiniWindow } from '~/utils/windowHelper'

type StartupSettings = Partial<
  Pick<IConfigStruct['settings'], 'isAutoListenClipboard' | 'language' | 'isHideDock' | 'startMode'>
>

const defaultStartMode: Partial<Record<NodeJS.Platform, string>> = {
  darwin: ISartMode.QUIET,
  win32: ISartMode.MAIN,
  linux: ISartMode.MINI,
}

export const handleStartUpFiles = (argv: string[], cwd: string): boolean => {
  const files = getUploadFiles(argv, cwd, logger)
  if (files === null) {
    logger.info('cli -> uploading file from clipboard')
    void uploadClipboardFiles()
    return true
  }
  if (files.length === 0) return false

  logger.info(`cli -> uploading ${files.length} files`)
  void uploadChoosedFiles(windowManager.getAvailableWindow()?.webContents, files)
  return true
}

const initializeLanguage = (language: string | undefined) => {
  if (language !== undefined) {
    initializeI18n(language)
    return
  }
  const locale = app.getLocale() || II18nLanguage.ZH_CN
  const defaultLanguage = locale.startsWith('zh') ? II18nLanguage.ZH_CN : II18nLanguage.EN
  initializeI18n(defaultLanguage)
  picgo.saveConfig({ [configPaths.settings.language]: defaultLanguage })
}

const initializeClipboard = (enabled: boolean) => {
  picgo.saveConfig({ [configPaths.settings.isListeningClipboard]: enabled })
  if (!enabled) return

  clipboardPoll.on('change', () => {
    logger.info('clipboard changed')
    void uploadClipboardFiles()
  })
  clipboardPoll.startListening()
}

const initializeTray = (settings: StartupSettings, startMode: string) => {
  const picBed = picgo.getConfig<Partial<IConfigStruct['picBed']>>('picBed') || {}
  const currentPicBed = picBed.uploader || picBed.current || 'smms'
  const currentPicBedConfig = picBed[currentPicBed]?._configName || 'Default'
  const tooltip = `${currentPicBed} ${currentPicBedConfig}`
  if (process.platform === 'darwin') {
    settings.isHideDock ? app.dock?.hide() : setDockMenu()
    if (startMode === ISartMode.NO_TRAY) return
  }
  createTray(tooltip)
}

export const initializeStartup = () => {
  protocol.handle('theme', request => {
    const absolutePath = path.join(themesDir(), new URL(request.url).pathname)
    return net.fetch(pathToFileURL(absolutePath).toString())
  })

  const settings = picgo.getConfig<StartupSettings>('settings') || {}
  initializeLanguage(settings.language)
  initializeClipboard(settings.isAutoListenClipboard || false)
  let startMode = settings.startMode ?? defaultStartMode[process.platform] ?? ISartMode.MAIN
  if (process.platform === 'darwin' && startMode === ISartMode.MINI) startMode = ISartMode.QUIET
  initializeTray(settings, startMode)
  picgo.saveConfig({ [configPaths.needReload]: false })

  void updateChecker()
  process.nextTick(() => shortKeyHandler.init())
  void server.startup()
  void startFileServer()
  if (process.env.NODE_ENV !== 'development') {
    handleStartUpFiles(process.argv, process.cwd())
  }

  let notification: IAppNotification | undefined
  while ((notification = notificationList.pop())) {
    new Notification(notification).show()
  }

  if (startMode === ISartMode.MINI) {
    showMiniWindow()
  } else if (startMode === ISartMode.MAIN) {
    windowManager.create(IWindowList.SETTING_WINDOW)
  }
  void runScriptInStage('onSoftwareOpen', picgo, {})
}
