import { ipcRenderer } from 'electron'

import { RPC_ACTIONS, RPC_ACTIONS_INVOKE } from '#/constants/ipcChannels'
import {
  type InvokeRPC,
  isRpcAction,
  rpcContracts,
  rpcFailure,
  type RpcResult,
  rpcResultSchema,
  unwrapRpcResult,
} from '#/rpc'
import { getRawData } from '#/utils/rawData'

export function sendToMain(channel: string, ...args: any[]) {
  ipcRenderer.send(channel, ...getRawData(args))
}

export function sendRPC(action: string, ...args: any[]): void {
  if (isRpcAction(action)) throw new Error('Persistent operations require invokeRPC and an acknowledgement.')
  ipcRenderer.send(RPC_ACTIONS, action, getRawData(args))
}

async function invokeTransport(action: string, args: unknown[]): Promise<RpcResult<unknown>> {
  if (isRpcAction(action)) {
    try {
      rpcContracts[action].args.parse(args)
    } catch {
      return rpcFailure('INVALID_REQUEST')
    }
  }
  let result: unknown
  try {
    result = await ipcRenderer.invoke(RPC_ACTIONS_INVOKE, action, getRawData(args))
  } catch {
    return rpcFailure('TRANSPORT_ERROR')
  }
  try {
    return rpcResultSchema.parse(result)
  } catch {
    return rpcFailure('INVALID_RESPONSE')
  }
}

export const invokeRPC = ((action: string, ...args: unknown[]) => invokeTransport(action, args)) as InvokeRPC

export async function triggerRPC<T>(action: string, ...args: any[]): Promise<T | undefined> {
  return unwrapRpcResult<T | undefined>(await invokeTransport(action, args), action)
}

export function sendRpcSync(action: string, ...args: any[]): any {
  return ipcRenderer.sendSync(RPC_ACTIONS, action, getRawData(args))
}
