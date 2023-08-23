// External dependencies
import { app } from 'electron'

// Electron modules

// Custom utilities and modules
import bus from '@core/bus'
import db from '~/main/apis/core/datastore'
import picgo from '~/main/apis/core/picgo'
import { T } from '~/main/i18n'
import { remoteNoticeHandler } from '../remoteNotice'
import {
  SETTING_WINDOW_URL,
  TRAY_WINDOW_URL,
  MINI_WINDOW_URL,
  RENAME_WINDOW_URL,
  TOOLBOX_WINDOW_URL
} from './constants'

// Custom types/enums
import { IRemoteNoticeTriggerHook, IWindowList } from '#/types/enum'

// External utility functions
import { CREATE_APP_MENU } from '@core/bus/constants'
import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/events/constants'

const windowList = new Map<IWindowList, IWindowListItem>()

const handleWindowParams = (windowURL: string) => windowURL

const getDefaultWindowSizes = (): { width: number, height: number } => {
  const mainWindowWidth = picgo.getConfig<any>('settings.mainWindowWidth')
  const mainWindowHeight = picgo.getConfig<any>('settings.mainWindowHeight')
  return {
    width: mainWindowWidth || 1200,
    height: mainWindowHeight || 800
  }
}

const defaultWindowWidth = getDefaultWindowSizes().width
const defaultWindowHeight = getDefaultWindowSizes().height

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
    nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
    contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    nodeIntegrationInWorker: true,
    backgroundThrottling: false,
    webSecurity: false
  }
}

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
    backgroundThrottling: false,
    nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
    contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    nodeIntegrationInWorker: true,
    webSecurity: false
  }
} as IBrowserWindowOptions

if (process.platform !== 'darwin') {
  settingWindowOptions.show = false
  settingWindowOptions.frame = false
  settingWindowOptions.backgroundColor = '#3f3c37'
  settingWindowOptions.transparent = false
  settingWindowOptions.icon = `${__static}/logo.png`
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
  icon: `${__static}/logo.png`,
  webPreferences: {
    backgroundThrottling: false,
    nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
    contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    nodeIntegrationInWorker: true
  }
} as IBrowserWindowOptions

if (db.get('settings.miniWindowOntop')) {
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
    nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
    contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
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
  icon: `${__static}/logo.png`,
  webPreferences: {
    backgroundThrottling: false,
    nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
    contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
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

windowList.set(IWindowList.SETTING_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => settingWindowOptions,
  callback (window, windowManager) {
    window.once('show', () => {
      remoteNoticeHandler.triggerHook(IRemoteNoticeTriggerHook.SETTING_WINDOW_OPEN)
    })
    window.loadURL(handleWindowParams(SETTING_WINDOW_URL))
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
    const currentWindow = windowManager.getAvailableWindow()
    if (currentWindow && currentWindow.isVisible()) {
    // bounds: { x: 821, y: 75, width: 800, height: 450 }
      const bounds = currentWindow.getBounds()
      const positionX = bounds.x + bounds.width / 2 - 150
      let positionY
      // if is the settingWindow
      if (bounds.height > 400) {
        positionY = bounds.y + bounds.height / 2 - 88
      } else { // if is the miniWindow
        positionY = bounds.y + bounds.height / 2
      }
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
    const currentWindow = windowManager.getAvailableWindow()
    if (currentWindow && currentWindow.isVisible()) {
      const bounds = currentWindow.getBounds()
      const positionX = bounds.x + bounds.width / 2 - 400
      let positionY
      if (bounds.height > 400) {
        positionY = bounds.y + bounds.height / 2 - 225
      } else {
        positionY = bounds.y + bounds.height / 2
      }
      window.setPosition(positionX, positionY, false)
    }
  }
})

export default windowList
