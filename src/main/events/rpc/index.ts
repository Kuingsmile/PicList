import { ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron'

import logger from '@core/picgo/logger'

import { galleryRouter } from '~/events/rpc/routes/gallery'
import { picbedRouter } from '~/events/rpc/routes/picbed'
import { pluginRouter } from '~/events/rpc/routes/plugin'
import { settingRouter } from '~/events/rpc/routes/setting'
import { systemRouter } from '~/events/rpc/routes/system'
import { toolboxRouter } from '~/events/rpc/routes/toolbox'
import { trayRouter } from '~/events/rpc/routes/tray'
import { uploadRouter } from '~/events/rpc/routes/upload'
import { manageRouter } from '~/events/rpc/routes/manage'

import { IRPCActionType, IRPCType } from '#/types/enum'
import { RPC_ACTIONS, RPC_ACTIONS_INVOKE } from '#/events/constants'

class RPCServer implements IRPCServer {
  private routes: IRPCRoutes = new Map()
  private routesWithResponse: IRPCRoutes = new Map()

  private rpcEventHandler = async (event: IpcMainEvent, action: IRPCActionType, args: any[]) => {
    try {
      const route = this.routes.get(action)
      await route?.handler?.(event, args)
    } catch (e: any) {
      logger.error(e)
    }
  }

  private rpcEventHandlerWithResponse = async (event: IpcMainInvokeEvent, action: IRPCActionType, args: any[]) => {
    try {
      const route = this.routesWithResponse.get(action)
      return await route?.handler?.(event, args)
    } catch (e: any) {
      logger.error(e)
      return undefined
    }
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
  }
}

const rpcServer = new RPCServer()

const routes = [
  galleryRouter.routes(),
  picbedRouter.routes(),
  pluginRouter.routes(),
  settingRouter.routes(),
  systemRouter.routes(),
  toolboxRouter.routes(),
  trayRouter.routes(),
  uploadRouter.routes(),
  manageRouter.routes()
]

for (const route of routes) {
  rpcServer.use(route)
}

export { rpcServer }
