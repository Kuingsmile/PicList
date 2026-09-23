import windowList from 'apis/app/window/windowList'
import { BrowserWindow } from 'electron'

import { IWindowList } from '~/utils/enum'
import { protectRendererNavigation } from '~/utils/rendererSecurity'

class WindowManager implements IWindowManager {
  #windowMap = new Map<string, { id: number; window: BrowserWindow }>()
  #windowIdMap = new Map<number, string>()

  create(name: string) {
    const windowConfig: IWindowListItem = windowList.get(name)!
    if (!windowConfig.isValid) return undefined

    if (!windowConfig.multiple) {
      const existingWin = this.get(name)
      if (existingWin) {
        if (existingWin.isMinimized()) existingWin.restore()
        existingWin.focus()
        return existingWin
      }
    }

    const window = new BrowserWindow(windowConfig.options())
    protectRendererNavigation(window.webContents)
    const id = window.id
    const windowName = windowConfig.multiple ? `${name}_${id}` : name

    this.#windowMap.set(windowName, { id, window })
    this.#windowIdMap.set(id, windowName)

    window.once('closed', () => {
      this.deleteById(id)
    })
    windowConfig.callback(window, this)
    return window
  }

  get(name: string) {
    const entry = this.#windowMap.get(name)
    if (entry?.window.isDestroyed()) {
      this.deleteById(entry.id)
      return undefined
    }
    return entry?.window
  }

  has(name: string) {
    return this.get(name) !== undefined
  }

  deleteById = (id: number | undefined) => {
    if (id === undefined) return
    const name = this.#windowIdMap.get(id)
    if (name) {
      this.#windowMap.delete(name)
      this.#windowIdMap.delete(id)
    }
  }

  getAvailableWindow(isSkipMiniWindow = false) {
    const miniWindow = this.get(IWindowList.MINI_WINDOW)
    if (miniWindow && !isSkipMiniWindow && miniWindow.isVisible()) {
      return miniWindow
    }

    const settingWindow = this.get(IWindowList.SETTING_WINDOW)
    if (settingWindow) return settingWindow

    const trayWindow = this.get(IWindowList.TRAY_WINDOW)
    if (trayWindow) return trayWindow
    return undefined
  }
}

export default new WindowManager()
