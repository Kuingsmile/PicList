import picgo from '@core/picgo'
import { app, nativeTheme, shell } from 'electron'

import { applyTheme, fetchThemes, importThemes, resolveThemes } from '~/apis/app/theme'
import { i18nManager } from '~/i18n'
import { IRPCActionType, IRPCType } from '~/utils/enum'

export default [
  {
    action: IRPCActionType.RELOAD_APP,
    handler: async () => {
      app.relaunch()
      app.exit(0)
    },
  },
  {
    action: IRPCActionType.OPEN_FILE,
    handler: async (_: IIPCEvent, args: [filePath: string]) => {
      shell.openPath(args[0])
    },
  },
  {
    action: IRPCActionType.OPEN_URL,
    handler: async (_: IIPCEvent, args: [url: string]) => {
      shell.openExternal(args[0])
    },
  },
  {
    action: IRPCActionType.SET_CURRENT_LANGUAGE,
    handler: async (_: IIPCEvent, args: [language: string]) => {
      i18nManager.setCurrentLanguage(args[0])
      const { lang } = i18nManager.getCurrentLocales()
      picgo.i18n.setLanguage(lang)
    },
  },
  {
    action: IRPCActionType.GET_SYSTEM_THEME,
    handler: async () => {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SET_SYSTEM_THEME,
    handler: async (_: IIPCEvent, args: [theme: 'light' | 'dark' | 'system']) => {
      nativeTheme.themeSource = args[0]
    },
  },
  {
    action: IRPCActionType.APPLY_THEME,
    handler: async (_: IIPCEvent, args: [theme: string]) => {
      applyTheme(args[0])
    },
  },
  {
    action: IRPCActionType.THEME_RESOLVE_THEMES,
    handler: async () => {
      return await resolveThemes()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.THEME_FETCH_THEMES,
    handler: async () => {
      return await fetchThemes()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.THEME_IMPORT_THEMES,
    handler: async (_: IIPCEvent, args: [files: string[]]) => {
      await importThemes(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.THEME_APPLY_THEME,
    handler: async (_: IIPCEvent, args: [theme: string]) => {
      await applyTheme(args[0])
    },
    type: IRPCType.INVOKE,
  },
]
