import type { IConfig } from 'piclist'
import { effectScope, onBeforeMount, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import { osGlobal } from '@/composables/useGlobal'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { ISartMode } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'
import { enforceNumber } from '#/utils/values'

import { createSettingsState } from './settingsState'
import { useSettingsPersistence } from './useSettingsPersistence'
export function useSettingsState() {
  const state = createSettingsState()
  const {
    showPicBedList,
    galleryPicBedFilterList,
    currentTheme,
    proxy,
    isDisableGPU,
    isPortable,
    currentLanguage,
    currentSecondMode,
    currentStartMode,
    currentShortUrlServer,
    customLink,
    server,
    advancedRename,
    sync,
    formOfSetting,
    picBedG,
    ready,
  } = state
  const { locale } = useI18n()
  const { addWatch, ...handlers } = useSettingsPersistence(state)
  // Async hydration must finish before autosave watchers are registered.
  const settingsWatchScope = effectScope()
  const defaultStartMode = {
    darwin: ISartMode.QUIET,
    win32: ISartMode.MAIN,
    linux: ISartMode.MINI,
  }

  const formKeys = Object.keys(formOfSetting.value) as (keyof ISettingForm)[]
  async function initData() {
    const config = (await getConfig<IConfig>()) || ({} as IConfig)
    if (!settingsWatchScope.active) return
    const settings = config.settings || {}
    const picBed = config.picBed
    isDisableGPU.value = settings.isDisableGPU || false
    const portable = await window.electron.triggerRPC<boolean>(IRPCActionType.GET_IS_PORTABLE)
    if (!settingsWatchScope.active) return
    isPortable.value = portable || false
    showPicBedList.value = picBedG.value.filter(item => item.visible).map(item => item.type)
    galleryPicBedFilterList.value = settings.galleryPicBedFilter || []
    currentTheme.value = settings.theme || 'default.css'
    formKeys.forEach(key => {
      ;(formOfSetting.value as any)[key] = settings[key] ?? formOfSetting.value[key]
    })
    try {
      const actualAutoStartStatus = await window.electron.triggerRPC<boolean>(IRPCActionType.PICLIST_AUTO_START_STATUS)
      if (!settingsWatchScope.active) return
      if (typeof actualAutoStartStatus === 'boolean') {
        formOfSetting.value.autoStart = actualAutoStartStatus
        if (actualAutoStartStatus !== settings.autoStart) {
          await saveConfig({ [configPaths.settings.autoStart]: actualAutoStartStatus })
        }
      }
    } catch {
      if (!settingsWatchScope.active) return
      formOfSetting.value.autoStart = settings.autoStart ?? false
    }
    if (!settingsWatchScope.active) return
    formOfSetting.value.logLevel = initArray(settings.logLevel || [], ['all'])
    formOfSetting.value.autoImportPicBed = initArray(settings.autoImportPicBed || [], [])
    currentLanguage.value = settings.language || locale.value
    currentStartMode.value =
      settings.startMode !== undefined
        ? settings.startMode
        : defaultStartMode[osGlobal.value as keyof typeof defaultStartMode] || ISartMode.MAIN
    currentSecondMode.value = settings.secondPicBedMode || 'backup'
    if (osGlobal.value === 'darwin' && currentStartMode.value === ISartMode.MINI) {
      currentStartMode.value = ISartMode.QUIET
      await saveConfig(configPaths.settings.startMode, ISartMode.QUIET)
      if (!settingsWatchScope.active) return
    }
    currentShortUrlServer.value = settings.shortUrlServer || 'c1n'
    customLink.value = settings.customLink || '![$fileName]($url)'
    proxy.value = picBed.proxy || ''
    server.value = settings.server || { port: 36677, host: '0.0.0.0', enable: true }
    advancedRename.value = config.buildIn?.rename || { enable: false, format: '{filename}' }
    if (advancedRename.value.enable) {
      formOfSetting.value.autoRename = false
      await saveConfig({ [configPaths.settings.autoRename]: false })
      if (!settingsWatchScope.active) return
    }
    sync.value = settings.sync || {
      type: 'github',
      username: '',
      repo: '',
      branch: '',
      token: '',
      endpoint: '',
      proxy: '',
      interval: 60,
      // WebDAV-specific fields
      webdavEndpoint: '',
      webdavUsername: '',
      webdavPassword: '',
      webdavAuthType: 'basic',
      webdavSslEnabled: true,
      webdavSavePath: '',
    }
    formOfSetting.value.logFileSizeLimit = enforceNumber(settings.logFileSizeLimit) || 10
    settingsWatchScope.run(addWatch)
    ready.value = true
  }

  function initArray(arrayT: string | string[], defaultValue: string[]) {
    if (!Array.isArray(arrayT)) {
      if (arrayT && arrayT.length > 0) {
        arrayT = [arrayT]
      } else {
        arrayT = defaultValue
      }
    }
    return arrayT
  }
  onBeforeMount(initData)
  onBeforeUnmount(() => settingsWatchScope.stop())
  return { ...state, ...handlers }
}
