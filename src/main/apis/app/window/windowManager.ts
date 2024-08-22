import { BrowserWindow } from 'electron'

import windowList from 'apis/app/window/windowList'
import { IWindowList } from '#/types/enum'

class WindowManager implements IWindowManager {
  #windowMap: Map<IWindowList | string, BrowserWindow> = new Map()
  #windowIdMap: Map<number, IWindowList | string> = new Map()

  create(name: IWindowList) {
    const windowConfig: IWindowListItem = windowList.get(name)!
    if (!windowConfig.isValid) return null

    if (!windowConfig.multiple) {
      if (this.has(name)) return this.#windowMap.get(name)!
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

  get(name: IWindowList) {
    if (this.has(name)) {
      return this.#windowMap.get(name)!
    }
    return this.create(name)
  }

  has(name: IWindowList) {
    return this.#windowMap.has(name)
  }

  deleteById = (id: number) => {
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

    return this.create(IWindowList.SETTING_WINDOW)!
  }
}

export default new WindowManager()
