import { app, BrowserWindow } from 'electron'

import windowManager from 'apis/app/window/windowManager'

import {
  buildMainPageMenu,
  buildMiniPageMenu,
  buildPicBedListMenu,
  buildPluginPageMenu,
  buildSecondPicBedMenu
} from '~/events/remotes/menu'
import { openMiniWindow } from '~/utils/windowHelper'

import { IRPCActionType, IWindowList } from '#/types/enum'

export default [
  {
    action: IRPCActionType.HIDE_DOCK,
    handler: async (_: IIPCEvent, args: [value: boolean]) => {
      args[0] ? app.dock.hide() : app.dock.show()
    }
  },
  {
    action: IRPCActionType.OPEN_WINDOW,
    handler: async (_: IIPCEvent, args: [windowName: IWindowList]) => {
      const window = windowManager.get(args[0])
      if (window) {
        window.show()
      }
    }
  },
  {
    action: IRPCActionType.OPEN_MANUAL_WINDOW,
    handler: async () => {
      windowManager.get(IWindowList.MANUAL_WINDOW)!.show()
    }
  },
  {
    action: IRPCActionType.OPEN_MINI_WINDOW,
    handler: async () => {
      openMiniWindow()
    }
  },
  {
    action: IRPCActionType.CLOSE_WINDOW,
    handler: async () => {
      const window = BrowserWindow.getFocusedWindow()
      if (process.platform === 'linux') {
        window?.hide()
      } else {
        window?.close()
      }
    }
  },
  {
    action: IRPCActionType.MINIMIZE_WINDOW,
    handler: async () => {
      const window = BrowserWindow.getFocusedWindow()
      window?.minimize()
    }
  },
  {
    action: IRPCActionType.SHOW_MINI_PAGE_MENU,
    handler: async () => {
      const window = windowManager.get(IWindowList.MINI_WINDOW)!
      const menu = buildMiniPageMenu()
      menu.popup({
        window
      })
    }
  },
  {
    action: IRPCActionType.SHOW_MAIN_PAGE_MENU,
    handler: async () => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildMainPageMenu(window)
      menu.popup({
        window
      })
    }
  },
  {
    action: IRPCActionType.SHOW_UPLOAD_PAGE_MENU,
    handler: async () => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildPicBedListMenu()
      menu.popup({
        window
      })
    }
  },
  {
    action: IRPCActionType.SHOW_SECOND_UPLOADER_MENU,
    handler: async () => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildSecondPicBedMenu()
      menu.popup({
        window
      })
    }
  },
  {
    action: IRPCActionType.SHOW_PLUGIN_PAGE_MENU,
    handler: async (_: IIPCEvent, args: [plugin: IPicGoPlugin]) => {
      const window = windowManager.get(IWindowList.SETTING_WINDOW)!
      const menu = buildPluginPageMenu(args[0])
      menu.popup({
        window
      })
    }
  },
  {
    action: IRPCActionType.SET_MINI_WINDOW_POS,
    handler: async (_: IIPCEvent, args: [pos: IMiniWindowPos]) => {
      const window = BrowserWindow.getFocusedWindow()
      window?.setBounds(args[0])
    }
  },
  {
    action: IRPCActionType.MINI_WINDOW_ON_TOP,
    handler: async (_: IIPCEvent, args: [isOnTop: boolean]) => {
      const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
      miniWindow.setAlwaysOnTop(args[0])
    }
  },
  {
    action: IRPCActionType.MAIN_WINDOW_ON_TOP,
    handler: async () => {
      const mainWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
      const isAlwaysOnTop = mainWindow.isAlwaysOnTop()
      mainWindow.setAlwaysOnTop(!isAlwaysOnTop)
    }
  },
  {
    action: IRPCActionType.UPDATE_MINI_WINDOW_ICON,
    handler: async (_: IIPCEvent, args: [iconPath: string]) => {
      const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)!
      miniWindow.webContents.send('updateMiniIcon', args[0])
    }
  },
  {
    action: IRPCActionType.REFRESH_SETTING_WINDOW,
    handler: async () => {
      const settingWindow = windowManager.get(IWindowList.SETTING_WINDOW)!
      settingWindow.webContents.reloadIgnoringCache()
    }
  }
]
