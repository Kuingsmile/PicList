import picgo from '@core/picgo'
import windowManager from 'apis/app/window/windowManager'
import { screen } from 'electron'

import { configPaths } from '~/utils/configPaths'
import { IWindowList } from '~/utils/enum'

export function openMiniWindow(hideSettingWindow: boolean = true) {
  const allConfig = picgo.getConfig<any>() || {}
  let miniWindow = windowManager.get(IWindowList.MINI_WINDOW)
  if (!miniWindow) {
    miniWindow = windowManager.create(IWindowList.MINI_WINDOW)
  }

  miniWindow?.removeAllListeners('close')
  miniWindow?.removeAllListeners('move')

  if (allConfig.settings?.miniWindowOntop) {
    miniWindow?.setAlwaysOnTop(true)
  }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const lastPosition = allConfig.settings?.miniWindowPosition
  const setPositionFunc = () => {
    const position = miniWindow?.getPosition()
    picgo.saveConfig({ [configPaths.settings.miniWindowPosition]: position })
  }
  if (lastPosition) {
    if (lastPosition[0] < 0 || lastPosition[0] > width || lastPosition[1] < 0 || lastPosition[1] > height) {
      miniWindow?.setPosition(width - 100, height - 100)
      picgo.saveConfig({ [configPaths.settings.miniWindowPosition]: [width - 100, height - 100] })
    } else if (
      lastPosition[0] + miniWindow?.getSize()[0] > width ||
      lastPosition[1] + miniWindow?.getSize()[1] > height
    ) {
      miniWindow?.setPosition(width - miniWindow?.getSize()[0], height - miniWindow?.getSize()[1])
      if (miniWindow) {
        picgo.saveConfig({
          [configPaths.settings.miniWindowPosition]: [
            width - miniWindow.getSize()[0],
            height - miniWindow.getSize()[1],
          ],
        })
      }
    } else {
      miniWindow?.setPosition(lastPosition[0], lastPosition[1])
    }
  } else {
    miniWindow?.setPosition(width - 100, height - 100)
  }
  miniWindow?.on('close', setPositionFunc)
  miniWindow?.on('move', setPositionFunc)
  miniWindow?.show()
  miniWindow?.focus()
  if (hideSettingWindow) {
    windowManager.get(IWindowList.SETTING_WINDOW)?.close()
  } else {
    const autoCloseMainWindow = allConfig.settings?.autoCloseMainWindow || false
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
