import { randomUUID } from 'node:crypto'

import {
  isRpcAction,
  rpcContracts,
  RpcError,
  type RpcErrorCode,
  rpcFailure,
  rpcRequestSchema,
  type RpcResult,
} from '../../../universal/rpc'

const systemCodes = new Set([
  'EACCES',
  'EPERM',
  'EROFS',
  'ENOSPC',
  'ENOENT',
  'ENOTDIR',
  'EISDIR',
  'EEXIST',
  'EIO',
  'EMFILE',
  'ENFILE',
  'ENAMETOOLONG',
  'EINVAL',
  'EBUSY',
  'ENOTEMPTY',
  'EXDEV',
  'ELOOP',
  'ENOSYS',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EPIPE',
  'ERR_NETWORK',
  'ERR_BAD_REQUEST',
  'ERR_BAD_RESPONSE',
  'ERR_CANCELED',
])

/** Exception messages, file contents, URLs and absolute paths are deliberately excluded. */
export function redactedDiagnostic(error: unknown, depth = 0): Record<string, unknown> {
  if (!(error instanceof Error)) return { name: 'UnknownError' }
  const systemCode =
    'code' in error && typeof error.code === 'string' && systemCodes.has(error.code) ? error.code : undefined
  const frames = (error.stack ?? '')
    .split('\n')
    .slice(1)
    .flatMap(line => {
      const location = /^\s+at .*[\\/]([\w.-]+:\d+:\d+)\)?$/.exec(line)
      return location ? [location[1]] : []
    })
    .slice(0, 12)
  return {
    name: ['Error', 'TypeError', 'RangeError', 'SyntaxError', 'RpcError'].includes(error.name) ? error.name : 'Error',
    systemCode,
    frames,
    ...(depth < 3 && error.cause instanceof Error && error.cause !== error
      ? { cause: redactedDiagnostic(error.cause, depth + 1) }
      : {}),
  }
}

export async function dispatchRpc(
  action: unknown,
  args: unknown,
  trusted: boolean,
  findHandler: (action: string) => ((args: unknown[]) => Promise<unknown>) | undefined,
  log: (diagnostic: Record<string, unknown>) => void,
): Promise<RpcResult<unknown>> {
  let knownAction: string | undefined
  try {
    if (!trusted) throw new RpcError('FORBIDDEN')
    const request = rpcRequestSchema.parse({ action, args })
    const handler = findHandler(request.action)
    if (!handler) throw new RpcError('NOT_FOUND')
    knownAction = request.action
    const contract = isRpcAction(request.action) ? rpcContracts[request.action] : undefined
    const validatedArgs = contract ? contract.args.parse(request.args) : request.args
    const data = await handler(validatedArgs)
    if (contract) {
      try {
        contract.result.parse(data)
      } catch {
        throw new RpcError('INVALID_RESPONSE')
      }
    }
    return { ok: true, data }
  } catch (error) {
    const code: RpcErrorCode =
      error instanceof RpcError
        ? error.code
        : knownAction && isRpcAction(knownAction)
          ? 'WRITE_FAILED'
          : 'INTERNAL_ERROR'
    const diagnosticId = randomUUID()
    try {
      log({ diagnosticId, action: knownAction ?? '<unresolved>', code, ...redactedDiagnostic(error) })
    } catch {
      // A logging failure must not replace a sanitized RPC response with a raw exception.
    }
    return rpcFailure(code, diagnosticId)
  }
}
