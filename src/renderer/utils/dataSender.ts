// Electron 相关
import { ipcRenderer, IpcRendererEvent } from 'electron'

// 事件常量
import { PICGO_SAVE_CONFIG, PICGO_GET_CONFIG, RPC_ACTIONS } from '#/events/constants'

// UUID
import { v4 as uuid } from 'uuid'

// 枚举类型声明
import { IRPCActionType } from '~/universal/types/enum'

// 公共工具函数
import { getRawData } from './common'

export function saveConfig (config: IObj | string, value?: any) {
  const configObject = typeof config === 'string' ? { [config]: value } : getRawData(config)
  ipcRenderer.send(PICGO_SAVE_CONFIG, configObject)
}

export function getConfig<T> (key?: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    const callbackId = uuid()
    const callback = (event: IpcRendererEvent, config: T | undefined, returnCallbackId: string) => {
      if (returnCallbackId === callbackId) {
        resolve(config)
        ipcRenderer.removeListener(PICGO_GET_CONFIG, callback)
      }
    }
    ipcRenderer.on(PICGO_GET_CONFIG, callback)
    ipcRenderer.send(PICGO_GET_CONFIG, key, callbackId)
  })
}

/**
   * trigger RPC action
   * TODO: create an isolate rpc handler
   */
export function triggerRPC<T> (action: IRPCActionType, ...args: any[]): Promise<T | null> {
  return new Promise((resolve) => {
    const callbackId = uuid()
    const callback = (event: IpcRendererEvent, data: T | null, returnActionType: IRPCActionType, returnCallbackId: string) => {
      if (returnCallbackId === callbackId && returnActionType === action) {
        resolve(data)
        ipcRenderer.removeListener(RPC_ACTIONS, callback)
      }
    }
    const data = getRawData(args)
    ipcRenderer.on(RPC_ACTIONS, callback)
    ipcRenderer.send(RPC_ACTIONS, action, data, callbackId)
  })
}

/**
 * send a rpc request & do not need to wait for the response
 *
 * or the response will be handled by other listener
 */
export function sendRPC (action: IRPCActionType, ...args: any[]): void {
  const data = getRawData(args)
  ipcRenderer.send(RPC_ACTIONS, action, data)
}

/**
 * @deprecated will be replaced by sendRPC in the future
 */
export function sendToMain (channel: string, ...args: any[]) {
  const data = getRawData(args)
  ipcRenderer.send(channel, ...data)
}
