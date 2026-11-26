import picgo from '@core/picgo'
import windowManager from 'apis/app/window/windowManager'
import { type BrowserWindow, screen } from 'electron'

import { IWindowList } from '~/constants'
import { configPaths } from '~/utils/configPaths'

const miniWindowPositionListeners = new WeakMap<BrowserWindow, () => void>()

export function showMiniWindow() {
  let miniWindow = windowManager.get(IWindowList.MINI_WINDOW)
  if (!miniWindow) {
    miniWindow = windowManager.create(IWindowList.MINI_WINDOW)
  }
  if (!miniWindow) return

  miniWindowPositionListeners.get(miniWindow)?.()
  const allConfig = picgo.getConfig<any>() || {}
  if (allConfig.settings?.miniWindowOntop) {
    miniWindow.setAlwaysOnTop(true)
  }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const lastPosition = allConfig.settings?.miniWindowPosition
  let saved = lastPosition
  let timer: NodeJS.Timeout | undefined
  const savePosition = () => {
    clearTimeout(timer)
    timer = undefined
    if (miniWindow.isDestroyed()) return
    const position = miniWindow.getPosition()
    if (position[0] === saved?.[0] && position[1] === saved?.[1]) return
    picgo.saveConfig({ [configPaths.settings.miniWindowPosition]: position })
    saved = position
  }
  const onMove = () => {
    clearTimeout(timer)
    timer = setTimeout(savePosition, 200)
  }
  if (lastPosition) {
    if (lastPosition[0] < 0 || lastPosition[0] > width || lastPosition[1] < 0 || lastPosition[1] > height) {
      miniWindow.setPosition(width - 100, height - 100)
      savePosition()
    } else if (
      lastPosition[0] + miniWindow.getSize()[0] > width ||
      lastPosition[1] + miniWindow.getSize()[1] > height
    ) {
      miniWindow.setPosition(width - miniWindow.getSize()[0], height - miniWindow.getSize()[1])
      savePosition()
    } else {
      miniWindow.setPosition(lastPosition[0], lastPosition[1])
    }
  } else {
    miniWindow.setPosition(width - 100, height - 100)
  }
  miniWindowPositionListeners.set(miniWindow, () => {
    miniWindow.removeListener('close', savePosition)
    miniWindow.removeListener('move', onMove)
    if (timer) savePosition()
  })
  miniWindow.on('close', savePosition)
  miniWindow.on('move', onMove)
  miniWindow.show()
  miniWindow.focus()
}

export function openMiniWindow(hideSettingWindow: boolean = true) {
  showMiniWindow()
  if (hideSettingWindow) {
    windowManager.get(IWindowList.SETTING_WINDOW)?.close()
  } else {
    const autoCloseMainWindow = picgo.getConfig<boolean>(configPaths.settings.autoCloseMainWindow) || false
    if (autoCloseMainWindow) {
      windowManager.get(IWindowList.SETTING_WINDOW)?.close()
    }
  }
}

export const openMainWindow = () => {
  const autoCloseMiniWindow = picgo.getConfig<boolean>(configPaths.settings.autoCloseMiniWindow) || false
  windowManager.create(IWindowList.SETTING_WINDOW)
  if (autoCloseMiniWindow) {
    windowManager.get(IWindowList.MINI_WINDOW)?.close()
  }
}

export const hideMiniWindow = () => {
  windowManager.get(IWindowList.MINI_WINDOW)?.close()
}
