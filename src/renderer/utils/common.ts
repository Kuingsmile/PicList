import { ipcRenderer } from 'electron'
import { isReactive, isRef, toRaw, unref } from 'vue'

import { RPC_ACTIONS, RPC_ACTIONS_INVOKE } from '#/events/constants'
import { IRPCActionType } from '#/types/enum'

export const handleTalkingDataEvent = (data: ITalkingDataOptions) => {
  try {
    const { EventId, Label = '', MapKv = {} } = data
    MapKv.from = window.location.href
    window.TDAPP.onEvent(EventId, Label, MapKv)
  } catch (e) {
    console.error(e)
  }
}

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  if (isRef(args)) return unref(args)
  if (isReactive(args)) return toRaw(args)
  if (Array.isArray(args)) return args.map(getRawData)
  if (typeof args === 'object' && args !== null) {
    const data = {} as Record<string, any>
    for (const key in args) {
      data[key] = getRawData(args[key])
    }
    return data
  }
  return args
}

export function sendToMain(channel: string, ...args: any[]) {
  const data = getRawData(args)
  ipcRenderer.send(channel, ...data)
}

export function sendRPC(action: IRPCActionType, ...args: any[]): void {
  ipcRenderer.send(RPC_ACTIONS, action, getRawData(args))
}

export function sendRpcSync(action: IRPCActionType, ...args: any[]) {
  return ipcRenderer.sendSync(RPC_ACTIONS, action, getRawData(args))
}

export async function triggerRPC<T>(action: IRPCActionType, ...args: any[]): Promise<T | undefined> {
  return await ipcRenderer.invoke(RPC_ACTIONS_INVOKE, action, getRawData(args))
}
