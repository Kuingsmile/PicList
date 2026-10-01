import bus from '@core/bus'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import shortKeyService from 'apis/app/shortKey/shortKeyService'
import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'
import windowManager from 'apis/app/window/windowManager'
import GuiApi from 'apis/gui'
import { dialog, globalShortcut, Notification } from 'electron'

import { TOGGLE_SHORTKEY_MODIFIED_MODE } from '#/constants/ipcChannels'
import { RpcError } from '#/rpc'
import { isUploadShortcutAction, type ShortcutConfig, shortcutSource, type ShortcutTarget } from '#/shortcuts'
import { IWindowList } from '~/constants'
import { t } from '~/i18n'
import { commitConfig } from '~/utils/commitConfig'
import { configPaths } from '~/utils/configPaths'
import { getUploaderConfigList } from '~/utils/handleUploaderConfig'
import { openMainWindow } from '~/utils/windowHelper'

import { ShortcutRegistry } from './shortcutRegistry'
import { resolveShortcutUploadTarget } from './uploadTarget'

class ShortKeyHandler {
  private initialization?: Promise<void>
  private readonly defaults = new Map<string, string>([['picgo:upload', 'CommandOrControl+Alt+P']])
  private readonly running = new Set<string>()
  private readonly uploaderPlugins = new Map<string, string>()
  private readonly registry = new ShortcutRegistry({
    platform: process.platform,
    adapter: globalShortcut,
    read: () => this.configs(),
    write: configs => commitConfig(picgo, { [configPaths.settings.shortKey._path]: configs }),
    available: (id, config) => this.available(id, config),
    execute: id => {
      void this.execute(id)
    },
  })

  constructor() {
    bus.on(TOGGLE_SHORTKEY_MODIFIED_MODE, flag => {
      this.registry.setPaused(flag === true)
      this.changed()
    })
  }

  private configs(): Record<string, ShortcutConfig> {
    return picgo.getConfig<IShortKeyConfigs>(configPaths.settings.shortKey._path) || {}
  }

  private pluginEnabled(name: string): boolean {
    return picgo.getConfig<Record<string, boolean>>('picgoPlugins')?.[name] !== false
  }

  init(): Promise<void> {
    this.initialization ??= this.initialize().catch(() => {
      logger.warn('Unable to initialize some shortcuts')
      this.notifyProblems()
    })
    return this.initialization
  }

  private async initialize() {
    const configs = this.configs()
    if (!configs['picgo:upload']) {
      commitConfig(picgo, {
        [configPaths.settings.shortKey._path]: {
          'picgo:upload': {
            enable: true,
            key: this.defaults.get('picgo:upload')!,
            name: 'upload',
            label: t('main.strings.quickUpload'),
          },
          ...configs,
        },
      })
    }
    this.registry.reconcile()
    for (const pluginName of picgo.pluginLoader.getFullList()) await this.loadPluginCommands(pluginName)
    this.refresh()
  }

  private available(id: string, config: ShortcutConfig): boolean {
    if (id === 'picgo:upload') return true
    if (id.startsWith('custom:')) {
      if (!isUploadShortcutAction(config.action)) return false
      try {
        resolveShortcutUploadTarget(config.action, this.getTargets())
        return true
      } catch {
        return false
      }
    }
    return this.defaults.has(id) && this.pluginEnabled(shortcutSource(id))
  }

  getTargets(): ShortcutTarget[] {
    return picgo.helper.uploader.getIdList().flatMap(picBed => {
      const plugin = this.uploaderPlugins.get(picBed)
      if (plugin && !this.pluginEnabled(plugin)) return []
      const picBedName = picgo.helper.uploader.get(picBed)?.name || picBed
      return getUploaderConfigList(picBed).configList.map(config => ({
        picBed,
        picBedName,
        configId: config._id,
        configName: config._configName,
      }))
    })
  }

  getList() {
    return this.registry.list().map(entry => ({ ...entry, defaultKey: this.defaults.get(entry.id) }))
  }

  refresh(notify = true) {
    this.registry.reconcile()
    this.changed()
    if (notify) this.notifyProblems()
    return this.getList()
  }

  private changed() {
    windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send('shortcutsChanged')
  }

  private notifyProblems() {
    const count = this.getList().filter(item => item.enable && !['active', 'paused'].includes(item.status)).length
    if (!count || !Notification.isSupported()) return
    const notification = new Notification({
      title: t('main.strings.operationFailed'),
      body: t('main.strings.shortcutProblems', { count }),
    })
    notification.on('click', () => openMainWindow())
    notification.show()
  }

  private find(item: ShortcutConfig, from: string) {
    const id = `${from}:${item.name}`
    const config = this.configs()[id]
    if (!config) throw new RpcError('NOT_FOUND')
    return { id, config }
  }

  bindOrUnbindShortKey(item: ShortcutConfig, from: string): true {
    const { id, config } = this.find(item, from)
    if (item.enable && !config.key) throw new RpcError('SHORTCUT_INVALID')
    this.registry.save(id, { ...config, enable: item.enable })
    this.changed()
    return true
  }

  updateShortKey(item: ShortcutConfig, oldKey: string, from: string): true {
    const { id, config } = this.find(item, from)
    if (config.key !== oldKey) throw new RpcError('CONFLICT')
    this.registry.save(id, { ...config, key: item.key })
    this.changed()
    return true
  }

  saveCustom(config: ShortcutConfig): true {
    if (!isUploadShortcutAction(config.action)) throw new RpcError('INVALID_REQUEST')
    if (config.enable) resolveShortcutUploadTarget(config.action, this.getTargets())
    const { type, picBed, configId } = config.action
    this.registry.save(`custom:${config.name}`, {
      name: config.name,
      label: config.label.trim(),
      key: config.key,
      enable: config.enable,
      action: { type, picBed, configId },
    })
    this.changed()
    return true
  }

  deleteCustom(id: string): true {
    if (!id.startsWith('custom:') || !this.configs()[id]) throw new RpcError('NOT_FOUND')
    this.registry.remove([id])
    this.changed()
    return true
  }

  private async execute(id: string) {
    if (this.running.has(id)) return
    this.running.add(id)
    try {
      const config = this.configs()[id]
      if (!config?.enable || !this.available(id, config)) throw new RpcError('SHORTCUT_UNAVAILABLE')
      if (id === 'picgo:upload') await uploadClipboardFiles()
      else if (id.startsWith('custom:')) {
        const action = this.configs()[id]?.action
        if (!isUploadShortcutAction(action)) throw new RpcError('SHORTCUT_TARGET_MISSING')
        const options = resolveShortcutUploadTarget(action, this.getTargets())
        if (action.type === 'uploadClipboard') await uploadClipboardFiles(options)
        else {
          const window = windowManager.getAvailableWindow()
          const dialogOptions = { properties: ['openFile', 'multiSelections'] as ('openFile' | 'multiSelections')[] }
          const result = window
            ? await dialog.showOpenDialog(window, dialogOptions)
            : await dialog.showOpenDialog(dialogOptions)
          if (!result.canceled && result.filePaths.length) {
            if (!this.configs()[id]?.enable) return
            const currentOptions = resolveShortcutUploadTarget(action, this.getTargets())
            await uploadChoosedFiles(
              window?.webContents,
              result.filePaths.map(path => ({ path })),
              currentOptions,
            )
          }
        }
      } else {
        await shortKeyService.getShortKeyHandler(id)?.(picgo, GuiApi.getInstance())
      }
    } catch {
      logger.warn('Shortcut action could not be completed')
      if (Notification.isSupported())
        new Notification({
          title: t('main.strings.operationFailed'),
          body: t('main.strings.shortcutActionFailed'),
        }).show()
    } finally {
      this.running.delete(id)
    }
  }

  private async loadPluginCommands(pluginName: string) {
    for (const id of this.defaults.keys()) {
      if (shortcutSource(id) === pluginName) {
        this.defaults.delete(id)
        shortKeyService.unregisterCommand(id)
      }
    }
    try {
      const plugin = await picgo.pluginLoader.getPlugin(pluginName)
      if (typeof plugin?.uploader === 'string') this.uploaderPlugins.set(plugin.uploader, pluginName)
      if (!plugin?.commands) return
      if (typeof plugin.commands !== 'function') throw new Error('Invalid plugin commands')
      const commands: unknown = await plugin.commands(picgo)
      if (!Array.isArray(commands)) throw new Error('Invalid plugin commands')
      const configs = { ...this.configs() }
      let updated = false
      for (const cmd of commands) {
        if (!cmd || typeof cmd.name !== 'string' || !cmd.name.trim() || typeof cmd.handle !== 'function') {
          logger.warn('Skipping an invalid plugin shortcut definition')
          continue
        }
        const id = `${pluginName}:${cmd.name}`
        if (this.defaults.has(id)) continue
        this.defaults.set(id, typeof cmd.key === 'string' ? cmd.key : '')
        shortKeyService.registerCommand(id, cmd.handle)
        if (!configs[id]) {
          configs[id] = {
            enable: !!cmd.key,
            name: cmd.name,
            label: typeof cmd.label === 'string' ? cmd.label : cmd.name,
            key: typeof cmd.key === 'string' ? cmd.key : '',
          }
          updated = true
        }
      }
      if (updated) commitConfig(picgo, { [configPaths.settings.shortKey._path]: configs })
    } catch {
      logger.warn('Unable to load plugin shortcut definitions')
    }
  }

  async registerPluginShortKey(pluginName: string) {
    await this.init()
    await this.loadPluginCommands(pluginName)
    this.refresh()
  }

  unregisterPluginShortKey(pluginName: string) {
    const ids = Object.keys(this.configs()).filter(id => shortcutSource(id) === pluginName)
    this.registry.remove(ids)
    for (const id of ids) {
      shortKeyService.unregisterCommand(id)
      this.defaults.delete(id)
    }
    this.refresh()
  }
}

export default new ShortKeyHandler()
