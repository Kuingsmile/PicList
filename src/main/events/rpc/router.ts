import { IRPCType } from '~/utils/enum'

interface IBatchAddParams {
  action: string
  handler: IRPCHandler<any>
  type?: string
}

export class RPCRouter implements IRPCRouter {
  private routeMap: IRPCRoutes = new Map()
  add = <T>(action: string, handler: IRPCHandler<T>, type: string = IRPCType.SEND): this => {
    this.routeMap.set(action, { handler, type })
    return this
  }

  addBatch = (params: IBatchAddParams[]): this => {
    for (const { action, handler, type = IRPCType.SEND } of params) {
      this.routeMap.set(action, { handler, type })
    }
    return this
  }

  routes() {
    return this.routeMap
  }
}
