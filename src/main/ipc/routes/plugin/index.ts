import { IRPCActionType } from '~/constants'
import { RPCRouter } from '~/ipc/router'
import {
  pluginGetListFunc,
  pluginImportLocalFunc,
  pluginInstallFunc,
  pluginUpdateAllFunc,
} from '~/ipc/routes/plugin/utils'

const pluginRouter = new RPCRouter()

const pluginRoutes = [
  {
    action: IRPCActionType.PLUGIN_GET_LIST,
    handler: pluginGetListFunc,
  },
  {
    action: IRPCActionType.PLUGIN_INSTALL,
    handler: pluginInstallFunc,
  },
  {
    action: IRPCActionType.PLUGIN_IMPORT_LOCAL,
    handler: pluginImportLocalFunc,
  },
  {
    action: IRPCActionType.PLUGIN_UPDATE_ALL,
    handler: pluginUpdateAllFunc,
  },
]

pluginRouter.addBatch(pluginRoutes)

export { pluginRouter }
