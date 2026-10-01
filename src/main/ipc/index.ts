import logger from '@core/picgo/logger'
import { ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron'

import { RPC_ACTIONS, RPC_ACTIONS_INVOKE } from '#/constants/ipcChannels'
import { isRpcAction, RpcError, rpcRequestSchema } from '#/rpc'
import { IRPCType } from '~/constants'
import { galleryRouter } from '~/ipc/routes/gallery'
import { manageRouter } from '~/ipc/routes/manage'
import { picbedRouter } from '~/ipc/routes/picbed'
import { pluginRouter } from '~/ipc/routes/plugin'
import { scriptMarketplaceRouter } from '~/ipc/routes/scriptMarketplace'
import { settingRouter } from '~/ipc/routes/setting'
import { systemRouter } from '~/ipc/routes/system'
import { toolboxRouter } from '~/ipc/routes/toolbox'
import { trayRouter } from '~/ipc/routes/tray'
import { updaterRouter } from '~/ipc/routes/updater'
import { uploadRouter } from '~/ipc/routes/upload'
import { isTrustedRendererSender } from '~/utils/rendererSecurity'

import { dispatchRpc, redactedDiagnostic } from './dispatch'

class RPCServer implements IRPCServer {
  private routes: IRPCRoutes = new Map()
  private routesWithResponse: IRPCRoutes = new Map()

  private rpcEventHandler = async (event: IpcMainEvent, action: string, args: any[]) => {
    if (!isTrustedRendererSender(event)) {
      event.returnValue = null
      return
    }
    try {
      rpcRequestSchema.parse({ action, args })
      if (isRpcAction(action)) throw new RpcError('INVALID_REQUEST')
      const route = this.routes.get(action)
      if (!route) throw new RpcError('NOT_FOUND')
      await route.handler(event, args)
    } catch (error) {
      event.returnValue = null
      logger.error(JSON.stringify({ rpc: 'notification-failed', ...redactedDiagnostic(error) }))
    }
  }

  private rpcEventHandlerWithResponse = async (event: IpcMainInvokeEvent, action: string, args: any[]) => {
    return dispatchRpc(
      action,
      args,
      isTrustedRendererSender(event),
      action => {
        const route = this.routesWithResponse.get(action)
        return route ? args => route.handler(event, args) : undefined
      },
      diagnostic => logger.error(JSON.stringify(diagnostic)),
    )
  }

  start() {
    ipcMain.on(RPC_ACTIONS, this.rpcEventHandler)
    ipcMain.handle(RPC_ACTIONS_INVOKE, this.rpcEventHandlerWithResponse)
  }

  use(routes: IRPCRoutes) {
    for (const [action, route] of routes) {
      if (route.type === IRPCType.SEND) {
        this.routes.set(action, route)
      } else {
        this.routesWithResponse.set(action, route)
      }
    }
  }

  stop() {
    ipcMain.off(RPC_ACTIONS, this.rpcEventHandler)
    ipcMain.removeHandler(RPC_ACTIONS_INVOKE)
  }
}

const rpcServer = new RPCServer()

const routes = [
  galleryRouter.routes(),
  picbedRouter.routes(),
  pluginRouter.routes(),
  scriptMarketplaceRouter.routes(),
  settingRouter.routes(),
  systemRouter.routes(),
  toolboxRouter.routes(),
  trayRouter.routes(),
  uploadRouter.routes(),
  updaterRouter.routes(),
  manageRouter.routes(),
]

for (const route of routes) {
  rpcServer.use(route)
}

export { rpcServer }
