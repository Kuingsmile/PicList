import {
  IpcMainEvent,
  ipcMain
} from 'electron'
import getManageApi from '../Main'
import { PICLIST_MANAGE_GET_CONFIG, PICLIST_MANAGE_SAVE_CONFIG, PICLIST_MANAGE_REMOVE_CONFIG } from './constants'

const manageApi = getManageApi()

const handleManageGetConfig = () => {
  ipcMain.on(PICLIST_MANAGE_GET_CONFIG, (event: IpcMainEvent, key: string | undefined, callbackId: string) => {
    const result = manageApi.getConfig(key)
    event.sender.send(PICLIST_MANAGE_GET_CONFIG, result, callbackId)
  })
}

const handleManageSaveConfig = () => {
  ipcMain.on(PICLIST_MANAGE_SAVE_CONFIG, (_event: IpcMainEvent, data: any) => {
    manageApi.saveConfig(data)
  })
}

const handleManageRemoveConfig = () => {
  ipcMain.on(PICLIST_MANAGE_REMOVE_CONFIG, (_event: IpcMainEvent, key: string, propName: string) => {
    manageApi.removeConfig(key, propName)
  })
}

export default {
  listen () {
    handleManageGetConfig()
    handleManageSaveConfig()
    handleManageRemoveConfig()
  }
}
