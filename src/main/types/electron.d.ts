/// <reference types="electron-vite/node" />

// https://stackoverflow.com/questions/45420448/how-to-import-external-type-into-global-d-ts-file
interface IWindowListItem {
  isValid: boolean
  multiple: boolean
  options: () => IBrowserWindowOptions
  callback: (window: import('electron').BrowserWindow, windowManager: IWindowManager) => void
}

interface IWindowManager {
  create: (name: string) => import('electron').BrowserWindow | undefined
  get: (name: string) => import('electron').BrowserWindow | undefined
  has: (name: string) => boolean
  // delete: (name: IWindowList) => void
  deleteById: (id: number) => void
  getAvailableWindow: (isSkipMiniWindow?: boolean) => import('electron').BrowserWindow | undefined
}

// Main process
interface IBrowserWindowOptions {
  height: number
  width: number
  show: boolean
  fullscreenable: boolean
  resizable: boolean
  webPreferences: {
    preload?: string
    sandbox?: boolean
    nodeIntegration: boolean
    nodeIntegrationInWorker: boolean
    contextIsolation: boolean
    backgroundThrottling: boolean
    webSecurity?: boolean
  }
  vibrancy?: string | any
  frame?: boolean
  center?: boolean
  title?: string
  titleBarStyle?: string | any
  backgroundColor?: string
  autoHideMenuBar?: boolean
  transparent?: boolean
  icon?: string
  skipTaskbar?: boolean
  alwaysOnTop?: boolean
  [propName: string]: any
}

interface IBounds {
  x: number
  y: number
}

interface IMiniWindowPos {
  x: number
  y: number
  height: number
  width: number
}
