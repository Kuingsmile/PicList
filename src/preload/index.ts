// TODO axios
import crypto from 'node:crypto'
import path from 'node:path'

import { I18n, ObjectAdapter } from '@piclist/i18n'
import { clipboard, contextBridge, ipcRenderer, webFrame } from 'electron'
import fs from 'fs-extra'
import yaml from 'js-yaml'
import mime from 'mime-types'
import { isReactive, isRef, toRaw, unref } from 'vue'

import { RPC_ACTIONS, RPC_ACTIONS_INVOKE } from '#/events/constants'
import { IpcRendererListener } from '#/types/electron'
import { IRPCActionType } from '#/types/enum'
import { ILocales, ILocalesKey } from '#/types/i18n'
import { IStringKeyMap } from '#/types/types'

let i18nObj: I18n | null = null

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

function sendToMain (channel: string, ...args: any[]) {
  ipcRenderer.send(channel, ...getRawData(args))
}

function sendRPC (action: IRPCActionType, ...args: any[]): void {
  ipcRenderer.send(RPC_ACTIONS, action, getRawData(args))
}

async function triggerRPC<T> (action: IRPCActionType, ...args: any[]): Promise<T | undefined> {
  return await ipcRenderer.invoke(RPC_ACTIONS_INVOKE, action, getRawData(args))
}

function sendRpcSync (action: IRPCActionType, ...args: any[]): any {
  return ipcRenderer.sendSync(RPC_ACTIONS, action, getRawData(args))
}

try {
  contextBridge.exposeInMainWorld('electron', {
    setVisualZoomLevelLimits: (min: number, max: number) => {
      webFrame.setVisualZoomLevelLimits(min, max)
    },
    clipboard: {
      writeText: clipboard.writeText
    },
    sendRpcSync,
    triggerRPC,
    sendToMain,
    sendRPC,
    ipcRendererOn: (channel: string, listener: IpcRendererListener) => {
      ipcRenderer.on(channel, listener)
    },
    ipcRendererRemoveListener: (channel: string, listener: IpcRendererListener) => {
      ipcRenderer.removeListener(channel, listener)
    }
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
        sep: path.posix.sep
      }
    },
    fs: {
      remove: fs.remove,
      readFile: fs.readFile,
      statSync: fs.statSync
    },
    crypto: {
      randomBytes: crypto.randomBytes,
      createHash: crypto.createHash
    },
    yaml: {
      load: yaml.load
    },
    mime: {
      lookup: mime.lookup
    }
  })

  contextBridge.exposeInMainWorld('i18n', {
    setLocales: (lang: string, locales: ILocales) => {
      const objectAdapter = new ObjectAdapter({
        [lang]: locales
      })
      i18nObj = new I18n({
        adapter: objectAdapter,
        defaultLanguage: lang
      })
    },
    translate: (key: ILocalesKey, args: IStringKeyMap = {}): string => {
      return i18nObj?.translate(key, args) || key
    }
  })
} catch (error) {
  console.error(error)
}
