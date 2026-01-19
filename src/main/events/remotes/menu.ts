import picgo from '@core/picgo'
import { uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import GuiApi from 'apis/gui'
import { app, BrowserWindow, dialog, Menu, MenuItem, MenuItemConstructorOptions, shell } from 'electron'
import { PicGo as PicGoCore } from 'piclist'
import pkg from 'root/package.json'

import {
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_DONE,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_TOGGLE_PLUGIN,
  SHOW_FIRST_TIME_GUIDE,
  SHOW_MAIN_PAGE_QRCODE,
} from '~/events/constant'
import { handlePluginUninstall, handlePluginUpdate } from '~/events/rpc/routes/plugin/utils'
import { T as $t } from '~/i18n'
import clipboardPoll from '~/utils/clipboardPoll'
import { setTrayToolTip } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { IWindowList } from '~/utils/enum'
import getPicBeds from '~/utils/getPicBeds'
import { changeCurrentUploader, changeSecondUploader } from '~/utils/handleUploaderConfig'
import { openMainWindow } from '~/utils/windowHelper'

interface GuiMenuItem {
  label: string
  handle: (arg0: PicGoCore, arg1: GuiApi) => Promise<void>
}

const buildMiniPageMenu = () => {
  const isListeningClipboard = picgo.getConfig<boolean>(configPaths.settings.isListeningClipboard) || false
  const ClipboardWatcher = clipboardPoll
  const submenu = buildPicBedListMenu()
  const template: (MenuItemConstructorOptions | MenuItem)[] = [
    {
      label: $t('OPEN_MAIN_WINDOW'),
      click: openMainWindow,
    },
    {
      label: $t('CHOOSE_DEFAULT_PICBED'),
      type: 'submenu',
      submenu,
    },
    {
      label: $t('UPLOAD_BY_CLIPBOARD'),
      click() {
        uploadClipboardFiles()
      },
    },
    {
      label: $t('HIDE_MINI_WINDOW'),
      click() {
        const miniWindow = windowManager.get(IWindowList.MINI_WINDOW)
        console.log('hide mini window', miniWindow)
        miniWindow?.close()
        console.log('mini window closed')
      },
    },
    {
      label: $t('START_WATCH_CLIPBOARD'),
      click() {
        picgo.saveConfig({ [configPaths.settings.isListeningClipboard]: true })
        ClipboardWatcher.startListening()
        ClipboardWatcher.on('change', () => {
          picgo.log.info('clipboard changed')
          uploadClipboardFiles()
        })
        buildMiniPageMenu()
      },
      visible: !isListeningClipboard,
    },
    {
      label: $t('STOP_WATCH_CLIPBOARD'),
      click() {
        picgo.saveConfig({ [configPaths.settings.isListeningClipboard]: false })
        ClipboardWatcher.stopListening()
        ClipboardWatcher.removeAllListeners()
        buildMiniPageMenu()
      },
      visible: isListeningClipboard,
    },
    {
      label: $t('RELOAD_APP'),
      click() {
        app.relaunch()
        app.exit(0)
      },
    },
    {
      role: 'quit',
      label: $t('QUIT'),
    },
  ]
  return Menu.buildFromTemplate(template)
}

const buildMainPageMenu = (win: BrowserWindow | undefined) => {
  const template = [
    {
      label: $t('ABOUT'),
      click() {
        dialog.showMessageBox({
          type: 'info',
          title: 'PicList',
          message: 'PicList',
          detail: `Version: ${pkg.version}\nAuthor: Kuingsmile\nGithub: https://github.com/Kuingsmile/PicList`,
        })
      },
    },
    {
      label: $t('SHOW_PICBED_QRCODE'),
      click() {
        win?.webContents?.send(SHOW_MAIN_PAGE_QRCODE)
      },
    },
    {
      label: $t('SHOW_FIRST_TIME_GUIDE'),
      click() {
        win?.webContents?.send(SHOW_FIRST_TIME_GUIDE)
      },
    },
    {
      label: $t('OPEN_TOOLBOX'),
      click() {
        windowManager.create(IWindowList.TOOLBOX_WINDOW)
      },
    },
    {
      label: $t('SHOW_DEVTOOLS'),
      click() {
        win?.webContents?.openDevTools({ mode: 'detach' })
      },
    },
    {
      label: $t('FEEDBACK'),
      click() {
        const url = 'https://github.com/Kuingsmile/PicList/issues'
        shell.openExternal(url)
      },
    },
  ] as (MenuItemConstructorOptions | MenuItem)[]
  return Menu.buildFromTemplate(template)
}

const buildSecondPicBedMenu = () => {
  const picBeds = getPicBeds().picBeds
  const allConfig = picgo.getConfig<any>() || {}
  const secondUploader = allConfig.picBed?.secondUploader
  const defaultSecondUploaderConfig = allConfig.picBed?.secondUploaderConfig as IUploaderConfig | undefined
  const defaultSecondUploaderId = defaultSecondUploaderConfig?._id || ''
  const defaultSecondUploaderName = defaultSecondUploaderConfig?._configName || 'Default'
  const currentPicBedName = picBeds.find(item => item.type === secondUploader)?.name
  const picBedConfigList = allConfig.uploader
  const currentPicBedMenuItem = [
    {
      label: `${$t('CURRENT_SECOND_PICBED')} - ${currentPicBedName || 'None'} - ${defaultSecondUploaderName}`,
      enabled: false,
    },
    {
      type: 'separator',
    },
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
          ? configList.map((config: any) => {
              return {
                label: config._configName || 'Default',
                // if only one config, use checkbox, or radio will checked as default
                // see: https://github.com/electron/electron/issues/21292
                type: 'checkbox',
                checked: config._id === defaultSecondUploaderId && item.type === secondUploader,
                click() {
                  changeSecondUploader(item.type, config)
                },
              }
            })
          : undefined,
        click: !hasSubmenu
          ? function () {
              const current = picgo.getConfig(`picBed.${item.type}`)
              if (current) {
                changeSecondUploader(item.type, current)
              }
            }
          : undefined,
      }
    })
  // @ts-expect-error submenu type
  submenu = currentPicBedMenuItem.concat(submenu)
  // @ts-expect-error submenu type
  return Menu.buildFromTemplate(submenu)
}

const buildPicBedListMenu = () => {
  const picBeds = getPicBeds().picBeds
  const allConfig = picgo.getConfig<any>() || {}
  const currentPicBed = allConfig.picBed?.uploader
  const currentPicBedName = picBeds.find(item => item.type === currentPicBed)?.name
  const picBedConfigList = allConfig.uploader
  const currentPicBedMenuItem = [
    {
      label: `${$t('CURRENT_PICBED')} - ${currentPicBedName}`,
      enabled: false,
    },
    {
      type: 'separator',
    },
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
          ? configList.map((config: any) => {
              return {
                label: config._configName || 'Default',
                // if only one config, use checkbox, or radio will checked as default
                // see: https://github.com/electron/electron/issues/21292
                type: 'checkbox',
                checked: config._id === defaultId && item.type === currentPicBed,
                click() {
                  changeCurrentUploader(item.type, config, config._id)
                  windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send('syncPicBed')
                  setTrayToolTip(`${item.type} ${config._configName || 'Default'}`)
                },
              }
            })
          : undefined,
        click: !hasSubmenu
          ? function () {
              picgo.saveConfig({
                [configPaths.picBed.current]: item.type,
                [configPaths.picBed.uploader]: item.type,
              })
              windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send('syncPicBed')
              setTrayToolTip(item.type)
            }
          : undefined,
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
        [configPaths.picBed.uploader]: 'smms',
      })
    }
  }
  if (item === 'transformer') {
    const current = picgo.getConfig(configPaths.picBed.transformer)
    if (current === name) {
      picgo.saveConfig({
        [configPaths.picBed.transformer]: 'path',
      })
    }
  }
}

const buildPluginPageMenu = (plugin: IPicGoPlugin) => {
  const menu = [
    {
      label: $t('ENABLE_PLUGIN'),
      enabled: !plugin.enabled,
      click() {
        picgo.saveConfig({
          [`picgoPlugins.${plugin.fullName}`]: true,
        })
        windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, true)
      },
    },
    {
      label: $t('DISABLE_PLUGIN'),
      enabled: plugin.enabled,
      click() {
        picgo.saveConfig({
          [`picgoPlugins.${plugin.fullName}`]: false,
        })
        const window = windowManager.get(IWindowList.SETTING_WINDOW)
        window?.webContents?.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
        window?.webContents?.send(PICGO_TOGGLE_PLUGIN, plugin.fullName, false)
        window?.webContents?.send(PICGO_HANDLE_PLUGIN_DONE, plugin.fullName)
        if (plugin.config.transformer.name) {
          handleRestoreState('transformer', plugin.config.transformer.name)
        }
        if (plugin.config.uploader.name) {
          handleRestoreState('uploader', plugin.config.uploader.name)
        }
      },
    },
    {
      label: $t('UNINSTALL_PLUGIN'),
      click() {
        const window = windowManager.get(IWindowList.SETTING_WINDOW)
        window?.webContents?.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
        handlePluginUninstall(plugin.fullName)
      },
    },
    {
      label: $t('UPDATE_PLUGIN'),
      click() {
        const window = windowManager.get(IWindowList.SETTING_WINDOW)
        window?.webContents?.send(PICGO_HANDLE_PLUGIN_ING, plugin.fullName)
        handlePluginUpdate(plugin.fullName)
      },
    },
  ] as (MenuItemConstructorOptions | MenuItem)[]
  for (const i in plugin.config) {
    if (plugin.config[i].config.length > 0) {
      const obj = {
        label: $t('CONFIG_THING', {
          c: `${i} - ${plugin.config[i].fullName || plugin.config[i].name}`,
        }),
        click() {
          const window = windowManager.get(IWindowList.SETTING_WINDOW)
          const currentType = i
          const configName = plugin.config[i].fullName || plugin.config[i].name
          const config = plugin.config[i].config
          window?.webContents?.send(PICGO_CONFIG_PLUGIN, currentType, configName, config)
        },
      }
      menu.push(obj)
    }
  }

  // handle transformer
  if (plugin.config.transformer.name) {
    const currentTransformer = picgo.getConfig<string>(configPaths.picBed.transformer) || 'path'
    const pluginTransformer = plugin.config.transformer.name
    const obj = {
      label: `${currentTransformer === pluginTransformer ? $t('DISABLE') : $t('ENABLE')}transformer - ${plugin.config.transformer.name}`,
      click() {
        const transformer = plugin.config.transformer.name
        const currentTransformer = picgo.getConfig<string>(configPaths.picBed.transformer) || 'path'
        if (currentTransformer === transformer) {
          picgo.saveConfig({
            [configPaths.picBed.transformer]: 'path',
          })
        } else {
          picgo.saveConfig({
            [configPaths.picBed.transformer]: transformer,
          })
        }
      },
    }
    menu.push(obj)
  }

  // plugin custom menus
  if (plugin.guiMenu) {
    menu.push({
      type: 'separator',
    })
    for (const i of plugin.guiMenu) {
      menu.push({
        label: i.label,
        async click() {
          const picgPlugin = await picgo.pluginLoader.getPlugin(plugin.fullName)
          if (picgPlugin?.guiMenu?.(picgo)?.length) {
            const menu: GuiMenuItem[] = picgPlugin.guiMenu(picgo)
            menu.forEach(item => {
              if (item.label === i.label) {
                item.handle(picgo, GuiApi.getInstance())
              }
            })
          }
        },
      })
    }
  }

  return Menu.buildFromTemplate(menu)
}

export { buildMainPageMenu, buildMiniPageMenu, buildPicBedListMenu, buildPluginPageMenu, buildSecondPicBedMenu }
