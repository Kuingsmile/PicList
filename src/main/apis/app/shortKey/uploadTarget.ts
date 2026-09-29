import { RpcError } from '#/rpc'
import type { ShortcutTarget, UploadShortcutAction } from '#/shortcuts'

/** Core selects profiles by name; resolve the saved ID every time and refuse ambiguous names. */
export function resolveShortcutUploadTarget(action: UploadShortcutAction, targets: ShortcutTarget[]) {
  const target = targets.find(item => item.picBed === action.picBed && item.configId === action.configId)
  if (!target || !target.configName) throw new RpcError('SHORTCUT_TARGET_MISSING')
  if (targets.filter(item => item.picBed === target.picBed && item.configName === target.configName).length !== 1) {
    throw new RpcError('SHORTCUT_TARGET_AMBIGUOUS')
  }
  return { picBed: target.picBed, configName: target.configName }
}
