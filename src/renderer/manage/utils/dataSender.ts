import { IRPCActionType } from '@/utils/enum'
import { invokeRPC, saveWithFeedback } from '@/utils/rpc'

export function saveConfig(config: IObj | string, value?: any) {
  const configObj = typeof config === 'string' ? { [config]: value } : config
  return saveWithFeedback(() => invokeRPC(IRPCActionType.MANAGE_SAVE_CONFIG, configObj))
}

export async function getConfig<T>(key?: string): Promise<T | undefined> {
  return await window.electron.triggerRPC<T>(IRPCActionType.MANAGE_GET_CONFIG, key)
}

export function removeConfig(key: string, propName: string) {
  return saveWithFeedback(() => invokeRPC(IRPCActionType.MANAGE_REMOVE_CONFIG, key, propName))
}
