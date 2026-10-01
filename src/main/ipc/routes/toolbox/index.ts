import { IpcMainEvent } from 'electron'

import { IRPCActionType, IRPCType } from '~/constants'
import { RPCRouter } from '~/ipc/router'
import { checkClipboardUploadMap, fixClipboardUploadMap } from '~/ipc/routes/toolbox/checkClipboardUpload'
import { checkFileMap, fixFileMap } from '~/ipc/routes/toolbox/checkFile'
import { checkProxyMap } from '~/ipc/routes/toolbox/checkProxy'

const toolboxRouter = new RPCRouter()

const toolboxCheckMap: Partial<IToolboxCheckerMap<string>> = {
  ...checkFileMap,
  ...checkClipboardUploadMap,
  ...checkProxyMap,
}

const toolboxFixMap: Partial<IToolboxFixMap<string>> = {
  ...fixFileMap,
  ...fixClipboardUploadMap,
}

toolboxRouter
  .add(
    IRPCActionType.TOOLBOX_CHECK,
    async (event: any, args: IToolboxCheckArgs) => {
      const [type] = args as IToolboxCheckArgs
      if (type) {
        const handler = toolboxCheckMap[type]
        if (handler) {
          handler(event as IpcMainEvent)
        }
      } else {
        // do check all
        for (const key in toolboxCheckMap) {
          const handler = toolboxCheckMap[key]
          if (handler) {
            handler(event as IpcMainEvent)
          }
        }
      }
    },
    IRPCType.SEND,
  )
  .add(
    IRPCActionType.TOOLBOX_CHECK_FIX,
    async (event: any, args: IToolboxCheckArgs) => {
      const [type] = args as IToolboxCheckArgs
      const handler = toolboxFixMap[type]
      if (handler) {
        return await handler(event as IpcMainEvent)
      }
    },
    IRPCType.INVOKE,
  )

export { toolboxRouter }
