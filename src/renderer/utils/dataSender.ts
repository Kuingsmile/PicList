import { getRawData } from '@/utils/common'
import { IRPCActionType } from '@/utils/enum'
import { invokeRPC, saveWithFeedback } from '@/utils/rpc'

export function saveConfig(config: IObj | string, value?: any): Promise<boolean> {
  const configObject = typeof config === 'string' ? { [config]: value } : config
  return saveWithFeedback(() => invokeRPC(IRPCActionType.PICLIST_SAVE_CONFIG, getRawData(configObject)))
}

export async function getConfig<T>(key?: string): Promise<T | undefined> {
  return await window.electron.triggerRPC<T>(IRPCActionType.PICLIST_GET_CONFIG, key)
}
