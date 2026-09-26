import { defineRpcHandler } from '~/events/rpc/router'
import getManageApi from '~/manage/Main'
import { IRPCActionType, IRPCType } from '~/utils/enum'

const manageApi = getManageApi()

export default [
  {
    action: IRPCActionType.MANAGE_GET_CONFIG,
    handler: async (_: IIPCEvent, args: [key?: string]) => {
      return manageApi.getConfig(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_SAVE_CONFIG,
    handler: defineRpcHandler(IRPCActionType.MANAGE_SAVE_CONFIG, async (_: IIPCEvent, args: [data: IObj]) => {
      await manageApi.saveConfig(args[0])
      return true
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_REMOVE_CONFIG,
    handler: defineRpcHandler(
      IRPCActionType.MANAGE_REMOVE_CONFIG,
      async (_: IIPCEvent, args: [key: string, propName: string]) => {
        await manageApi.removeConfig(args[0], args[1])
        return true
      },
    ),
    type: IRPCType.INVOKE,
  },
]
