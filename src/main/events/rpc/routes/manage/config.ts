import type { IIPCEvent } from '#/types/rpc'
import type { IObj } from '#/types/types'
import getManageApi from '~/manage/Main'
import { IRPCActionType, IRPCType } from '~/utils/enum'

const manageApi = getManageApi()

export default [
  {
    action: IRPCActionType.MANAGE_GET_CONFIG,
    handler: async (_: IIPCEvent, args: [key?: string]) => {
      return manageApi.getConfig(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_SAVE_CONFIG,
    handler: async (_: IIPCEvent, args: [data: IObj]) => {
      manageApi.saveConfig(args[0])
    }
  },
  {
    action: IRPCActionType.MANAGE_REMOVE_CONFIG,
    handler: async (_: IIPCEvent, args: [key: string, propName: string]) => {
      manageApi.removeConfig(args[0], args[1])
    }
  }
]
