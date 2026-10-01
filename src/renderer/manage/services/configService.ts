import { invokeRPC, saveWithFeedback } from '@/services/rpcService'
import { IRPCActionType } from '#/constants/rpcActions'

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
