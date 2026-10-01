import picgo from '@core/picgo'

import { RpcError } from '#/rpc'
import { IRPCActionType, IRPCType } from '~/constants'
import { defineRpcHandler, RPCRouter } from '~/ipc/router'
import deleteRoutes from '~/ipc/routes/picbed/delete'
import getPicBeds from '~/utils/getPicBeds'
import {
  changeCurrentUploader,
  deleteUploaderConfig,
  duplicateUploaderConfig,
  getUploaderConfigList,
  resetUploaderConfig,
  selectUploaderConfig,
  updateUploaderConfig,
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
    action: IRPCActionType.PICBED_GET_UPLOAD_TARGETS,
    handler: async (): Promise<IUploadTarget[]> => {
      const uploaders = picgo.getConfig<IUploaderConfig>('uploader') || {}
      return getPicBeds()
        .picBeds.filter(item => item.visible)
        .flatMap(item => {
          const configs = uploaders[item.type]?.configList
          const currentConfig = picgo.getConfig<IStringKeyMap>(`picBed.${item.type}`)
          return configs?.length
            ? configs.map(config => ({
                type: item.type,
                name: item.name,
                configId: config._id,
                configName: config._configName || 'Default',
              }))
            : [{ type: item.type, name: item.name, configId: '', configName: currentConfig?._configName || 'Default' }]
        })
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.PICBED_SELECT_UPLOAD_TARGET,
    handler: defineRpcHandler(IRPCActionType.PICBED_SELECT_UPLOAD_TARGET, async (_, [type, id]) => {
      if (!getPicBeds().picBeds.some(item => item.type === type && item.visible)) throw new RpcError('NOT_FOUND')
      const configs = picgo.getConfig<IUploaderConfigItem>(`uploader.${type}`)?.configList
      const config = id ? configs?.find(item => item._id === id) : picgo.getConfig<IStringKeyMap>(`picBed.${type}`)
      if ((id && !config) || (!id && configs?.length)) throw new RpcError('NOT_FOUND')
      changeCurrentUploader(type, config, id)
      return true
    }),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.PICBED_GET_CONFIG_LIST,
    handler: async (_: IIPCEvent, args: [type: string]) => {
      const config = getUploaderConfigList(args[0])
      return config
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.PICBED_DELETE_CONFIG,
    handler: defineRpcHandler(
      IRPCActionType.PICBED_DELETE_CONFIG,
      async (_: IIPCEvent, args: [type: string, id: string]) => {
        const [type, id] = args
        const config = await deleteUploaderConfig(type, id)
        return config
      },
    ),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.PICBED_DUPLICATE_CONFIG,
    handler: defineRpcHandler(
      IRPCActionType.PICBED_DUPLICATE_CONFIG,
      async (_: IIPCEvent, args: [type: string, id: string, newName: string]) => {
        const [type, id, newName] = args
        const config = await duplicateUploaderConfig(type, id, newName)
        return config
      },
    ),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOADER_SELECT,
    handler: defineRpcHandler(
      IRPCActionType.UPLOADER_SELECT,
      async (_: IIPCEvent, args: [type: string, id: string]) => {
        const [type, id] = args
        await selectUploaderConfig(type, id)
        return true
      },
    ),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOADER_UPDATE_CONFIG,
    handler: defineRpcHandler(
      IRPCActionType.UPLOADER_UPDATE_CONFIG,
      async (_: IIPCEvent, args: [type: string, id: string, config: IStringKeyMap]) => {
        const [type, id, config] = args
        await updateUploaderConfig(type, id, config)
        return true
      },
    ),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOADER_RESET_CONFIG,
    handler: defineRpcHandler(
      IRPCActionType.UPLOADER_RESET_CONFIG,
      async (_: IIPCEvent, args: [type: string, id: string]) => {
        const [type, id] = args
        await resetUploaderConfig(type, id)
        return true
      },
    ),
    type: IRPCType.INVOKE,
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
          name,
        }
      } else {
        return {
          config: [],
          name,
        }
      }
    },
    type: IRPCType.INVOKE,
  },
]

const picBedsRoutes = [...picbedRoutes, ...deleteRoutes]

picbedRouter.addBatch(picBedsRoutes)

export { picbedRouter }
