// External dependencies
import { ipcMain, IpcMainEvent } from 'electron'

// Electron modules

// Custom utilities and modules
import { configRouter } from './routes/config'
import { toolboxRouter } from './routes/toolbox'
import { systemRouter } from './routes/system'

// Custom types/enums
import { IRPCActionType } from '~/universal/types/enum'

// External utility functions
import { RPC_ACTIONS } from '#/events/constants'

class RPCServer implements IRPCServer {
  private routes: IRPCRoutes = new Map()

  private rpcEventHandler = async (event: IpcMainEvent, action: IRPCActionType, args: any[], callbackId: string) => {
    try {
      const handler = this.routes.get(action)
      if (!handler) {
        return this.sendBack(event, action, null, callbackId)
      }
      const res = await handler?.(args, event)
      this.sendBack(event, action, res, callbackId)
    } catch (e) {
      this.sendBack(event, action, null, callbackId)
    }
  }

  /**
   * if sendback data is null, then it means that the action is not supported or error occurs
   * if there is no callbackId, then do not send back
   */
  private sendBack (event: IpcMainEvent, action: IRPCActionType, data: any, callbackId: string) {
    if (callbackId) {
      event.sender.send(RPC_ACTIONS, data, action, callbackId)
    }
  }

  start () {
    ipcMain.on(RPC_ACTIONS, this.rpcEventHandler)
  }

  use (routes: IRPCRoutes) {
    for (const [action, handler] of routes) {
      this.routes.set(action, handler)
    }
  }

  stop () {
    ipcMain.off(RPC_ACTIONS, this.rpcEventHandler)
  }
}

const rpcServer = new RPCServer()

rpcServer.use(configRouter.routes())
rpcServer.use(toolboxRouter.routes())
rpcServer.use(systemRouter.routes())

export {
  rpcServer
}
