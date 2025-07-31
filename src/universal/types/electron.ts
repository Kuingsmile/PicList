// https://stackoverflow.com/questions/45420448/how-to-import-external-type-into-global-d-ts-file
import type { BrowserWindow, IpcRendererEvent } from 'electron'

import { IWindowList } from './enum'
import type { IBrowserWindowOptions } from './types'

export interface IWindowListItem {
  isValid: boolean
  multiple: boolean
  options: () => IBrowserWindowOptions
  callback: (window: BrowserWindow, windowManager: IWindowManager) => void
}

export interface IWindowManager {
  create: (name: IWindowList) => BrowserWindow | null
  get: (name: IWindowList) => BrowserWindow | null
  has: (name: IWindowList) => boolean
  // delete: (name: IWindowList) => void
  deleteById: (id: number) => void
  getAvailableWindow: (isSkipMiniWindow?: boolean) => BrowserWindow
}

export type IpcRendererListener = (event: IpcRendererEvent, ...args: any[]) => void
