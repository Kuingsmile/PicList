import { nextTick, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { setCurrentLanguage } from '@/i18n'
import { saveConfig } from '@/services/configService'
import { invokeRPC, saveWithFeedback } from '@/services/rpcService'
import { configPaths } from '@/utils/configPaths'
import { ISartMode } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'
import { enforceNumber } from '#/utils/values'

import type { SettingsState } from './settingsState'

type SettingPolicies = {
  [K in keyof ISettingForm]: 'auto' | 'manual' | ((value: ISettingForm[K]) => Promise<unknown>)
}

export function useSettingsPersistence(state: SettingsState) {
  const { t, locale } = useI18n()
  const message = useMessage()
  const { updatePicBeds } = usePicBed()
  const { settings, visiblePicBeds, uploadProxy, rawPicGoSize, advancedRename, picBedG } = state

  // Every settings field has exactly one policy. Adding a field requires choosing
  // autosave, a business effect, or an explicit commit (blur/file selection).
  const policies: SettingPolicies = {
    language: handleLanguageChange,
    startMode: handleStartModeChange,
    trayClickAction: 'auto',
    isDisableGPU: handleIsDisableGPUChange,
    secondPicBedMode: value => saveNonemptySetting('secondPicBedMode', value),
    galleryPicBedFilter: 'auto',
    customLink: 'auto',
    showUpdateTip: 'auto',
    autoStart: handleAutoStartChange,
    rename: 'auto',
    autoRename: 'auto',
    uploadNotification: 'auto',
    uploadResultNotification: 'auto',
    miniWindowOntop: handleMiniWindowOntop,
    autoCloseMiniWindow: 'auto',
    autoCloseMainWindow: 'auto',
    logLevel: handleLogLevelChange,
    autoCopy: 'auto',
    useBuiltinClipboard: 'auto',
    logFileSizeLimit: handleLogFileSizeLimitChange,
    deleteCloudFile: 'auto',
    isCustomMiniIcon: handleIsCustomMiniIconChange,
    customMiniIcon: 'manual',
    isHideDock: handleHideDockChange,
    autoImport: 'auto',
    autoImportPicBed: 'auto',
    encodeOutputURL: 'auto',
    isAutoListenClipboard: 'auto',
    useShortUrl: 'auto',
    shortUrlServer: value => saveNonemptySetting('shortUrlServer', value),
    c1nToken: 'auto',
    yourlsDomain: 'auto',
    yourlsSignature: 'auto',
    cfWorkerHost: 'auto',
    sinkDomain: 'auto',
    sinkToken: 'auto',
    deleteLocalFile: 'auto',
    serverKey: 'auto',
    serverMaxConcurrency: 'auto',
    serverUploadInterval: 'auto',
    aesPassword: value => saveSetting('aesPassword', value || 'PicList-aesPassword'),
    registry: 'auto',
    proxy: 'auto',
    mainWindowWidth: value =>
      saveSetting('mainWindowWidth', rawPicGoSize.value ? 800 : Math.max(enforceNumber(value), 100)),
    mainWindowHeight: value =>
      saveSetting('mainWindowHeight', rawPicGoSize.value ? 450 : Math.max(enforceNumber(value), 100)),
    enableSecondUploader: 'auto',
    enableAdvancedAnimation: 'auto',
    theme: handleThemeChange,
    enableCustomBgImg: handleEnableCustomBgImgChange,
    customBgImgPath: 'manual',
    customBgImgOpacity: 'manual',
    customBgImgBlur: 'manual',
  }

  function saveSetting<K extends keyof ISettingForm>(key: K, value: ISettingForm[K]) {
    return saveConfig({ ['settings.' + key]: value })
  }

  async function saveNonemptySetting(key: 'secondPicBedMode' | 'shortUrlServer', value: string) {
    if (value) await saveSetting(key, value)
  }

  function watchSetting<K extends keyof ISettingForm>(key: K) {
    const policy = policies[key]
    if (policy === 'manual') return
    watch(
      () => settings.value[key],
      value => (policy === 'auto' ? saveSetting(key, value) : policy(value)),
    )
  }

  function startPersistence() {
    for (const key of Object.keys(policies) as (keyof ISettingForm)[]) watchSetting(key)
    watch(visiblePicBeds, handleShowPicBedListChange)
    watch(uploadProxy, value => saveConfig({ [configPaths.picBed.proxy]: value }))
    watch(
      advancedRename,
      async value => {
        if (!(await saveConfig(configPaths.buildIn.rename, toRaw(value)))) return
        if (value.enable) {
          settings.value.autoRename = false
          await saveSetting('autoRename', false)
        }
      },
      { deep: 1 },
    )
    watch(rawPicGoSize, value => {
      if (value) {
        settings.value.mainWindowWidth = 800
        settings.value.mainWindowHeight = 450
      }
    })
  }

  async function handleLogFileSizeLimitChange(value: number) {
    const size = enforceNumber(value)
    if (size < 1) {
      settings.value.logFileSizeLimit = 1
      return // The corrected value is saved by the same field watcher.
    }
    await saveSetting('logFileSizeLimit', size)
  }

  async function handleLogLevelChange(value: string[]) {
    if (value.length === 0) {
      message.error(t('pages.settings.advanced.chooseLogLevel'))
      return
    }
    await saveSetting('logLevel', value)
  }

  async function handleEnableCustomBgImgChange(value: boolean) {
    if (!(await saveSetting('enableCustomBgImg', value))) return
    window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
  }

  async function handleBlurCustomBgImgBlur() {
    if (!(await saveSetting('customBgImgBlur', settings.value.customBgImgBlur))) return
    window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
  }

  async function handleBlurCustomBgImgOpacity() {
    if (!(await saveSetting('customBgImgOpacity', settings.value.customBgImgOpacity))) return
    window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
  }

  async function handleThemeChange(theme: string) {
    if (!theme) return
    try {
      if (!(await saveSetting('theme', theme))) return
      await window.electron.triggerRPC(IRPCActionType.THEME_APPLY_THEME, theme)
    } catch (error) {
      console.error('Failed to apply theme:', error)
      message.error(t('pages.settings.system.applyThemeFailed'))
    }
  }

  async function handleIsDisableGPUChange(value: boolean) {
    if (!(await saveSetting('isDisableGPU', value))) return
    message.info(t('pages.settings.system.needRestart'))
  }

  let restoringDock = false
  async function handleHideDockChange(value: boolean) {
    // Resetting a rejected toggle must not save or invoke the Dock action again.
    if (restoringDock && !value) {
      restoringDock = false
      return
    }
    restoringDock = false
    if (value && settings.value.startMode === ISartMode.NO_TRAY) {
      message.warning(t('pages.settings.system.hideDockHint'))
      // Flush the attempted value so reverting it also resets the native checkbox.
      await nextTick()
      if (settings.value.isHideDock) {
        restoringDock = true
        settings.value.isHideDock = false
      }
      return
    }
    if (!(await saveSetting('isHideDock', value))) return
    window.electron.sendRPC(IRPCActionType.HIDE_DOCK, value)
  }

  async function handleShowPicBedListChange(value: string[]) {
    try {
      const list = picBedG.value.map(item => ({ ...item, visible: value.includes(item.type) }))
      if (!(await saveConfig({ [configPaths.picBed.list]: list }))) return
      nextTick(() => {
        updatePicBeds()
      })
    } catch (error) {
      console.error('Error updating PicBed visibility:', error)
    }
  }

  async function handleAutoStartChange(value: boolean) {
    if (!(await saveWithFeedback(() => invokeRPC(IRPCActionType.PICLIST_AUTO_START, value)))) return
    await saveSetting('autoStart', value)
  }

  async function handleMiniWindowOntop(value: boolean) {
    if (!(await saveSetting('miniWindowOntop', value))) return
    window.electron.sendRPC(IRPCActionType.MINI_WINDOW_ON_TOP, value)
  }

  async function handleIsCustomMiniIconChange(value: boolean) {
    if (!(await saveSetting('isCustomMiniIcon', value))) return
    window.electron.sendRPC(IRPCActionType.UPDATE_MINI_WINDOW_ICON)
  }

  async function handleCustomBgImg() {
    const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
    if (result && result[0]) {
      const fileName = await window.electron.triggerRPC<string>(IRPCActionType.COPY_CUSTOM_IMG_TO_THEMES_DIR, result[0])
      settings.value.customBgImgPath = 'theme://./image/' + fileName
      if (!(await saveSetting('customBgImgPath', settings.value.customBgImgPath))) return
      await window.electron.triggerRPC(IRPCActionType.THEME_APPLY_THEME, settings.value.theme)
    }
  }

  async function handleMiniIconPath() {
    const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
    if (result && result[0]) {
      settings.value.customMiniIcon = result[0]
      if (!(await saveSetting('customMiniIcon', settings.value.customMiniIcon))) return
      window.electron.sendRPC(IRPCActionType.UPDATE_MINI_WINDOW_ICON)
    }
  }

  async function handleLanguageChange(value: string) {
    if (!value) return
    if (!(await saveSetting('language', value))) return
    locale.value = value
    setCurrentLanguage(value)
    localStorage.setItem('currentLanguage', value)
    updatePicBeds()
  }

  async function handleStartModeChange(value: string) {
    if (!value) return
    if (value === ISartMode.NO_TRAY) {
      if (settings.value.isHideDock) {
        message.warning(t('pages.settings.system.hideDockHint'))
        settings.value.startMode = ISartMode.QUIET
        return
      }
      message.info(t('pages.settings.system.needRestart'))
    }
    await saveSetting('startMode', value)
  }

  // Components receive actions only for explicit user commands; model changes
  // and their business effects are handled by the persistence policies above.
  return {
    startPersistence,
    handleBlurCustomBgImgBlur,
    handleBlurCustomBgImgOpacity,
    handleCustomBgImg,
    handleMiniIconPath,
  }
}
