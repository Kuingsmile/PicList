import { onBeforeMount, onBeforeUnmount, ref, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePicBed } from '@/composables/useGlobal'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import {
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_DONE,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_TOGGLE_PLUGIN,
} from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'

import { usePluginRegistry } from './usePluginRegistry'
export function usePlugins() {
  const { t } = useI18n()
  const { updatePicBeds } = usePicBed()
  const pluginList = ref<IPicGoPlugin[]>([])

  const config = ref<any[]>([])

  const currentType = ref<'plugin' | 'uploader' | 'transformer'>('plugin')

  const configName = ref('')

  const dialogVisible = ref(false)

  const pluginNameList = ref<string[]>([])

  const loading = ref(true)

  const needReload = ref(false)

  const experimentalBundledNpm = ref(false)
  const registry = usePluginRegistry({ pluginList, pluginNameList, loading, getPluginList })
  const { searchText, browsePlugins, queuePluginMetadata } = registry
  async function saveBundledNpmSetting(enabled: boolean) {
    experimentalBundledNpm.value = enabled
    await saveConfig(configPaths.settings.experimentalBundledNpm, enabled)
  }

  function hideLoadingHandler() {
    loading.value = false
  }

  function picgoHandlePluginDoneHandler(fullName: string) {
    pluginList.value.forEach(item => {
      if (item.fullName === fullName || item.name === fullName) {
        item.ing = false
      }
    })
    loading.value = false
  }

  function pluginListHandler(list: IPicGoPlugin[]) {
    pluginNameList.value = list.map(item => item.fullName)
    const installedPlugins = new Set(pluginNameList.value)
    if (searchText.value) {
      pluginList.value.forEach(item => {
        item.hasInstall = installedPlugins.has(item.fullName)
      })
    } else {
      pluginList.value = list
      loading.value = false
    }
    browsePlugins.value.forEach(item => {
      item.hasInstall = installedPlugins.has(item.fullName)
    })
    queuePluginMetadata(list)
  }

  function installPluginHandler({ success, body }: { success: boolean; body: string }) {
    loading.value = false
    pluginList.value.forEach(item => {
      if (item.fullName === body) {
        item.ing = false
        item.hasInstall = success
      }
    })
    // Update browse dialog if open
    browsePlugins.value.forEach(item => {
      if (item.fullName === body) {
        item.ing = false
        item.hasInstall = success
      }
    })
    if (success) {
      getPluginList()
      updatePicBeds()
    }
  }

  function updateSuccessHandler(plugin: string) {
    loading.value = false
    pluginList.value.forEach(item => {
      if (item.fullName === plugin) {
        item.ing = false
        item.hasInstall = true
      }
      updatePicBeds()
    })
    handleReload()
    getPluginList()
  }

  function uninstallSuccessHandler(plugin: string) {
    loading.value = false
    pluginList.value = pluginList.value.filter(item => {
      if (item.fullName === plugin) {
        // restore Uploader & Transformer after uninstalling
        if (item.config.transformer.name) {
          handleRestoreState('transformer', item.config.transformer.name)
        }
        if (item.config.uploader.name) {
          handleRestoreState('uploader', item.config.uploader.name)
        }
        updatePicBeds()
      }
      return item.fullName !== plugin
    })
    pluginNameList.value = pluginNameList.value.filter(item => item !== plugin)
  }

  function picgoConfigPluginHandler(
    _currentType: 'plugin' | 'transformer' | 'uploader',
    _configName: string,
    _config: any,
  ) {
    currentType.value = _currentType
    configName.value = _configName
    config.value = _config
    dialogVisible.value = true
  }

  function picgoHandlePluginIngHandler(fullName: string) {
    pluginList.value.forEach(item => {
      if (item.fullName === fullName || item.name === fullName) {
        item.ing = true
      }
    })
  }

  const picgoTogglePluginHandler = (fullName: string, enabled: boolean) => {
    const plugin = pluginList.value.find(item => item.fullName === fullName)
    if (plugin) {
      plugin.enabled = enabled
      updatePicBeds()
      needReload.value = true
    }
  }

  async function buildContextMenu(plugin: IPicGoPlugin) {
    window.electron.sendRPC(IRPCActionType.SHOW_PLUGIN_PAGE_MENU, getRawData(plugin))
  }

  function getPluginList() {
    window.electron.sendRPC(IRPCActionType.PLUGIN_GET_LIST)
  }

  function installPlugin(item: IPicGoPlugin) {
    if (!item.gui) {
      if (confirm(t('pages.plugin.notGuiImplement'))) {
        item.ing = true
        window.electron.sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
      }
    } else {
      item.ing = true
      window.electron.sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
    }
  }

  function reloadApp() {
    window.electron.sendRPC(IRPCActionType.RELOAD_APP)
  }

  async function handleReload() {
    if (
      !(await saveConfig({
        needReload: true,
      }))
    )
      return
    needReload.value = true
    if ('Notification' in window) {
      const successNotification = new Notification(t('pages.plugin.updateSuccess'), {
        body: t('pages.plugin.needRestart'),
      })
      successNotification.onclick = () => {
        reloadApp()
      }
    }
  }

  function cleanSearch() {
    searchText.value = ''
  }

  async function handleRestoreState(item: string, name: string) {
    if (item === 'uploader') {
      const current = await getConfig(configPaths.picBed.current)
      if (current === name) {
        if (
          !(await saveConfig({
            [configPaths.picBed.current]: 'smms',
            [configPaths.picBed.uploader]: 'smms',
          }))
        )
          return
      }
    }
    if (item === 'transformer') {
      const current = await getConfig(configPaths.picBed.transformer)
      if (current === name) {
        if (
          !(await saveConfig({
            [configPaths.picBed.transformer]: 'path',
          }))
        )
          return
      }
    }
  }

  function goAwesomeList() {
    window.electron.sendRPC(IRPCActionType.OPEN_URL, 'https://github.com/PicGo/Awesome-PicGo')
  }

  function handleImportLocalPlugin() {
    window.electron.sendRPC(IRPCActionType.PLUGIN_IMPORT_LOCAL)
    loading.value = true
  }

  function handleUpdateAllPlugin() {
    window.electron.sendRPC(IRPCActionType.PLUGIN_UPDATE_ALL, toRaw(pluginNameList.value))
  }
  onBeforeMount(async () => {
    window.electron.ipcRendererOn('hideLoading', hideLoadingHandler)
    window.electron.ipcRendererOn(PICGO_HANDLE_PLUGIN_DONE, picgoHandlePluginDoneHandler)
    window.electron.ipcRendererOn('pluginList', pluginListHandler)
    window.electron.ipcRendererOn('installPlugin', installPluginHandler)
    window.electron.ipcRendererOn('updateSuccess', updateSuccessHandler)
    window.electron.ipcRendererOn('uninstallSuccess', uninstallSuccessHandler)
    window.electron.ipcRendererOn(PICGO_CONFIG_PLUGIN, picgoConfigPluginHandler)
    window.electron.ipcRendererOn(PICGO_HANDLE_PLUGIN_ING, picgoHandlePluginIngHandler)
    window.electron.ipcRendererOn(PICGO_TOGGLE_PLUGIN, picgoTogglePluginHandler)
    getPluginList()
    needReload.value = (await getConfig<boolean>(configPaths.needReload)) || false
    experimentalBundledNpm.value = (await getConfig<boolean>(configPaths.settings.experimentalBundledNpm)) === true
  })
  onBeforeUnmount(() => {
    window.electron.ipcRendererRemoveAllListeners('pluginList')
    window.electron.ipcRendererRemoveAllListeners('installPlugin')
    window.electron.ipcRendererRemoveAllListeners('uninstallSuccess')
    window.electron.ipcRendererRemoveAllListeners('updateSuccess')
    window.electron.ipcRendererRemoveAllListeners('hideLoading')
    window.electron.ipcRendererRemoveAllListeners(PICGO_HANDLE_PLUGIN_DONE)
    window.electron.ipcRendererRemoveAllListeners(PICGO_CONFIG_PLUGIN)
    window.electron.ipcRendererRemoveAllListeners(PICGO_HANDLE_PLUGIN_ING)
    window.electron.ipcRendererRemoveAllListeners(PICGO_TOGGLE_PLUGIN)
  })
  return {
    ...registry,
    pluginList,
    config,
    currentType,
    configName,
    dialogVisible,
    loading,
    needReload,
    experimentalBundledNpm,
    saveBundledNpmSetting,
    buildContextMenu,
    getPluginList,
    installPlugin,
    reloadApp,
    cleanSearch,
    goAwesomeList,
    handleImportLocalPlugin,
    handleUpdateAllPlugin,
  }
}
