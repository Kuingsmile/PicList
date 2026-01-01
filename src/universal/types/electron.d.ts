// https://stackoverflow.com/questions/45420448/how-to-import-external-type-into-global-d-ts-file
interface IWindowListItem {
  isValid: boolean
  multiple: boolean
  options: () => IBrowserWindowOptions
  callback: (window: import('electron').BrowserWindow, windowManager: IWindowManager) => void
}

interface IWindowManager {
  create: (name: string) => import('electron').BrowserWindow | null
  get: (name: string) => import('electron').BrowserWindow | null
  has: (name: string) => boolean
  // delete: (name: IWindowList) => void
  deleteById: (id: number) => void
  getAvailableWindow: (isSkipMiniWindow?: boolean) => import('electron').BrowserWindow
}

type IpcRendererListener = (event: import('electron').IpcRendererEvent, ...args: any[]) => void
