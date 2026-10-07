import path from 'node:path'
import { fileURLToPath } from 'node:url'

import bus from '@core/bus'
import { CREATE_APP_MENU } from '@core/bus/constants'
import picgo from '@core/picgo'
import { app, nativeTheme } from 'electron'

import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/constants/ipcChannels'
import { IWindowList } from '~/constants'
import { t } from '~/i18n'
import { configPaths } from '~/utils/configPaths'

import logo from '../../../../../resources/logo.png?asset&asarUnpack'

const windowList = new Map<string, IWindowListItem>()

const getDefaultWindowSizes = (): { width: number; height: number } => {
  const allConfig = picgo.getConfig<any>() || {}
  const mainWindowWidth = allConfig.settings?.mainWindowWidth
  const mainWindowHeight = allConfig.settings?.mainWindowHeight
  return {
    width: mainWindowWidth || 1200,
    height: mainWindowHeight || 800,
  }
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

const toolboxWindowOptions = () =>
  ({
    height: 680,
    width: 860,
    minWidth: 520,
    minHeight: 480,
    show: false,
    frame: true,
    center: true,
    fullscreenable: false,
    maximizable: false,
    resizable: true,
    autoHideMenuBar: true,
    title: 'PicList Toolbox',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#2c2c2e' : '#fbfbfd',
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
  }) as IBrowserWindowOptions

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
      window.close()
    })
    window.on('closed', () => {
      window = null as unknown as Electron.BrowserWindow
    })
  },
})

windowList.set(IWindowList.SETTING_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => settingWindowOptions,
  callback(window) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#main-page/upload`)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'), {
        hash: 'main-page/upload',
      })
    }
    window.on('closed', () => {
      bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, false)
      window = null as unknown as Electron.BrowserWindow
    })
    window.on('blur', () => bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, false))
    window.webContents.on('render-process-gone', () => bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, false))
    window.webContents.on('did-start-loading', () => bus.emit(TOGGLE_SHORTKEY_MODIFIED_MODE, false))
    window.once('ready-to-show', async () => {
      window.show()
      window.focus()
    })
    bus.emit(CREATE_APP_MENU)
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
    window.on('closed', () => {
      window = null as unknown as Electron.BrowserWindow
    })
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
    window.on('closed', () => {
      window = null as unknown as Electron.BrowserWindow
    })
  },
})

windowList.set(IWindowList.TOOLBOX_WINDOW, {
  isValid: true,
  multiple: false,
  options: toolboxWindowOptions,
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
      const [ownWidth, ownHeight] = window.getSize()
      const positionX = Math.floor(x + width / 2 - ownWidth / 2)
      const positionY = Math.max(y, Math.floor(y + height / 2 - ownHeight / 2))
      window.setPosition(positionX, positionY, false)
    }
    window.once('ready-to-show', () => {
      window.show()
      window.focus()
    })
    window.on('closed', () => {
      window = null as unknown as Electron.BrowserWindow
    })
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
    window.on('closed', () => {
      window = null as unknown as Electron.BrowserWindow
    })
  },
})

windowList.set(IWindowList.ABOUT_WINDOW, {
  isValid: true,
  multiple: false,
  options: () => ({
    width: 600,
    height: 690,
    minWidth: 360,
    minHeight: 480,
    show: false,
    center: true,
    fullscreenable: false,
    maximizable: false,
    resizable: true,
    autoHideMenuBar: true,
    title: `${t('main.menu.about')} PicList`,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#2c2c2e' : '#fbfbfd',
    icon: logo,
    webPreferences: {
      sandbox: false,
      preload: preloadPath,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      backgroundThrottling: true,
    },
  }),
  callback(window) {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#about-page`)
    } else {
      window.loadFile(path.join(dirname, '../renderer/index.html'), { hash: 'about-page' })
    }
    window.setMenu(null)
    window.once('ready-to-show', () => {
      window.show()
      window.focus()
    })
  },
})

export default windowList
