import db from '@core/datastore'
import windowManager from 'apis/app/window/windowManager'
import { screen } from 'electron'

import { IWindowList } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'

export function openMiniWindow (hideSettingWindow: boolean = true) {
  const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
  miniWindow.removeAllListeners()
  if (db.get(configPaths.settings.miniWindowOntop)) {
    miniWindow.setAlwaysOnTop(true)
  }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const lastPosition = db.get(configPaths.settings.miniWindowPosition)
  if (lastPosition) {
    miniWindow.setPosition(lastPosition[0], lastPosition[1])
  } else {
    miniWindow.setPosition(width - 100, height - 100)
  }
  const setPositionFunc = () => {
    const position = miniWindow.getPosition()
    db.set(configPaths.settings.miniWindowPosition, position)
  }
  miniWindow.on('close', setPositionFunc)
  miniWindow.on('move', setPositionFunc)
  miniWindow.show()
  miniWindow.focus()
  if (hideSettingWindow) {
    const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
    settingWindow.hide()
  } else {
    const autoCloseMainWindow = db.get(configPaths.settings.autoCloseMainWindow) || false
    if (windowManager.has(IWindowList.SETTING_WINDOW) && autoCloseMainWindow) {
      windowManager.get(IWindowList.SETTING_WINDOW)!.hide()
    }
  }
}

export const openMainWindow = () => {
  const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
  const autoCloseMiniWindow = db.get(configPaths.settings.autoCloseMiniWindow) || false
  settingWindow!.show()
  settingWindow!.focus()
  if (windowManager.has(IWindowList.MINI_WINDOW) && autoCloseMiniWindow) {
    windowManager.get(IWindowList.MINI_WINDOW)!.hide()
  }
}

export const hideMiniWindow = () => {
  if (windowManager.has(IWindowList.MINI_WINDOW)) {
    windowManager.get(IWindowList.MINI_WINDOW)!.hide()
  }
}
