import path from 'node:path'

import { isPortable, themesDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import { app, nativeTheme, shell } from 'electron'
import fs from 'fs-extra'

import { applyTheme, fetchThemes, importThemes, readTheme, resolveThemes } from '~/apis/app/theme'
import { initializeI18n } from '~/i18n'
import { configPaths } from '~/utils/configPaths'
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
      initializeI18n(args[0])
      picgo.i18n.setLanguage(args[0])
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
    action: IRPCActionType.THEME_READ_THEME,
    handler: async (_: IIPCEvent, args: [fileName: string]) => {
      const abFilePath = path.join(themesDir(), args[0])
      if (!fs.existsSync(abFilePath)) {
        return null
      }
      return fs.readFileSync(abFilePath, 'utf-8')
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.COPY_CUSTOM_IMG_TO_THEMES_DIR,
    handler: async (_: IIPCEvent, args: [filePath: string]) => {
      const fileName = `custom-bgimg-${Date.now()}${path.extname(args[0])}`
      const abFilePath = path.join(themesDir(), 'image', fileName)
      fs.ensureDirSync(path.dirname(abFilePath))
      fs.copyFileSync(args[0], abFilePath)
      return fileName
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.THEME_WRITE_THEME,
    handler: async (_: IIPCEvent, args: [fileName: string, content: string]) => {
      const abFilePath = path.join(themesDir(), args[0])
      fs.ensureDirSync(path.dirname(abFilePath))
      fs.writeFileSync(abFilePath, args[1], 'utf-8')
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
  {
    action: IRPCActionType.GET_IS_PORTABLE,
    handler: async () => {
      return isPortable()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.THEME_GET_BOOTSTRAP,
    handler: async () => {
      let savedMode = picgo.getConfig<string>(configPaths.settings.systemTheme) || 'system'
      const customTheme = picgo.getConfig<string>(configPaths.settings.theme) || 'default.css'
      if (savedMode === 'system') {
        savedMode = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      }
      const theme = await readTheme(customTheme)
      return {
        mode: savedMode,
        css: theme,
      }
    },
    type: IRPCType.INVOKE,
  },
]
