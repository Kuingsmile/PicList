import picgo from '@core/picgo'
import windowManager from 'apis/app/window/windowManager'
import { app, IpcMainEvent, shell } from 'electron'
import { IIPCEvent } from 'root/src/universal/types/rpc'

import { SET_CURRENT_LANGUAGE } from '#/events/constants'
import { IRPCActionType, IWindowList } from '#/types/enum'
import { i18nManager } from '~/i18n'

export default [
  {
    action: IRPCActionType.GET_PLATFORM,
    handler: async (event: IIPCEvent) => {
      (event as IpcMainEvent).returnValue = process.platform
    }
  },
  {
    action: IRPCActionType.RELOAD_APP,
    handler: async () => {
      app.relaunch()
      app.exit(0)
    }
  },
  {
    action: IRPCActionType.OPEN_FILE,
    handler: async (_: IIPCEvent, args: [filePath: string]) => {
      shell.openPath(args[0])
    }
  },
  {
    action: IRPCActionType.OPEN_URL,
    handler: async (_: IIPCEvent, args: [url: string]) => {
      shell.openExternal(args[0])
    }
  },
  {
    action: IRPCActionType.GET_LANGUAGE_LIST,
    handler: async (event: IIPCEvent) => {
      (event as IpcMainEvent).returnValue = i18nManager.languageList
    }
  },
  {
    action: IRPCActionType.GET_CURRENT_LANGUAGE,
    handler: async (event: IIPCEvent) => {
      const { lang, locales } = i18nManager.getCurrentLocales()
      ;(event as IpcMainEvent).returnValue = [lang, locales]
    }
  },
  {
    action: IRPCActionType.SET_CURRENT_LANGUAGE,
    handler: async (_: IIPCEvent, args: [language: string]) => {
      i18nManager.setCurrentLanguage(args[0])
      const { lang, locales } = i18nManager.getCurrentLocales()
      picgo.i18n.setLanguage(lang)
      if (process.platform === 'darwin') {
        const trayWindow = windowManager.get(IWindowList.TRAY_WINDOW)
        trayWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales)
      }
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)
      settingWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales)
      if (windowManager.has(IWindowList.MINI_WINDOW)) {
        const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)
        miniWindow?.webContents.send(SET_CURRENT_LANGUAGE, lang, locales)
      }
    }
  }
]
