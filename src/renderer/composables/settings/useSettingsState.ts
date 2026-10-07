import type { IConfig } from 'piclist'
import { effectScope, onBeforeMount, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import { osGlobal } from '@/composables/useGlobal'
import { getConfig, saveConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { ISartMode } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'
import { enforceBoolean, enforceNumber } from '#/utils/values'

import { createServerDraft, createSettingsState, createSyncDraft } from './settingsState'
import { useSettingsPersistence } from './useSettingsPersistence'

export function useSettingsState() {
  const state = createSettingsState()
  const { settings, visiblePicBeds, uploadProxy, isPortable, serverDraft, advancedRename, syncDraft, picBedG, ready } =
    state
  const { locale } = useI18n()
  const { startPersistence, ...actions } = useSettingsPersistence(state)
  // Async hydration must finish before autosave watchers are registered.
  const settingsWatchScope = effectScope()
  const defaultStartMode = {
    darwin: ISartMode.QUIET,
    win32: ISartMode.MAIN,
    linux: ISartMode.MINI,
  }

  async function initData() {
    const config = (await getConfig<IConfig>()) || ({} as IConfig)
    if (!settingsWatchScope.active) return
    const stored = config.settings || {}
    const hydrateField = <K extends keyof ISettingForm>(key: K) => {
      const fallback = settings.value[key]
      const value = stored[key] ?? fallback
      settings.value[key] = (typeof fallback === 'boolean' ? enforceBoolean(value) : value) as ISettingForm[K]
    }
    for (const key of Object.keys(settings.value) as (keyof ISettingForm)[]) hydrateField(key)

    const portable = await window.electron.triggerRPC<boolean>(IRPCActionType.GET_IS_PORTABLE)
    if (!settingsWatchScope.active) return
    isPortable.value = portable || false
    visiblePicBeds.value = picBedG.value.filter(item => item.visible).map(item => item.type)
    settings.value.theme = stored.theme || 'default.css'
    try {
      const actualAutoStartStatus = await window.electron.triggerRPC<boolean>(IRPCActionType.PICLIST_AUTO_START_STATUS)
      if (!settingsWatchScope.active) return
      if (typeof actualAutoStartStatus === 'boolean') {
        settings.value.autoStart = actualAutoStartStatus
        if (actualAutoStartStatus !== stored.autoStart) {
          await saveConfig({ [configPaths.settings.autoStart]: actualAutoStartStatus })
        }
      }
    } catch {
      if (!settingsWatchScope.active) return
      settings.value.autoStart = enforceBoolean(stored.autoStart)
    }
    if (!settingsWatchScope.active) return
    settings.value.logLevel = initArray(stored.logLevel || [], ['all'])
    settings.value.autoImportPicBed = initArray(stored.autoImportPicBed || [], [])
    settings.value.language = stored.language || locale.value
    settings.value.startMode =
      stored.startMode !== undefined
        ? stored.startMode
        : defaultStartMode[osGlobal.value as keyof typeof defaultStartMode] || ISartMode.MAIN
    settings.value.secondPicBedMode = stored.secondPicBedMode || 'backup'
    if (osGlobal.value === 'darwin' && settings.value.startMode === ISartMode.MINI) {
      settings.value.startMode = ISartMode.QUIET
      await saveConfig(configPaths.settings.startMode, ISartMode.QUIET)
      if (!settingsWatchScope.active) return
    }
    settings.value.shortUrlServer = stored.shortUrlServer || 'c1n'
    settings.value.customLink = stored.customLink || '![$fileName]($url)'
    uploadProxy.value = config.picBed?.proxy || ''
    serverDraft.value = createServerDraft(stored.server)
    advancedRename.value = config.buildIn?.rename || { enable: false, format: '{filename}' }
    advancedRename.value.enable = enforceBoolean(advancedRename.value.enable)
    if (advancedRename.value.enable) {
      settings.value.autoRename = false
      await saveConfig({ [configPaths.settings.autoRename]: false })
      if (!settingsWatchScope.active) return
    }
    syncDraft.value = createSyncDraft(stored.sync)
    settings.value.logFileSizeLimit = enforceNumber(stored.logFileSizeLimit) || 10
    settingsWatchScope.run(startPersistence)
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
  return { ...state, ...actions }
}
