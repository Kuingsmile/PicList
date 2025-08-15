import db from '@core/datastore'
import windowManager from 'apis/app/window/windowManager'
import { screen } from 'electron'

import { configPaths } from '~/utils/configPaths'
import { IWindowList } from '~/utils/enum'

export function openMiniWindow(hideSettingWindow: boolean = true) {
  const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!

  miniWindow.removeAllListeners('close')
  miniWindow.removeAllListeners('move')

  if (db.get(configPaths.settings.miniWindowOntop)) {
    miniWindow.setAlwaysOnTop(true)
  }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const lastPosition = db.get(configPaths.settings.miniWindowPosition)
  const setPositionFunc = () => {
    const position = miniWindow.getPosition()
    db.set(configPaths.settings.miniWindowPosition, position)
  }
  if (lastPosition) {
    if (lastPosition[0] < 0 || lastPosition[0] > width || lastPosition[1] < 0 || lastPosition[1] > height) {
      miniWindow.setPosition(width - 100, height - 100)
      db.set(configPaths.settings.miniWindowPosition, [width - 100, height - 100])
    } else if (
      lastPosition[0] + miniWindow.getSize()[0] > width ||
      lastPosition[1] + miniWindow.getSize()[1] > height
    ) {
      miniWindow.setPosition(width - miniWindow.getSize()[0], height - miniWindow.getSize()[1])
      db.set(configPaths.settings.miniWindowPosition, [
        width - miniWindow.getSize()[0],
        height - miniWindow.getSize()[1]
      ])
    } else {
      miniWindow.setPosition(lastPosition[0], lastPosition[1])
    }
  } else {
    miniWindow.setPosition(width - 100, height - 100)
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
