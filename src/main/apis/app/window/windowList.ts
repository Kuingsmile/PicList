import path from 'node:path'
import { fileURLToPath } from 'node:url'

import bus from '@core/bus'
import { CREATE_APP_MENU } from '@core/bus/constants'
import picgo from '@core/picgo'
import { app, BrowserWindow, Rectangle } from 'electron'

import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '~/events/constant'
import { T as $t } from '~/i18n'
import { configPaths } from '~/utils/configPaths'
import { IWindowList } from '~/utils/enum'

import logo from '../../../../../resources/logo.png?asset&asarUnpack'

const windowList = new Map<string, IWindowListItem>()

const getDefaultWindowSizes = (): { width: number; height: number } => {
  const mainWindowWidth = picgo.getConfig<number>(configPaths.settings.mainWindowWidth)
  const mainWindowHeight = picgo.getConfig<number>(configPaths.settings.mainWindowHeight)
  return {
    width: mainWindowWidth || 1200,
    height: mainWindowHeight || 800,
  }
}

export function setMiniWindowShape(win: BrowserWindow) {
  const radius = 32
  const shape: Rectangle[] = []

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        shape.push({ x: radius + x, y: radius + y, width: 1, height: 1 })
      }
    }
  }

  win.setShape(shape)
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
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
    nodeIntegrationInWorker: false,
    backgroundThrottling: true,
    webSecurity: false,
  },
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
  transparent: false,
  backgroundColor: '#ebeef5',
  titleBarStyle: 'hidden',
  webPreferences: {
    sandbox: false,
    webviewTag: true,
    backgroundThrottling: true,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: false,
    webSecurity: false,
  },
} as IBrowserWindowOptions

if (process.platform !== 'darwin') {
  settingWindowOptions.frame = false
  settingWindowOptions.icon = logo
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
    backgroundThrottling: true,
    nodeIntegrationInWorker: false,
  },
} as IBrowserWindowOptions

if (picgo.getConfig<boolean>(configPaths.settings.miniWindowOntop)) {
  miniWindowOptions.alwaysOnTop = true
}

const renameWindowOptions = {
  height: 270,
  width: 350,
  show: true,
  fullscreenable: false,
  icon: logo,
  resizable: true,
  webPreferences: {
    sandbox: false,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: false,
    backgroundThrottling: false,
  },
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
  title: `PicList ${$t('TOOLBOX')}`,
  backgroundColor: '#ebeef5',
  icon: logo,
  webPreferences: {
    sandbox: false,
    backgroundThrottling: true,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: false,
    webSecurity: false,
  },
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
  callback(window) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'))
    }
    window.on('blur', () => {
      window.hide()
    })
  },
})

windowList.set(IWindowList.SETTING_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => settingWindowOptions,
  callback(window, windowManager) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#main-page/upload`)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'), {
        hash: 'main-page/upload',
      })
    }
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
  },
})

windowList.set(IWindowList.MINI_WINDOW, {
  isValid: process.platform !== 'darwin',
  multiple: false,
  options: () => miniWindowOptions,
  callback(window) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#mini-page`)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'), {
        hash: 'mini-page',
      })
    }
  },
})

windowList.set(IWindowList.RENAME_WINDOW, {
  isValid: true,
  multiple: true,
  options: () => renameWindowOptions,
  async callback(window, windowManager) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#rename-page`)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'), {
        hash: 'rename-page',
      })
    }
    const currentWindow = windowManager.getAvailableWindow(true)
    if (currentWindow && currentWindow.isVisible()) {
      const { x, y, width, height } = currentWindow.getBounds()
      const positionX = Math.floor(x + width / 2 - 150)
      const positionY = Math.floor(y + height / 2 - (height > 400 ? 88 : 0))
      window.setPosition(positionX, positionY, false)
    }
  },
})

windowList.set(IWindowList.TOOLBOX_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => toolboxWindowOptions,
  async callback(window, windowManager) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#toolbox-page`)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'), {
        hash: 'toolbox-page',
      })
    }
    const currentWindow = windowManager.getAvailableWindow(true)
    if (currentWindow && currentWindow.isVisible()) {
      const { x, y, width, height } = currentWindow.getBounds()
      const positionX = Math.floor(x + width / 2 - 400)
      const positionY = Math.floor(y + height / 2 - (height > 400 ? 225 : 0))
      window.setPosition(positionX, positionY, false)
    }
  },
})

const updateWindowOptions = {
  height: 600,
  width: 900,
  show: false,
  frame: true,
  center: true,
  fullscreenable: false,
  resizable: false,
  title: 'PicList Update',
  backgroundColor: '#ebeef5',
  icon: logo,
  webPreferences: {
    sandbox: false,
    backgroundThrottling: true,
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    nodeIntegrationInWorker: false,
    webSecurity: false,
  },
} as IBrowserWindowOptions

if (process.platform !== 'darwin') {
  updateWindowOptions.backgroundColor = '#3f3c37'
  updateWindowOptions.autoHideMenuBar = true
  updateWindowOptions.transparent = false
}

windowList.set(IWindowList.UPDATE_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => updateWindowOptions,
  async callback(window, windowManager) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#update-page`)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'), {
        hash: 'update-page',
      })
    }
    const currentWindow = windowManager.getAvailableWindow(true)
    if (currentWindow && currentWindow.isVisible()) {
      const { x, y, width, height } = currentWindow.getBounds()
      const positionX = Math.floor(x + width / 2 - 450)
      const positionY = Math.floor(y + height / 2 - 300)
      window.setPosition(positionX, positionY, false)
    }
  },
})

export default windowList
