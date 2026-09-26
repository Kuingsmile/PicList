import useMessage from '@/hooks/useMessage'
import { type RpcAction, type RpcArgs, type RpcData, RpcError, rpcErrorMessages, unwrapRpcResult } from '#/rpc'

import { getRawData } from './common'

/** Unwrap in the renderer so Electron's context bridge cannot discard error codes. */
export async function invokeRPC<A extends RpcAction>(action: A, ...args: RpcArgs<A>): Promise<RpcData<A>> {
  return unwrapRpcResult<RpcData<A>>(await window.electron.invokeRPC(action, ...getRawData(args)), action)
}

export function showRpcError(error: unknown) {
  useMessage().error(error instanceof RpcError ? error.message : rpcErrorMessages.INTERNAL_ERROR)
}

/** UI save helpers report failures and let callers keep drafts and skip success-only effects. */
export async function saveWithFeedback(operation: () => Promise<unknown>): Promise<boolean> {
  try {
    await operation()
    return true
  } catch (error) {
    showRpcError(error)
    return false
  }
}
