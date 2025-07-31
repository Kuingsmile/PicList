import crypto from 'node:crypto'
import https from 'node:https'
import path from 'node:path'

import { Octokit } from '@octokit/rest'
import OSS from 'ali-oss'
import axios from 'axios'
import COS from 'cos-nodejs-sdk-v5'
import { clipboard } from 'electron'
import fs from 'fs-extra'
import yaml from 'js-yaml'
import mime from 'mime-types'
import qiniu from 'qiniu'
import Upyun from 'upyun'
import { VNode } from 'vue'
import { AuthType, createClient } from 'webdav'

import { IpcRendererListener } from '#/types/electron'
import { IRPCActionType } from '#/types/enum'
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
      setVisualZoomLevelLimits: (min: number, max: number) => void
      sendRpcSync: (action: IRPCActionType, ...args: any[]) => any
      triggerRPC: <T>(action: IRPCActionType, ...args: any[]) => Promise<T | undefined>
      sendToMain: (channel: string, ...args: any[]) => void
      sendRPC: (action: IRPCActionType, ...args: any[]) => void
      ipcRendererOn: (channel: string, listener: IpcRendererListener) => void
      ipcRendererRemoveListener: (channel: string, listener: IpcRendererListener) => void
      clipboard: {
        writeText: typeof clipboard.writeText
      }
    }
    node: {
      path: {
        join: typeof path.join
        dirname: typeof path.dirname
        basename: typeof path.basename
        normalize: typeof path.normalize
        extname: typeof path.extname
        sep: typeof path.sep,
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
      https: {
        Agent: typeof https.Agent
      }
      qiniu: {
        auth: typeof qiniu.auth
        rs: typeof qiniu.rs
        conf: typeof qiniu.conf
      }
      COS: typeof COS
      OSS: typeof OSS
      Upyun: {
        Service: typeof Upyun.Service
        Client: typeof Upyun.Client
      }
      Octokit: typeof Octokit
      axios: {
        get: typeof axios.get
        delete: typeof axios.delete
        post: typeof axios.post
      }
      yaml: {
        load: typeof yaml.load
      }
      mime: {
        lookup: typeof mime.lookup
      }
      webdav: {
        createClient: typeof createClient
        AuthType: typeof AuthType
      }
    }
    i18n: {
      setLocales: (lang: string, locales: ILocales) => void
      translate: (key: ILocalesKey, args?: IStringKeyMap) => string
    }
    TDAPP: {
      onEvent: (EventId: string, Label?: string, MapKv?: IStringKeyMap) => void
    }
  }
}
