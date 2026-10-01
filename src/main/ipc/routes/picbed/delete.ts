import ALLApi from 'apis/delete/allApi'

import { IRPCActionType, IRPCType } from '~/constants'

export default [
  {
    action: IRPCActionType.DELETE_ALL_API,
    handler: async (_: IIPCEvent, args: [item: ImgInfo]) => {
      return await ALLApi.delete(args[0])
    },
    type: IRPCType.INVOKE,
  },
]
