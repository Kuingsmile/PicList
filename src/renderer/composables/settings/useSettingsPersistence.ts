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
export function useSettingsPersistence(state: SettingsState) {
  const { t, locale } = useI18n()
  const message = useMessage()
  const { updatePicBeds } = usePicBed()
  const {
    showPicBedList,
    galleryPicBedFilterList,
    currentTheme,
    proxy,
    currentLanguage,
    currentSecondMode,
    currentStartMode,
    currentShortUrlServer,
    rawPicGoSize,
    customLink,
    advancedRename,
    formOfSetting,
    picBedG,
  } = state
  const autoWatchKeys = [
    'showUpdateTip',
    'autoImport',
    'autoImportPicBed',
    'useBuiltinClipboard',
    'isAutoListenClipboard',
    'deleteCloudFile',
    'deleteLocalFile',
    'rename',
    'autoRename',
    'serverKey',
    'serverMaxConcurrency',
    'serverUploadInterval',
    'uploadNotification',
    'uploadResultNotification',
    'autoCloseMainWindow',
    'autoCloseMiniWindow',
    'isCustomMiniIcon',
    'c1nToken',
    'yourlsDomain',
    'yourlsSignature',
    'cfWorkerHost',
    'sinkDomain',
    'sinkToken',
    'registry',
    'proxy',
    'autoCopy',
    'encodeOutputURL',
    'useShortUrl',
    'enableSecondUploader',
    'enableAdvancedAnimation',
  ]

  const addWatch = () => {
    autoWatchKeys.forEach(key => {
      watch(
        () => formOfSetting.value[key as keyof ISettingForm],
        async value => {
          await saveConfig({ [`settings.${key}`]: value })
        },
      )
    })

    watch(showPicBedList, val => {
      handleShowPicBedListChange(val)
    })

    watch(galleryPicBedFilterList, val => {
      handleGalleryPicBedFilterChange(val)
    })

    watch(
      () => formOfSetting.value.aesPassword,
      val => {
        handleAesPasswordChange(val)
      },
    )

    watch(currentSecondMode, async newVal => {
      if (newVal) {
        if (!(await saveConfig({ [configPaths.settings.secondPicBedMode]: newVal }))) return
      }
    })

    watch(currentLanguage, newVal => {
      if (newVal) {
        handleLanguageChange(newVal)
      }
    })

    watch(currentStartMode, newVal => {
      if (newVal) {
        handleStartModeChange(newVal)
      }
    })

    watch(currentShortUrlServer, newVal => {
      if (newVal) {
        handleShortUrlServerChange(newVal)
      }
    })

    watch(currentTheme, newVal => {
      if (newVal) {
        handleThemeChange(newVal)
      }
    })

    watch(
      advancedRename,
      async newVal => {
        if (!(await saveConfig(configPaths.buildIn.rename, toRaw(newVal)))) return
        if (newVal.enable) {
          formOfSetting.value.autoRename = false
          if (!(await saveConfig(configPaths.settings.autoRename, false))) return
        }
      },
      { deep: 1 },
    )

    watch(
      () => formOfSetting.value.mainWindowWidth,
      async newVal => {
        const width = enforceNumber(newVal)
        await saveConfig({ [configPaths.settings.mainWindowWidth]: rawPicGoSize.value ? 800 : Math.max(width, 100) })
      },
    )

    watch(
      () => formOfSetting.value.mainWindowHeight,
      async newVal => {
        const height = enforceNumber(newVal)
        await saveConfig({
          [configPaths.settings.mainWindowHeight]: rawPicGoSize.value ? 450 : Math.max(height, 100),
        })
      },
    )

    watch(rawPicGoSize, newVal => {
      if (newVal) {
        formOfSetting.value.mainWindowWidth = 800
        formOfSetting.value.mainWindowHeight = 450
      }
    })

    watch(customLink, async newVal => {
      await saveConfig(configPaths.settings.customLink, newVal)
    })

    watch(proxy, async value => {
      await saveConfig({ 'picBed.proxy': value })
    })

    watch(
      () => formOfSetting.value.logFileSizeLimit,
      async newVal => {
        const size = enforceNumber(newVal)
        if (size < 1) {
          formOfSetting.value.logFileSizeLimit = 1
          if (!(await saveConfig({ [configPaths.settings.logFileSizeLimit]: 1 }))) return
        } else {
          if (!(await saveConfig({ [configPaths.settings.logFileSizeLimit]: size }))) return
        }
      },
    )

    watch(
      () => formOfSetting.value.logLevel,
      async newVal => {
        if (newVal.length === 0) {
          message.error(t('pages.settings.advanced.chooseLogLevel'))
          return
        }
        await saveConfig({
          [configPaths.settings.logLevel]: newVal,
        })
      },
    )

    watch(
      () => formOfSetting.value.enableCustomBgImg,
      async newVal => {
        if (!(await saveConfig({ [configPaths.settings.enableCustomBgImg]: newVal }))) return
        window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
      },
    )
  }
  async function handleBlurCustomBgImgBlur() {
    if (!(await saveConfig({ [configPaths.settings.customBgImgBlur]: formOfSetting.value.customBgImgBlur }))) return
    window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
  }

  async function handleBlurCustomBgImgOpacity() {
    if (!(await saveConfig({ [configPaths.settings.customBgImgOpacity]: formOfSetting.value.customBgImgOpacity })))
      return
    window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
  }

  async function handleThemeChange(theme: string) {
    try {
      if (!(await saveConfig({ [configPaths.settings.theme]: theme }))) return
      await window.electron.triggerRPC(IRPCActionType.THEME_APPLY_THEME, theme)
    } catch (error) {
      console.error('Failed to apply theme:', error)
      message.error(t('pages.settings.system.applyThemeFailed'))
    }
  }

  async function handleIsDisableGPUChange(value: boolean | undefined) {
    if (value === undefined) return
    if (!(await saveConfig({ [configPaths.settings.isDisableGPU]: value }))) return
    message.info(t('pages.settings.system.needRestart'))
  }

  async function handleHideDockChange(val: ICheckBoxValueType) {
    if (val && currentStartMode.value === ISartMode.NO_TRAY) {
      message.warning(t('pages.settings.system.hideDockHint'))
      formOfSetting.value.isHideDock = false
      return
    }
    if (!(await saveConfig(configPaths.settings.isHideDock, val))) return
    window.electron.sendRPC(IRPCActionType.HIDE_DOCK, val)
  }

  async function handleShowPicBedListChange(val: ICheckBoxValueType[]) {
    try {
      const list = picBedG.value.map(item => ({ ...item, visible: val.includes(item.type) }))
      if (!(await saveConfig({ [configPaths.picBed.list]: list }))) return
      nextTick(() => {
        updatePicBeds()
      })
    } catch (error) {
      console.error('Error updating PicBed visibility:', error)
    }
  }

  async function handleGalleryPicBedFilterChange(val: ICheckBoxValueType[]) {
    await saveConfig({ [configPaths.settings.galleryPicBedFilter]: val })
  }

  async function handleAutoStartChange(val: ICheckBoxValueType) {
    if (!(await saveWithFeedback(() => invokeRPC(IRPCActionType.PICLIST_AUTO_START, Boolean(val))))) return
    await saveConfig(configPaths.settings.autoStart, val)
  }

  async function handleMiniWindowOntop(val: ICheckBoxValueType) {
    if (!(await saveConfig(configPaths.settings.miniWindowOntop, val))) return
    window.electron.sendRPC(IRPCActionType.MINI_WINDOW_ON_TOP, val)
  }

  async function handleCustomBgImg() {
    const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
    if (result && result[0]) {
      const fileName = await window.electron.triggerRPC<string>(IRPCActionType.COPY_CUSTOM_IMG_TO_THEMES_DIR, result[0])
      formOfSetting.value.customBgImgPath = `theme://./image/${fileName}`
      if (!(await saveConfig(configPaths.settings.customBgImgPath, formOfSetting.value.customBgImgPath))) return
      await window.electron.triggerRPC(IRPCActionType.THEME_APPLY_THEME, currentTheme.value)
    }
  }

  async function handleMiniIconPath() {
    const result = await window.electron.triggerRPC<string[]>(IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG)
    if (result && result[0]) {
      formOfSetting.value.customMiniIcon = result[0]
      if (!(await saveConfig(configPaths.settings.customMiniIcon, formOfSetting.value.customMiniIcon))) return
      window.electron.sendRPC(IRPCActionType.RELOAD_WINDOW)
    }
  }

  async function handleShortUrlServerChange(val: string) {
    formOfSetting.value.shortUrlServer = val
    await saveConfig(configPaths.settings.shortUrlServer, val)
  }

  async function handleAesPasswordChange(val: string) {
    await saveConfig(configPaths.settings.aesPassword, val || 'PicList-aesPassword')
  }

  async function handleLanguageChange(val: string) {
    if (!(await saveConfig({ [configPaths.settings.language]: val }))) return
    locale.value = val
    setCurrentLanguage(val)
    localStorage.setItem('currentLanguage', val)
    updatePicBeds()
  }

  async function handleStartModeChange(val: string) {
    if (val === ISartMode.NO_TRAY) {
      if (formOfSetting.value.isHideDock) {
        message.warning(t('pages.settings.system.hideDockHint'))
        currentStartMode.value = ISartMode.QUIET
        return
      }
      message.info(t('pages.settings.system.needRestart'))
    }
    await saveConfig({ [configPaths.settings.startMode]: val })
  }
  return {
    addWatch,
    handleBlurCustomBgImgBlur,
    handleBlurCustomBgImgOpacity,
    handleIsDisableGPUChange,
    handleHideDockChange,
    handleAutoStartChange,
    handleMiniWindowOntop,
    handleCustomBgImg,
    handleMiniIconPath,
  }
}
