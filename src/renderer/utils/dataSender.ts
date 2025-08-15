import { getRawData } from '@/utils/common'
import { IRPCActionType } from '@/utils/enum'
import type { IObj } from '#/types/types'

export function saveConfig(config: IObj | string, value?: any) {
  const configObject = typeof config === 'string' ? { [config]: value } : config
  window.electron.sendRPC(IRPCActionType.PICLIST_SAVE_CONFIG, getRawData(configObject))
}

export async function getConfig<T>(key?: string): Promise<T | undefined> {
  return await window.electron.triggerRPC<T>(IRPCActionType.PICLIST_GET_CONFIG, key)
}
