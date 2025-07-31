import { IRPCActionType, IRPCType } from '#/types/enum'
import { IRPCHandler, IRPCRouter, IRPCRoutes } from '#/types/rpc'

interface IBatchAddParams {
  action: IRPCActionType
  handler: IRPCHandler<any>
  type?: IRPCType
}

export class RPCRouter implements IRPCRouter {
  private routeMap: IRPCRoutes = new Map()
  add = <T>(action: IRPCActionType, handler: IRPCHandler<T>, type: IRPCType = IRPCType.SEND): this => {
    this.routeMap.set(action, { handler, type })
    return this
  }

  addBatch = (params: IBatchAddParams[]): this => {
    for (const { action, handler, type = IRPCType.SEND } of params) {
      this.routeMap.set(action, { handler, type })
    }
    return this
  }

  routes () {
    return this.routeMap
  }
}
