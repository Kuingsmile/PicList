import { IRPCActionType } from '#/types/enum'
import { IObj } from '#/types/types'

export function saveConfig (config: IObj | string, value?: any) {
  const configObject = typeof config === 'string' ? { [config]: value } : config
  window.electron.sendRPC(IRPCActionType.PICLIST_SAVE_CONFIG, configObject)
}

export async function getConfig<T> (key?: string): Promise<T | undefined> {
  return await window.electron.triggerRPC<T>(IRPCActionType.PICLIST_GET_CONFIG, key)
}
