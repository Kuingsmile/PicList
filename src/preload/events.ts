import { ipcRenderer, type IpcRendererEvent } from 'electron'

import {
  CANCEL_INPUT_BOX,
  CLIPBOARD_FILES,
  SHOW_INPUT_BOX,
  SHOW_UPDATE_INFO,
  UPDATE_FILES,
} from '#/constants/ipcChannels'

// Initial window state can arrive at did-finish-load before a lazy route subscribes.
// Keep only the latest state for each channel until its first renderer listener.
const pendingWindowMessages = new Map<string, unknown[]>()
const pendingInputBoxes: unknown[][] = []
const windowMessageBuffers = new Map(
  [CLIPBOARD_FILES, UPDATE_FILES, SHOW_UPDATE_INFO].map(channel => {
    const buffer = (_: IpcRendererEvent, ...args: unknown[]) => {
      pendingWindowMessages.set(channel, args)
    }
    ipcRenderer.on(channel, buffer)
    return [channel, buffer] as const
  }),
)
// Input requests are individual operations; retaining only the latest would strand earlier plugin dialogs.
const bufferInputBox = (_: IpcRendererEvent, ...args: unknown[]) => {
  // Keep buffering between route mounts as well as during the first renderer startup.
  if (ipcRenderer.listenerCount(SHOW_INPUT_BOX) === 1) pendingInputBoxes.push(args)
}
ipcRenderer.on(SHOW_INPUT_BOX, bufferInputBox)
windowMessageBuffers.set(SHOW_INPUT_BOX, bufferInputBox)
const bufferInputBoxCancellation = (_: IpcRendererEvent, ...args: unknown[]) => {
  const [requestId] = args
  if (typeof requestId !== 'string') return
  for (let index = pendingInputBoxes.length - 1; index >= 0; index--) {
    if (pendingInputBoxes[index][1] === requestId) pendingInputBoxes.splice(index, 1)
  }
}
ipcRenderer.on(CANCEL_INPUT_BOX, bufferInputBoxCancellation)
windowMessageBuffers.set(CANCEL_INPUT_BOX, bufferInputBoxCancellation)

export const ipcRendererOn = (channel: string, listener: (...args: any[]) => void) => {
  const subscription = (_: IpcRendererEvent, ...args: any[]) => listener(...args)
  ipcRenderer.on(channel, subscription)
  const buffer = windowMessageBuffers.get(channel)
  if (buffer) {
    if (channel !== SHOW_INPUT_BOX && channel !== CANCEL_INPUT_BOX) {
      ipcRenderer.removeListener(channel, buffer)
      windowMessageBuffers.delete(channel)
    }
    const pending = pendingWindowMessages.get(channel)
    pendingWindowMessages.delete(channel)
    if (channel === SHOW_INPUT_BOX) {
      for (const request of pendingInputBoxes.splice(0)) listener(...request)
    } else if (pending) listener(...pending)
  }
  return () => {
    ipcRenderer.removeListener(channel, subscription)
  }
}

export const ipcRendererCountListeners = (channel: string): number => {
  return ipcRenderer.listenerCount(channel)
}

export const ipcRendererRemoveAllListeners = (channel: string) => {
  ipcRenderer.removeAllListeners(channel)
}
