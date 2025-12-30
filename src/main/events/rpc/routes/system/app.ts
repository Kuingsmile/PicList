import picgo from '@core/picgo'
import { app, shell } from 'electron'

import type { IIPCEvent } from '#/types/rpc'
import { i18nManager } from '~/i18n'
import { IRPCActionType } from '~/utils/enum'

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
]
