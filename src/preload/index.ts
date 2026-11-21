import { contextBridge, webFrame, webUtils } from 'electron'

import { IRPCActionType } from '#/constants/rpcActions'

import { ipcRendererCountListeners, ipcRendererOn, ipcRendererRemoveAllListeners } from './events'
import { nodeBridge } from './nodeBridge'
import { invokeRPC, sendRPC, sendToMain, triggerRPC } from './rpc'
import { bootstrapTheme, onThemeUpdate } from './theme'

void bootstrapTheme()

try {
  contextBridge.exposeInMainWorld('electron', {
    setVisualZoomLevelLimits: (min: number, max: number) => {
      webFrame.setVisualZoomLevelLimits(min, max)
    },
    clipboard: {
      writeText: (text: string) => triggerRPC<void>(IRPCActionType.CLIPBOARD_WRITE_TEXT, text),
    },
    platform: process.platform,
    triggerRPC,
    invokeRPC,
    sendToMain,
    sendRPC,
    ipcRendererOn,
    ipcRendererCountListeners,
    ipcRendererRemoveAllListeners,
    showFilePath(file: File) {
      return webUtils.getPathForFile(file)
    },
    onThemeUpdate,
  })
  contextBridge.exposeInMainWorld('node', nodeBridge)
} catch (error) {
  console.error(error)
}
