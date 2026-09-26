import { isPortable } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import { BrowserWindow, shell } from 'electron'
import updater from 'electron-updater'

import { defineRpcHandler, RPCRouter } from '~/events/rpc/router'
import { downloadAndInstallUpdate } from '~/lifeCycle/autoUpdater'
import { commitConfig } from '~/utils/commitConfig'
import { configPaths } from '~/utils/configPaths'
import { IRPCActionType, IRPCType } from '~/utils/enum'

const updaterRouter = new RPCRouter()

const updaterRoutes = [
  {
    action: IRPCActionType.DOWNLOAD_UPDATE,
    handler: async () => {
      if (!isPortable()) {
        updater.autoUpdater.downloadUpdate()
      } else {
        downloadAndInstallUpdate()
      }
    },
  },
  {
    action: IRPCActionType.GO_TO_DOWNLOAD_PAGE,
    handler: async () => {
      shell.openExternal('https://github.com/Kuingsmile/PicList/releases/latest')
    },
  },
  {
    action: IRPCActionType.INSTALL_UPDATE,
    handler: async () => {
      updater.autoUpdater.quitAndInstall()
    },
  },
  {
    action: IRPCActionType.SET_SHOW_UPDATE_TIP,
    handler: defineRpcHandler(IRPCActionType.SET_SHOW_UPDATE_TIP, async (_: IIPCEvent, args: [value: boolean]) => {
      return commitConfig(picgo, { [configPaths.settings.showUpdateTip]: args[0] })
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CLOSE_CURRENT_WINDOW,
    handler: async (event: IIPCEvent) => {
      const window = BrowserWindow.fromWebContents(event.sender)
      if (window) {
        window.close()
      }
    },
  },
]

updaterRouter.addBatch(updaterRoutes)

export { updaterRouter }
