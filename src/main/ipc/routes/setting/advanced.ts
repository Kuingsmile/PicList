import { IRPCActionType } from '~/constants'
import server from '~/server'

export default [
  {
    action: IRPCActionType.ADVANCED_UPDATE_SERVER,
    handler: async () => {
      server.restart()
    },
  },
]
