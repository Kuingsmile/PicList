import server from '~/server'
import { IRPCActionType } from '~/utils/enum'

export default [
  {
    action: IRPCActionType.ADVANCED_UPDATE_SERVER,
    handler: async () => {
      server.restart()
    },
  },
]
