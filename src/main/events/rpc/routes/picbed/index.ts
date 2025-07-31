import picgo from '@core/picgo'

import { IRPCActionType, IRPCType } from '#/types/enum'
import { IIPCEvent } from '#/types/rpc'
import { IStringKeyMap } from '#/types/types'
import { RPCRouter } from '~/events/rpc/router'
import deleteRoutes from '~/events/rpc/routes/picbed/delete'
import {
  deleteUploaderConfig,
  getUploaderConfigList,
  resetUploaderConfig,
  selectUploaderConfig,
  updateUploaderConfig
} from '~/utils/handleUploaderConfig'

const picbedRouter = new RPCRouter()

const handleConfigWithFunction = (config: any[]) => {
  for (const i in config) {
    if (typeof config[i].default === 'function') {
      config[i].default = config[i].default()
    }
    if (typeof config[i].choices === 'function') {
      config[i].choices = config[i].choices()
    }
  }
  return config
}

const picbedRoutes = [
  {
    action: IRPCActionType.PICBED_GET_CONFIG_LIST,
    handler: async (_: IIPCEvent, args: [type: string]) => {
      const config = getUploaderConfigList(args[0])
      return config
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.PICBED_DELETE_CONFIG,
    handler: async (_: IIPCEvent, args: [type: string, id: string]) => {
      const [type, id] = args
      const config = deleteUploaderConfig(type, id)
      return config
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOADER_SELECT,
    handler: async (_: IIPCEvent, args: [type: string, id: string]) => {
      const [type, id] = args
      selectUploaderConfig(type, id)
      return true
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOADER_UPDATE_CONFIG,
    handler: async (_: IIPCEvent, args: [type: string, id: string, config: IStringKeyMap]) => {
      const [type, id, config] = args
      updateUploaderConfig(type, id, config)
      return true
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.UPLOADER_RESET_CONFIG,
    handler: async (_: IIPCEvent, args: [type: string, id: string]) => {
      const [type, id] = args
      resetUploaderConfig(type, id)
      return true
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.PICBED_GET_PICBED_CONFIG,
    handler: async (_: IIPCEvent, args: [type: string]) => {
      const type = args[0]
      const name = picgo.helper.uploader.get(type)?.name || type
      if (picgo.helper.uploader.get(type)?.config) {
        const _config = picgo.helper.uploader.get(type)!.config!(picgo)
        const config = handleConfigWithFunction(_config)
        return {
          config,
          name
        }
      } else {
        return {
          config: [],
          name
        }
      }
    },
    type: IRPCType.INVOKE
  }
]

const picBedsRoutes = [...picbedRoutes, ...deleteRoutes]

picbedRouter.addBatch(picBedsRoutes)

export { picbedRouter }
