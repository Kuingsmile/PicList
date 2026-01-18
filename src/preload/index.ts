import crypto from 'node:crypto'
import path from 'node:path'

import { clipboard, contextBridge, ipcRenderer, IpcRendererEvent, webFrame, webUtils } from 'electron'
import fs from 'fs-extra'
import mime from 'mime'
import { isProxy, isRef, toRaw, unref } from 'vue'
import yaml from 'yaml'

export const getRawData = (args: any): any => {
  if (args === null || typeof args !== 'object') {
    return args
  }
  const raw = isRef(args) ? unref(args) : isProxy(args) ? toRaw(args) : args
  if (raw instanceof Date) return new Date(raw)
  if (raw instanceof RegExp) return new RegExp(raw)
  if (raw instanceof Map) {
    const result = new Map()
    raw.forEach((value, key) => {
      result.set(getRawData(key), getRawData(value))
    })
    return result
  }
  if (raw instanceof Set) {
    const result = new Set()
    raw.forEach(value => {
      result.add(getRawData(value))
    })
    return result
  }
  if (Array.isArray(raw)) {
    return raw.map(item => getRawData(item))
  }
  if (typeof raw === 'object') {
    const data: Record<string, any> = {}
    for (const key in raw) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        data[key] = getRawData(raw[key])
      }
    }
    return data
  }
  return raw
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
      parse: yaml.parseDocument,
    },
    mime: {
      lookup: mime.getType.bind(mime),
    },
    buffer: {
      from: Buffer.from,
    },
  })
} catch (error) {
  console.error(error)
}
