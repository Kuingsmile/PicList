import { IRPCActionType, IRPCType } from '~/constants'
import { getLocalFileServerConfig, saveLocalFileServer } from '~/fileServer/localFileServer'
import { defineRpcHandler } from '~/ipc/router'
import server from '~/server'

export default [
  {
    action: IRPCActionType.GET_LOCAL_FILE_SERVER,
    handler: async () => getLocalFileServerConfig(),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.SAVE_LOCAL_FILE_SERVER,
    handler: defineRpcHandler(IRPCActionType.SAVE_LOCAL_FILE_SERVER, async (_, [config]) => {
      await saveLocalFileServer(config)
      return true
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.ADVANCED_UPDATE_SERVER,
    handler: async () => {
      server.restart()
    },
  },
]
