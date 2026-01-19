import windowList from 'apis/app/window/windowList'
import { BrowserWindow } from 'electron'

import { IWindowList } from '~/utils/enum'

class WindowManager implements IWindowManager {
  #windowMap = new Map<string, BrowserWindow>()
  #windowIdMap = new Map<number, string>()

  create(name: string) {
    const windowConfig: IWindowListItem = windowList.get(name)!
    if (!windowConfig.isValid) return undefined

    if (!windowConfig.multiple) {
      const existingWin = this.#windowMap.get(name)
      if (existingWin) {
        if (existingWin.isMinimized()) existingWin.restore()
        existingWin.focus()
        return existingWin
      }
    }

    const window = new BrowserWindow(windowConfig.options())
    const id = window.id
    const windowName = windowConfig.multiple ? `${name}_${id}` : name

    this.#windowMap.set(windowName, window)
    this.#windowIdMap.set(id, windowName)

    windowConfig.callback(window, this)
    window.on('close', () => {
      this.deleteById(id)
    })
    return window
  }

  get(name: string) {
    return this.#windowMap.get(name) || undefined
  }

  has(name: string) {
    return this.#windowMap.has(name)
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
    const miniWindow = this.#windowMap.get(IWindowList.MINI_WINDOW)
    if (miniWindow && miniWindow.isVisible() && !isSkipMiniWindow) {
      return miniWindow
    }

    const settingWindow = this.#windowMap.get(IWindowList.SETTING_WINDOW)
    if (settingWindow) return settingWindow

    const trayWindow = this.#windowMap.get(IWindowList.TRAY_WINDOW)
    if (trayWindow) return trayWindow
    return undefined
  }
}

export default new WindowManager()
