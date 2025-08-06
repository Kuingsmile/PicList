// https://stackoverflow.com/questions/45420448/how-to-import-external-type-into-global-d-ts-file
import type { BrowserWindow, IpcRendererEvent } from 'electron'

import type { IBrowserWindowOptions } from '#/types/types'

export interface IWindowListItem {
  isValid: boolean
  multiple: boolean
  options: () => IBrowserWindowOptions
  callback: (window: BrowserWindow, windowManager: IWindowManager) => void
}

export interface IWindowManager {
  create: (name: string) => BrowserWindow | null
  get: (name: string) => BrowserWindow | null
  has: (name: string) => boolean
  // delete: (name: IWindowList) => void
  deleteById: (id: number) => void
  getAvailableWindow: (isSkipMiniWindow?: boolean) => BrowserWindow
}

export type IpcRendererListener = (event: IpcRendererEvent, ...args: any[]) => void
