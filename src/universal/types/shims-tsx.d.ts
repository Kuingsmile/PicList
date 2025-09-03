// src/global.d.ts

import crypto from 'node:crypto'
import path from 'node:path'

import { clipboard } from 'electron'
import fs from 'fs-extra'
import yaml from 'js-yaml'
import mime from 'mime'
import { VNode } from 'vue'

import { ILocales, ILocalesKey } from '#/types/i18n'
import { IStringKeyMap } from '#/types/types'

declare global {
  export namespace JSX {
    export interface Element extends VNode {}
    export interface IntrinsicElements {
      [elem: string]: any
    }
  }
  export interface Window {
    electron: {
      platform: string
      setVisualZoomLevelLimits: (min: number, max: number) => void
      sendRpcSync: (action: string, ...args: any[]) => any
      triggerRPC: <T>(action: string, ...args: any[]) => Promise<T | undefined>
      sendToMain: (channel: string, ...args: any[]) => void
      sendRPC: (action: string, ...args: any[]) => void
      ipcRendererOn: (channel: string, listener: (...args: any[]) => void) => () => void
      ipcRendererCountListeners: (channel: string) => number
      ipcRendererRemoveAllListeners: (channel: string) => void
      clipboard: {
        writeText: typeof clipboard.writeText
      }
      showFilePath: (file: File) => string
    }
    node: {
      path: {
        join: typeof path.join
        dirname: typeof path.dirname
        basename: typeof path.basename
        normalize: typeof path.normalize
        extname: typeof path.extname
        sep: typeof path.sep
        posix: {
          sep: typeof path.posix.sep
        }
      }
      crypto: {
        randomBytes: typeof crypto.randomBytes
        createHash: typeof crypto.createHash
      }
      fs: {
        remove: typeof fs.remove
        readFile: typeof fs.readFile
        statSync: typeof fs.statSync
      }

      yaml: {
        load: typeof yaml.load
      }
      mime: {
        lookup: typeof mime.getType
      }
      buffer: {
        from: typeof Buffer.from
      }
    }
    i18n: {
      setLocales: (lang: string, locales: ILocales) => void
      translate: (key: ILocalesKey, args?: IStringKeyMap) => string
    }
  }
}
