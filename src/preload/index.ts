import crypto from 'node:crypto'
import path from 'node:path'

import { clipboard, contextBridge, ipcRenderer, IpcRendererEvent, webFrame, webUtils } from 'electron'
import fs from 'fs-extra'
import yaml from 'js-yaml'
import mime from 'mime'
import { isReactive, isRef, toRaw, unref } from 'vue'

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

function sendToMain(channel: string, ...args: any[]) {
  ipcRenderer.send(channel, ...getRawData(args))
}

function sendRPC(action: string, ...args: any[]): void {
  ipcRenderer.send('RPC_ACTIONS', action, getRawData(args))
}

async function triggerRPC<T>(action: string, ...args: any[]): Promise<T | undefined> {
  return await ipcRenderer.invoke('RPC_ACTIONS_INVOKE', action, getRawData(args))
}

function sendRpcSync(action: string, ...args: any[]): any {
  return ipcRenderer.sendSync('RPC_ACTIONS', action, getRawData(args))
}

try {
  contextBridge.exposeInMainWorld('electron', {
    setVisualZoomLevelLimits: (min: number, max: number) => {
      webFrame.setVisualZoomLevelLimits(min, max)
    },
    clipboard: {
      writeText: clipboard.writeText,
    },
    platform: process.platform,
    sendRpcSync,
    triggerRPC,
    sendToMain,
    sendRPC,
    ipcRendererOn: (channel: string, listener: (...args: any[]) => void) => {
      const subscription = (_: IpcRendererEvent, ...args: any[]) => listener(...args)
      ipcRenderer.on(channel, subscription)
      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    },
    ipcRendererCountListeners: (channel: string): number => {
      return ipcRenderer.listenerCount(channel)
    },
    ipcRendererRemoveAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    },
    showFilePath(file: File) {
      return webUtils.getPathForFile(file)
    },
  })

  contextBridge.exposeInMainWorld('node', {
    path: {
      join: path.join,
      dirname: path.dirname,
      basename: path.basename,
      normalize: path.normalize,
      extname: path.extname,
      sep: path.sep,
      posix: {
        sep: path.posix.sep,
      },
    },
    fs: {
      remove: fs.remove,
      readFile: fs.readFile,
      statSync: fs.statSync,
    },
    crypto: {
      randomBytes: crypto.randomBytes,
      createHash: crypto.createHash,
    },
    yaml: {
      load: yaml.load,
    },
    mime: {
      lookup: mime.getType,
    },
    buffer: {
      from: Buffer.from,
    },
  })
} catch (error) {
  console.error(error)
}
