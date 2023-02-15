import { ipcRenderer, IpcRendererEvent } from 'electron'
import { PICLIST_MANAGE_GET_CONFIG, PICLIST_MANAGE_SAVE_CONFIG, PICLIST_MANAGE_REMOVE_CONFIG } from '~/main/manage/events/constants'
import { v4 as uuid } from 'uuid'
import { getRawData } from '~/renderer/utils/common'

export function getConfig<T> (key?: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    const callbackId = uuid()
    const callback = (event: IpcRendererEvent, config: T | undefined, returnCallbackId: string) => {
      if (returnCallbackId === callbackId) {
        resolve(config)
        ipcRenderer.removeListener(PICLIST_MANAGE_GET_CONFIG, callback)
      }
    }
    ipcRenderer.on(PICLIST_MANAGE_GET_CONFIG, callback)
    ipcRenderer.send(PICLIST_MANAGE_GET_CONFIG, key, callbackId)
  })
}

export function saveConfig (_config: IObj | string, value?: any) {
  let config
  if (typeof _config === 'string') {
    config = {
      [_config]: value
    }
  } else {
    config = getRawData(_config)
  }
  ipcRenderer.send(PICLIST_MANAGE_SAVE_CONFIG, config)
}

export function removeConfig (key: string, propName: string) {
  ipcRenderer.send(PICLIST_MANAGE_REMOVE_CONFIG, key, propName)
}

export function sendToMain (channel: string, ...args: any[]) {
  const data = getRawData(args)
  ipcRenderer.send(channel, ...data)
}

export function invokeToMain (channel: string, ...args: any[]) {
  const data = getRawData(args)
  return ipcRenderer.invoke(channel, ...data)
}
