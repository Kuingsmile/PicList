import { isRpcAction, type RpcAction, type RpcArgs, type RpcData } from '#/rpc'
import { IRPCType } from '~/utils/enum'

interface IBatchAddParams {
  action: string
  handler: IRPCHandler<any>
  type?: string
}

export function defineRpcHandler<A extends RpcAction>(
  _action: A,
  handler: (event: IIPCEvent, args: RpcArgs<A>) => Promise<RpcData<A>>,
) {
  return handler
}

export class RPCRouter implements IRPCRouter {
  private routeMap: IRPCRoutes = new Map()
  add = <T>(action: string, handler: IRPCHandler<T>, type: string = IRPCType.SEND): this => {
    if (isRpcAction(action) && type !== IRPCType.INVOKE) {
      throw new Error('Persistent RPC routes must use INVOKE')
    }
    this.routeMap.set(action, { handler, type })
    return this
  }

  addBatch = (params: IBatchAddParams[]): this => {
    for (const { action, handler, type = IRPCType.SEND } of params) {
      this.add(action, handler, type)
    }
    return this
  }

  routes() {
    return this.routeMap
  }
}
