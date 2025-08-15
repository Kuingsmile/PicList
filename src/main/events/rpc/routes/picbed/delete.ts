import ALLApi from 'apis/delete/allApi'

import type { IIPCEvent } from '#/types/rpc'
import type { ImgInfo } from '#/types/types'
import { IRPCActionType, IRPCType } from '~/utils/enum'

export default [
  {
    action: IRPCActionType.DELETE_ALL_API,
    handler: async (_: IIPCEvent, args: [item: ImgInfo]) => {
      return await ALLApi.delete(args[0])
    },
    type: IRPCType.INVOKE
  }
]
