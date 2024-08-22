import { app, dialog, BrowserWindow, Menu, shell, MenuItemConstructorOptions, MenuItem } from 'electron'
import { PicGo as PicGoCore } from 'piclist'

import db from '@core/datastore'
import picgo from '@core/picgo'

import { uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import GuiApi from 'apis/gui'

import { handlePluginUninstall, handlePluginUpdate } from '~/events/rpc/routes/plugin/utils'
import { T } from '~/i18n'
import clipboardPoll from '~/utils/clipboardPoll'
import { setTrayToolTip } from '~/utils/common'
import getPicBeds from '~/utils/getPicBeds'
import { changeCurrentUploader, changeSecondUploader } from '~/utils/handleUploaderConfig'

import {
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_DONE,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_TOGGLE_PLUGIN,
  SHOW_MAIN_PAGE_QRCODE
} from '#/events/constants'
import { IWindowList } from '#/types/enum'
import { configPaths } from '#/utils/configPaths'

import pkg from 'root/package.json'
import { openMainWindow } from '~/utils/windowHelper'

interface GuiMenuItem {
  label: string
  handle: (arg0: PicGoCore, arg1: GuiApi) => Promise<void>
}

const buildMiniPageMenu = () => {
  const isListeningClipboard = db.get(configPaths.settings.isListeningClipboard) || false
  const ClipboardWatcher = clipboardPoll
  const submenu = buildPicBedListMenu()
  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    {
      label: T('OPEN_MAIN_WINDOW'),
      click: openMainWindow
    },
    {
      label: T('CHOOSE_DEFAULT_PICBED'),
      type: 'submenu',
      submenu
    },
    {
      label: T('UPLOAD_BY_CLIPBOARD'),
      click() {
        uploadClipboardFiles()
      }
    },
    {
      label: T('HIDE_MINI_WINDOW'),
      click() {
        BrowserWindow.getFocusedWindow()!.hide()
      }
    },
    {
      label: T('START_WATCH_CLIPBOARD'),
      click() {
        db.set(configPaths.settings.isListeningClipboard, true)
        ClipboardWatcher.startListening()
        ClipboardWatcher.on('change', () => {
          picgo.log.info('clipboard changed')
          uploadClipboardFiles()
        })
        buildMiniPageMenu()
      },
      visible: !isListeningClipboard
    },
    {
      label: T('STOP_WATCH_CLIPBOARD'),
      click() {
        db.set(configPaths.settings.isListeningClipboard, false)
        ClipboardWatcher.stopListening()
        ClipboardWatcher.removeAllListeners()
        buildMiniPageMenu()
      },
      visible: isListeningClipboard
    },
    {
      label: T('RELOAD_APP'),
      click() {
        app.relaunch()
        app.exit(0)
      }
    },
    {
      role: 'quit',
      label: T('QUIT')
    }
  ]
  return Menu.buildFromTemplate(template)
}

const buildMainPageMenu = (win: BrowserWindow) => {
  const template = [
    {
      label: T('ABOUT'),
      click() {
        dialog.showMessageBox({
          title: 'PicList',
          message: 'PicList',
          detail: `Version: ${pkg.version}\nAuthor: Kuingsmile\nGithub: https://github.com/Kuingsmile/PicList`
        })
      }
    },
    {
      label: T('SHOW_PICBED_QRCODE'),
      click() {
        win?.webContents?.send(SHOW_MAIN_PAGE_QRCODE)
      }
    },
    {
      label: T('OPEN_TOOLBOX'),
      click() {
        const window = windowManager.create(IWindowList.TOOLBOX_WINDOW)
        window?.show()
      }
    },
    {
      label: T('SHOW_DEVTOOLS'),
      click() {
        win?.webContents?.openDevTools({ mode: 'detach' })
      }
    },
    {
      label: T('FEEDBACK'),
      click() {
        const url = 'https://github.com/Kuingsmile/PicList/issues'
        shell.openExternal(url)
      }
    }
  ] as Array<MenuItemConstructorOptions | MenuItem>
  return Menu.buildFromTemplate(template)
}

const buildSecondPicBedMenu = () => {
  const picBeds = getPicBeds()
  const secondUploader = picgo.getConfig(configPaths.picBed.secondUploader)
  const defaultSecondUploaderId = picgo.getConfig(configPaths.picBed.secondUploaderId)
  const currentPicBedName = picBeds.find(item => item.type === secondUploader)?.name
  const picBedConfigList = picgo.getConfig<IUploaderConfig>('uploader')
  const currentPicBedMenuItem = [
    {
      label: `${T('CURRENT_SECOND_PICBED')} - ${currentPicBedName || 'None'}`,
      enabled: false
    },
    {
      type: 'separator'
    }
  ]
  let submenu = picBeds
    .filter(item => item.visible)
    .map(item => {
      const configList = picBedConfigList?.[item.type]?.configList
      const hasSubmenu = !!configList
      return {
        label: item.name,
        type: !hasSubmenu ? 'checkbox' : undefined,
        checked: !hasSubmenu ? secondUploader === item.type : undefined,
        submenu: hasSubmenu
          ? configList.map(config => {
              return {
                label: config._configName || 'Default',
                // if only one config, use checkbox, or radio will checked as default
                // see: https://github.com/electron/electron/issues/21292
                type: 'checkbox',
                checked: config._id === defaultSecondUploaderId && item.type === secondUploader,
                click: function () {
                  changeSecondUploader(item.type, config, config._id)
                }
              }
            })
          : undefined,
        click: !hasSubmenu
          ? function () {
              picgo.saveConfig({
                [configPaths.picBed.secondUploader]: item.type
              })
            }
          : undefined
      }
    })
  // @ts-expect-error submenu type
  submenu = currentPicBedMenuItem.concat(submenu)
  // @ts-expect-error submenu type
  return Menu.buildFromTemplate(submenu)
}

const buildPicBedListMenu = () => {
  const picBeds = getPicBeds()
  const currentPicBed = picgo.getConfig(configPaths.picBed.uploader)
  const currentPicBedName = picBeds.find(item => item.type === currentPicBed)?.name
  const picBedConfigList = picgo.getConfig<IUploaderConfig>('uploader')
  const currentPicBedMenuItem = [
    {
      label: `${T('CURRENT_PICBED')} - ${currentPicBedName}`,
      enabled: false
    },
    {
      type: 'separator'
    }
  ]
  let submenu = picBeds
    .filter(item => item.visible)
    .map(item => {
      const configList = picBedConfigList?.[item.type]?.configList
      const defaultId = picBedConfigList?.[item.type]?.defaultId
      const hasSubmenu = !!configList
      return {
        label: item.name,
        type: !hasSubmenu ? 'checkbox' : undefined,
        checked: !hasSubmenu ? currentPicBed === item.type : undefined,
        submenu: hasSubmenu
          ? configList.map(config => {
              return {
                label: config._configName || 'Default',
                // if only one config, use checkbox, or radio will checked as default
                // see: https://github.com/electron/electron/issues/21292
                type: 'checkbox',
                checked: config._id === defaultId && item.type === currentPicBed,
                click: function () {
                  changeCurrentUploader(item.type, config, config._id)
                  if (windowManager.has(IWindowList.SETTING_WINDOW)) {
                    windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
                  }
                  setTrayToolTip(`${item.type} ${config._configName || 'Default'}`)
                }
              }
            })
          : undefined,
        click: !hasSubmenu
          ? function () {
              picgo.saveConfig({
                [configPaths.picBed.current]: item.type,
                [configPaths.picBed.uploader]: item.type
              })
              if (windowManager.has(IWindowList.SETTING_WINDOW)) {
                windowManager.get(IWindowList.SETTING_WINDOW)!.webContents.send('syncPicBed')
              }
              setTrayToolTip(item.type)
            }
          : undefined
      }
    })
  // @ts-expect-error submenu type
  submenu = currentPicBedMenuItem.concat(submenu)
  // @ts-expect-error submenu type
  return Menu.buildFromTemplate(submenu)
}

// TODO: separate to single file

const handleRestoreState = (item: string, name: string): void => {
  if (item === 'uploader') {
    const current = picgo.getConfig(configPaths.picBed.current)
    if (current === name) {
      picgo.saveConfig({
        [configPaths.picBed.current]: 'smms',
        [configPaths.picBed.uploader]: 'smms'
      })
    }
  }
  if (item === 'transformer') {
    const current = picgo.getConfig(configPaths.picBed.transformer)
    if (current === name) {
      picgo.saveConfig({
        [configPaths.picBed.transformer]: 'path'
      })
    }
  }
}

const buildPluginPageMenu = (plugin: IPicGoPlugin) => {
  const menu = [
    {
      label: T('ENABLE_PLUGIN'),
      enabled: !plugin.enabled,
      click() {
        picgo.saveConfig({
          [`picgoPlugins.${plugin.fullName}`]: true
        })
        const window = windowManager.get(IWindowList.SETTING_WINDOW)!
        window.webContents.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, true)
      }
    },
    {
      label: T('DISABLE_PLUGIN'),
      enabled: plugin.enabled,
      click() {
        picgo.saveConfig({
          [`picgoPlugins.${plugin.fullName}`]: false
        })
        const window = windowManager.get(IWindowList.SETTING_WINDOW)!
        window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
        window.webContents.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, false)
        window.webContents.send(PICGO_HANDLE_PLUGIN_DONE, plugin.fullName)
        if (plugin.config.transformer.name) {
          handleRestoreState('transformer', plugin.config.transformer.name)
        }
        if (plugin.config.uploader.name) {
          handleRestoreState('uploader', plugin.config.uploader.name)
        }
      }
    },
    {
      label: T('UNINSTALL_PLUGIN'),
      click() {
        const window = windowManager.get(IWindowList.SETTING_WINDOW)!
        window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
        handlePluginUninstall(plugin.fullName)
      }
    },
    {
      label: T('UPDATE_PLUGIN'),
      click() {
        const window = windowManager.get(IWindowList.SETTING_WINDOW)!
        window.webContents.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
        handlePluginUpdate(plugin.fullName)
      }
    }
  ] as Array<MenuItemConstructorOptions | MenuItem>
  for (const i in plugin.config) {
    if (plugin.config[i].config.length > 0) {
      const obj = {
        label: T('CONFIG_THING', {
          c: `${i} - ${plugin.config[i].fullName || plugin.config[i].name}`
        }),
        click() {
          const window = windowManager.get(IWindowList.SETTING_WINDOW)!
          const currentType = i
          const configName = plugin.config[i].fullName || plugin.config[i].name
          const config = plugin.config[i].config
          window.webContents.send(PICGO_CONFIG_PLUGIN, currentType, configName, config)
        }
      }
      menu.push(obj)
    }
  }

  // handle transformer
  if (plugin.config.transformer.name) {
    const currentTransformer = picgo.getConfig<string>(configPaths.picBed.transformer) || 'path'
    const pluginTransformer = plugin.config.transformer.name
    const obj = {
      label: `${currentTransformer === pluginTransformer ? T('DISABLE') : T('ENABLE')}transformer - ${plugin.config.transformer.name}`,
      click() {
        const transformer = plugin.config.transformer.name
        const currentTransformer = picgo.getConfig<string>(configPaths.picBed.transformer) || 'path'
        if (currentTransformer === transformer) {
          picgo.saveConfig({
            [configPaths.picBed.transformer]: 'path'
          })
        } else {
          picgo.saveConfig({
            [configPaths.picBed.transformer]: transformer
          })
        }
      }
    }
    menu.push(obj)
  }

  // plugin custom menus
  if (plugin.guiMenu) {
    menu.push({
      type: 'separator'
    })
    for (const i of plugin.guiMenu) {
      menu.push({
        label: i.label,
        click() {
          const picgPlugin = picgo.pluginLoader.getPlugin(plugin.fullName)
          if (picgPlugin?.guiMenu?.(picgo)?.length) {
            const menu: GuiMenuItem[] = picgPlugin.guiMenu(picgo)
            menu.forEach(item => {
              if (item.label === i.label) {
                item.handle(picgo, GuiApi.getInstance())
              }
            })
          }
        }
      })
    }
  }

  return Menu.buildFromTemplate(menu)
}

export { buildMiniPageMenu, buildMainPageMenu, buildPicBedListMenu, buildPluginPageMenu, buildSecondPicBedMenu }
