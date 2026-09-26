/** Shared, serializable RPC contracts. Never put exception text or request values in an error. */
export const rpcErrorMessages = {
  INVALID_REQUEST: 'The request is invalid. Check the entered values and try again.',
  FORBIDDEN: 'This window cannot perform the requested operation.',
  NOT_FOUND: 'The requested item or operation no longer exists.',
  CONFLICT: 'The operation conflicts with the current configuration.',
  WRITE_FAILED: 'The changes could not be saved. Your edits have been kept. Please try again.',
  INTERNAL_ERROR: 'The operation failed. Please try again.',
  INVALID_RESPONSE: 'The application returned an invalid acknowledgement. Please try again.',
  TRANSPORT_ERROR: 'The main process could not be reached. Please try again.',
} as const

export type RpcErrorCode = keyof typeof rpcErrorMessages
export interface RpcFailure {
  code: RpcErrorCode
  message: string
  diagnosticId?: string
}
export type RpcResult<T> = { ok: true; data: T } | { ok: false; error: RpcFailure }
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
export type ConfigPatch = Record<string, JsonValue>

export class RpcError extends Error {
  readonly code: RpcErrorCode
  readonly diagnosticId?: string

  constructor(code: RpcErrorCode, diagnosticId?: string) {
    super(rpcErrorMessages[code])
    this.name = 'RpcError'
    this.code = code
    this.diagnosticId = diagnosticId
  }
}

export interface RuntimeSchema<T> {
  parse: (value: unknown) => T
}

function schema<T>(check: (value: unknown) => boolean): RuntimeSchema<T> {
  return {
    parse(value) {
      try {
        if (check(value)) return value as T
      } catch {
        // Validators must not expose input (for example a parser error containing source text).
      }
      throw new RpcError('INVALID_REQUEST')
    },
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
const isString = (value: unknown): value is string => typeof value === 'string'
const isNonemptyString = (value: unknown): value is string => isString(value) && value.trim().length > 0
const isSafeKey = (value: string) =>
  !value.split(/[.[\]'"]/).some(key => ['__proto__', 'prototype', 'constructor'].includes(key))
const isJson = (value: unknown, seen = new Set<object>()): boolean => {
  if (value === null || typeof value === 'boolean' || isString(value)) return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || seen.has(value)) return false
  seen.add(value)
  const valid = Array.isArray(value)
    ? value.every(item => isJson(item, seen))
    : isRecord(value) && Object.entries(value).every(([key, item]) => isSafeKey(key) && isJson(item, seen))
  seen.delete(value)
  return valid
}
const isConfig = (value: unknown) => isRecord(value) && isJson(value)
const isPatch = (value: unknown) =>
  isRecord(value) && Object.keys(value).length > 0 && Object.keys(value).every(isNonemptyString) && isConfig(value)
const isSegment = (value: unknown): value is string =>
  isNonemptyString(value) && !/[\\/:\0]/.test(value) && value !== '.' && value !== '..'
const isScriptPath = (value: unknown) => Array.isArray(value) && value.length > 0 && value.every(isSegment)
const isUploader = (value: unknown) => isNonemptyString(value) && /^[\w-]+$/.test(value) && isSafeKey(value)
const tuple = <T extends unknown[]>(...checks: ((value: unknown) => boolean)[]) =>
  schema<T>(
    value => Array.isArray(value) && value.length === checks.length && checks.every((check, i) => check(value[i])),
  )
const acknowledgement = schema<true>(value => value === true)

export interface ShortcutConfig {
  enable: boolean
  key: string
  name: string
  label: string
  from?: string
}
const isShortcut = (value: unknown) =>
  isRecord(value) &&
  typeof value.enable === 'boolean' &&
  isNonemptyString(value.key) &&
  isNonemptyString(value.name) &&
  isSafeKey(value.name) &&
  isString(value.label)

export interface UploaderConfigList {
  configList: (ConfigPatch & { _id: string; _configName: string; _createdAt: number; _updatedAt: number })[]
  defaultId: string
}
const uploaderList = schema<UploaderConfigList>(
  value =>
    isRecord(value) &&
    isString(value.defaultId) &&
    Array.isArray(value.configList) &&
    value.configList.every(
      item =>
        isRecord(item) &&
        isConfig(item) &&
        isNonemptyString(item._id) &&
        isString(item._configName) &&
        typeof item._createdAt === 'number' &&
        typeof item._updatedAt === 'number',
    ),
)

const write = <A extends unknown[], R = true>(
  args: RuntimeSchema<A>,
  result: RuntimeSchema<R> = acknowledgement as unknown as RuntimeSchema<R>,
) => ({ args, result, persistent: true })

/** Persistent routes must be invoked, validated and acknowledged. Notifications remain on SEND. */
export const rpcContracts = {
  PICLIST_SAVE_CONFIG: write(tuple<[config: ConfigPatch]>(isPatch)),
  MANAGE_SAVE_CONFIG: write(tuple<[config: ConfigPatch]>(isPatch)),
  MANAGE_REMOVE_CONFIG: write(
    tuple<[key: string, property: string]>(
      v => isNonemptyString(v) && isSafeKey(v),
      v => isNonemptyString(v) && isSafeKey(v),
    ),
  ),
  WRITE_FILE_CONTENT: write(
    tuple<[file: string, content: string]>(
      v => v === 'data.json' || v === 'manage.json',
      v => {
        if (!isString(v)) return false
        try {
          return isConfig(JSON.parse(v))
        } catch {
          return false
        }
      },
    ),
  ),
  THEME_WRITE_THEME: write(tuple<[file: string, content: string]>(v => isSegment(v) && v.endsWith('.css'), isString)),
  CREATE_SCRIPTS_FILE: write(tuple<[path: string[], content: string]>(isScriptPath, isString)),
  WRITE_SCRIPT_FILE: write(tuple<[path: string[], content: string]>(isScriptPath, isString)),
  DELETE_SCRIPTS_FILE: write(tuple<[path: string[]]>(isScriptPath)),
  UPLOADER_SELECT: write(tuple<[type: string, id: string]>(isUploader, isNonemptyString)),
  UPLOADER_UPDATE_CONFIG: write(
    tuple<[type: string, id: string, config: ConfigPatch]>(isUploader, isNonemptyString, isConfig),
  ),
  UPLOADER_RESET_CONFIG: write(tuple<[type: string, id: string]>(isUploader, isNonemptyString)),
  PICBED_DELETE_CONFIG: write(tuple<[type: string, id: string]>(isUploader, isNonemptyString), uploaderList),
  PICBED_DUPLICATE_CONFIG: write(
    tuple<[type: string, id: string, name: string]>(isUploader, isNonemptyString, isNonemptyString),
    uploaderList,
  ),
  PICLIST_AUTO_START: write(tuple<[enabled: boolean]>(v => typeof v === 'boolean')),
  SET_SHOW_UPDATE_TIP: write(tuple<[visible: boolean]>(v => typeof v === 'boolean')),
  SHORTKEY_UPDATE: write(
    tuple<[config: ShortcutConfig, oldKey: string, from: string]>(isShortcut, isString, isNonemptyString),
  ),
  SHORTKEY_BIND_OR_UNBIND: write(tuple<[config: ShortcutConfig, from: string]>(isShortcut, isNonemptyString)),
} as const

export type RpcAction = keyof typeof rpcContracts
export type RpcArgs<A extends RpcAction> = ReturnType<(typeof rpcContracts)[A]['args']['parse']>
export type RpcData<A extends RpcAction> = ReturnType<(typeof rpcContracts)[A]['result']['parse']>
export type RpcRequest<A extends RpcAction = RpcAction> = A extends RpcAction ? { action: A; args: RpcArgs<A> } : never
export type InvokeRPC = <A extends RpcAction>(action: A, ...args: RpcArgs<A>) => Promise<RpcResult<RpcData<A>>>

export const isRpcAction = (action: string): action is RpcAction => Object.hasOwn(rpcContracts, action)
export const rpcRequestSchema = schema<{ action: string; args: unknown[] }>(
  value => isRecord(value) && isNonemptyString(value.action) && Array.isArray(value.args),
)
export const rpcResultSchema = schema<RpcResult<unknown>>(value => {
  if (!isRecord(value)) return false
  if (value.ok === true) return Object.hasOwn(value, 'data')
  if (value.ok !== false || !isRecord(value.error)) return false
  const { code, message, diagnosticId } = value.error
  return (
    isString(code) &&
    Object.hasOwn(rpcErrorMessages, code) &&
    message === rpcErrorMessages[code as RpcErrorCode] &&
    (diagnosticId === undefined || (isString(diagnosticId) && /^[a-f0-9-]{36}$/.test(diagnosticId)))
  )
})

export function rpcFailure(code: RpcErrorCode, diagnosticId?: string): RpcResult<never> {
  return { ok: false, error: { code, message: rpcErrorMessages[code], ...(diagnosticId ? { diagnosticId } : {}) } }
}

export function unwrapRpcResult<T>(value: unknown, action?: string): T {
  let result: RpcResult<unknown>
  try {
    result = rpcResultSchema.parse(value)
  } catch {
    throw new RpcError('INVALID_RESPONSE')
  }
  if (!result.ok) throw new RpcError(result.error.code, result.error.diagnosticId)
  if (action && isRpcAction(action)) {
    try {
      rpcContracts[action].result.parse(result.data)
    } catch {
      throw new RpcError('INVALID_RESPONSE')
    }
  }
  return result.data as T
}
