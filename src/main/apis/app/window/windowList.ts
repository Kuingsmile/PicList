import { fileURLToPath } from 'node:url'

import bus from '@core/bus'
import { CREATE_APP_MENU } from '@core/bus/constants'
import db from '@core/datastore'
import { app } from 'electron'

import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'
import { IWindowListItem } from '#/types/electron'
import { IWindowList } from '#/types/enum'
import { IBrowserWindowOptions } from '#/types/types'
import { configPaths } from '#/utils/configPaths'
import { T } from '~/i18n'

import logo from '../../../../../resources/logo.png?asset'
import {
  MANUAL_WINDOW_URL,
  MINI_WINDOW_URL,
  RENAME_WINDOW_URL,
  SETTING_WINDOW_URL,
  TOOLBOX_WINDOW_URL,
  TRAY_WINDOW_URL
} from './constants'

const windowList = new Map<IWindowList, IWindowListItem>()

const handleWindowParams = (windowURL: string) => windowURL

const getDefaultWindowSizes = (): { width: number; height: number } => {
  const [mainWindowWidth, mainWindowHeight] = db.get([
    configPaths.settings.mainWindowWidth,
    configPaths.settings.mainWindowHeight
  ])
  return {
    width: mainWindowWidth || 1200,
    height: mainWindowHeight || 800
  }
}
const preloadPath = fileURLToPath(new URL('../preload/index.mjs', import.meta.url))

const { width: defaultWindowWidth, height: defaultWindowHeight } = getDefaultWindowSizes()

const trayWindowOptions = {
  height: 350,
  width: 196,
  show: false,
  frame: false,
  fullscreenable: false,
  resizable: false,
  transparent: true,
  vibrancy: 'ultra-dark',
  webPreferences: {
    sandbox: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    backgroundThrottling: false,
    webSecurity: false
  }
}

const manualWindowOptions = {
  height: 800,
  width: 1200,
  show: false,
  frame: true,
  center: true,
  fullscreenable: true,
  resizable: true,
  title: 'Manual',
  vibrancy: 'ultra-dark',
  transparent: false,
  webPreferences: {
    sandbox: false,
    webviewTag: true,
    backgroundThrottling: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    webSecurity: false
  }
} as IBrowserWindowOptions

const settingWindowOptions = {
  height: defaultWindowHeight,
  width: defaultWindowWidth,
  show: false,
  frame: true,
  center: true,
  fullscreenable: true,
  resizable: true,
  title: 'PicList',
  vibrancy: 'ultra-dark',
  transparent: true,
  titleBarStyle: 'hidden',
  webPreferences: {
    sandbox: false,
    webviewTag: true,
    backgroundThrottling: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    webSecurity: false
  }
} as IBrowserWindowOptions

if (process.platform !== 'darwin') {
  settingWindowOptions.show = false
  settingWindowOptions.frame = false
  settingWindowOptions.backgroundColor = '#3f3c37'
  settingWindowOptions.transparent = false
  settingWindowOptions.icon = '../../../../../resources/logo.png'
}

const miniWindowOptions = {
  height: 64,
  width: 64,
  show: process.platform === 'linux',
  frame: false,
  fullscreenable: false,
  skipTaskbar: true,
  resizable: false,
  transparent: process.platform !== 'linux',
  icon: logo,
  webPreferences: {
    sandbox: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    backgroundThrottling: false,
    nodeIntegrationInWorker: true
  }
} as IBrowserWindowOptions

if (db.get(configPaths.settings.miniWindowOntop)) {
  miniWindowOptions.alwaysOnTop = true
}

const renameWindowOptions = {
  height: 175,
  width: 300,
  show: true,
  fullscreenable: false,
  resizable: false,
  vibrancy: 'ultra-dark',
  webPreferences: {
    sandbox: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    backgroundThrottling: false
  }
} as IBrowserWindowOptions

if (process.platform !== 'darwin') {
  renameWindowOptions.show = true
  renameWindowOptions.backgroundColor = '#3f3c37'
  renameWindowOptions.autoHideMenuBar = true
  renameWindowOptions.transparent = false
}

const toolboxWindowOptions = {
  height: 450,
  width: 800,
  show: false,
  frame: true,
  center: true,
  fullscreenable: false,
  resizable: false,
  title: `PicList ${T('TOOLBOX')}`,
  vibrancy: 'ultra-dark',
  icon: logo,
  webPreferences: {
    sandbox: false,
    backgroundThrottling: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: true,
    webSecurity: false
  }
} as IBrowserWindowOptions

if (process.platform !== 'darwin') {
  toolboxWindowOptions.backgroundColor = '#3f3c37'
  toolboxWindowOptions.autoHideMenuBar = true
  toolboxWindowOptions.transparent = false
}

windowList.set(IWindowList.TRAY_WINDOW, {
  isValid: process.platform !== 'linux',
  multiple: false,
  options: () => trayWindowOptions,
  callback (window) {
    window.loadURL(handleWindowParams(TRAY_WINDOW_URL))
    window.on('blur', () => {
      window.hide()
    })
  }
})

windowList.set(IWindowList.MANUAL_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => manualWindowOptions,
  callback (window) {
    window.loadURL(handleWindowParams(MANUAL_WINDOW_URL))
    window.focus()
  }
})

windowList.set(IWindowList.SETTING_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => settingWindowOptions,
  callback (window, windowManager) {
    window.loadURL(handleWindowParams(SETTING_WINDOW_URL))
    window.webContents.openDevTools({ mode: 'detach' })
    window.on('closed', () => {
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, false)
      if (process.platform === 'linux') {
        process.nextTick(() => {
          app.quit()
        })
      }
    })
    bus.emit(CREATE_APP_MENU)
    windowManager.create(IWindowList.MINI_WINDOW)
  }
})

windowList.set(IWindowList.MINI_WINDOW, {
  isValid: process.platform !== 'darwin',
  multiple: false,
  options: () => miniWindowOptions,
  callback (window) {
    window.loadURL(handleWindowParams(MINI_WINDOW_URL))
  }
})

windowList.set(IWindowList.RENAME_WINDOW, {
  isValid: true,
  multiple: true,
  options: () => renameWindowOptions,
  async callback (window, windowManager) {
    window.loadURL(handleWindowParams(RENAME_WINDOW_URL))
    const currentWindow = windowManager.getAvailableWindow(true)
    if (currentWindow && currentWindow.isVisible()) {
      const { x, y, width, height } = currentWindow.getBounds()
      const positionX = Math.floor(x + width / 2 - 150)
      const positionY = Math.floor(y + height / 2 - (height > 400 ? 88 : 0))
      window.setPosition(positionX, positionY, false)
    }
  }
})

windowList.set(IWindowList.TOOLBOX_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => toolboxWindowOptions,
  async callback (window, windowManager) {
    window.loadURL(TOOLBOX_WINDOW_URL)
    const currentWindow = windowManager.getAvailableWindow(true)
    if (currentWindow && currentWindow.isVisible()) {
      const { x, y, width, height } = currentWindow.getBounds()
      const positionX = Math.floor(x + width / 2 - 400)
      const positionY = Math.floor(y + height / 2 - (height > 400 ? 225 : 0))
      window.setPosition(positionX, positionY, false)
    }
  }
})

export default windowList
