import { IpcMainEvent } from 'electron'

import { IRPCActionType, IRPCType, IToolboxItemType } from '#/types/enum'
import { IToolboxCheckArgs, IToolboxCheckerMap, IToolboxFixMap } from '#/types/rpc'
import { RPCRouter } from '~/events/rpc/router'
import { checkClipboardUploadMap, fixClipboardUploadMap } from '~/events/rpc/routes/toolbox/checkClipboardUpload'
import { checkFileMap, fixFileMap } from '~/events/rpc/routes/toolbox/checkFile'
import { checkProxyMap } from '~/events/rpc/routes/toolbox/checkProxy'

const toolboxRouter = new RPCRouter()

const toolboxCheckMap: Partial<IToolboxCheckerMap<IToolboxItemType>> = {
  ...checkFileMap,
  ...checkClipboardUploadMap,
  ...checkProxyMap
}

const toolboxFixMap: Partial<IToolboxFixMap<IToolboxItemType>> = {
  ...fixFileMap,
  ...fixClipboardUploadMap
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
          const handler = toolboxCheckMap[key as IToolboxItemType]
          if (handler) {
            handler(event as IpcMainEvent)
          }
        }
      }
    },
    IRPCType.SEND
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
    IRPCType.INVOKE
  )

export { toolboxRouter }
