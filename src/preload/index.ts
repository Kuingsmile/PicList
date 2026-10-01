import crypto from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { clipboard, contextBridge, ipcRenderer, IpcRendererEvent, webFrame, webUtils } from 'electron'
import fs from 'fs-extra'
import mime from 'mime'
import yaml from 'yaml'

import {
  type InvokeRPC,
  isRpcAction,
  rpcContracts,
  rpcFailure,
  type RpcResult,
  rpcResultSchema,
  unwrapRpcResult,
} from '#/rpc'
import { getRawData } from '#/utils/rawData'

// Initial window state can arrive at did-finish-load before a lazy route subscribes.
// Keep only the latest state for each channel until its first renderer listener.
const pendingWindowMessages = new Map<string, unknown[]>()
const pendingInputBoxes: unknown[][] = []
const windowMessageBuffers = new Map(
  ['clipboardFiles', 'updateFiles', 'SHOW_UPDATE_INFO'].map(channel => {
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
  if (ipcRenderer.listenerCount('SHOW_INPUT_BOX') === 1) pendingInputBoxes.push(args)
}
ipcRenderer.on('SHOW_INPUT_BOX', bufferInputBox)
windowMessageBuffers.set('SHOW_INPUT_BOX', bufferInputBox)
const bufferInputBoxCancellation = (_: IpcRendererEvent, ...args: unknown[]) => {
  const [requestId] = args
  if (typeof requestId !== 'string') return
  for (let index = pendingInputBoxes.length - 1; index >= 0; index--) {
    if (pendingInputBoxes[index][1] === requestId) pendingInputBoxes.splice(index, 1)
  }
}
ipcRenderer.on('CANCEL_INPUT_BOX', bufferInputBoxCancellation)
windowMessageBuffers.set('CANCEL_INPUT_BOX', bufferInputBoxCancellation)

function setTheme(mode: string) {
  const m = mode === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', m)
  document.documentElement.classList.toggle('dark', m === 'dark')
  document.documentElement.classList.toggle('light', m === 'light')
}

async function injectCSS(css: string, config: { imageUrl?: string; opacity?: string; blur?: string }) {
  const id = '__piclist_theme__'
  if (!document.documentElement) {
    await new Promise(resolve => {
      window.addEventListener('DOMContentLoaded', resolve, { once: true })
    })
  }
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    ;(document.head || document.documentElement).appendChild(el)
  }
  const overrides = `
:root, .dark, .light, [data-theme='dark'], [data-theme='light'] {
  ${config.imageUrl ? `--background-image: url("${config.imageUrl}") !important;` : ''}
  ${config.opacity ? `--background-image-opacity: ${config.opacity} !important;` : ''}
  ${config.blur ? `--background-blur: ${config.blur} !important;` : ''}
  --color-background-primary: transparent !important;
  --color-background-secondary: transparent !important;
}
  `
  el.textContent = css + '\n' + overrides
}

;(async () => {
  try {
    const { mode, css } = (await triggerRPC<{ mode: string; css: string }>('THEME_GET_BOOTSTRAP'))!
    const allConfig = await triggerRPC<IObj>('PICLIST_GET_CONFIG')
    const enableCustomBgImg = allConfig?.settings?.enableCustomBgImg || false
    const customBgImgPath = allConfig?.settings?.customBgImgPath || ''
    const customBgOpacity = allConfig?.settings?.customBgImgOpacity || '0.7'
    const customBgBlur = allConfig?.settings?.customBgImgBlur || 5
    const config = enableCustomBgImg
      ? {
          imageUrl: customBgImgPath,
          opacity: customBgOpacity,
          blur: `${customBgBlur}px`,
        }
      : {}
    if (document.documentElement) setTheme(mode)
    if (css) await injectCSS(css, config)
  } catch (e) {
    console.error('[theme] bootstrap failed', e)
  }
})()

function sendToMain(channel: string, ...args: any[]) {
  ipcRenderer.send(channel, ...getRawData(args))
}

function sendRPC(action: string, ...args: any[]): void {
  if (isRpcAction(action)) throw new Error('Persistent operations require invokeRPC and an acknowledgement.')
  ipcRenderer.send('RPC_ACTIONS', action, getRawData(args))
}

async function invokeTransport(action: string, args: unknown[]): Promise<RpcResult<unknown>> {
  if (isRpcAction(action)) {
    try {
      rpcContracts[action].args.parse(args)
    } catch {
      return rpcFailure('INVALID_REQUEST')
    }
  }
  let result: unknown
  try {
    result = await ipcRenderer.invoke('RPC_ACTIONS_INVOKE', action, getRawData(args))
  } catch {
    return rpcFailure('TRANSPORT_ERROR')
  }
  try {
    return rpcResultSchema.parse(result)
  } catch {
    return rpcFailure('INVALID_RESPONSE')
  }
}

const invokeRPC = ((action: string, ...args: unknown[]) => invokeTransport(action, args)) as InvokeRPC

async function triggerRPC<T>(action: string, ...args: any[]): Promise<T | undefined> {
  return unwrapRpcResult<T | undefined>(await invokeTransport(action, args), action)
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
    invokeRPC,
    sendToMain,
    sendRPC,
    ipcRendererOn: (channel: string, listener: (...args: any[]) => void) => {
      const subscription = (_: IpcRendererEvent, ...args: any[]) => listener(...args)
      ipcRenderer.on(channel, subscription)
      const buffer = windowMessageBuffers.get(channel)
      if (buffer) {
        if (channel !== 'SHOW_INPUT_BOX' && channel !== 'CANCEL_INPUT_BOX') {
          ipcRenderer.removeListener(channel, buffer)
          windowMessageBuffers.delete(channel)
        }
        const pending = pendingWindowMessages.get(channel)
        pendingWindowMessages.delete(channel)
        if (channel === 'SHOW_INPUT_BOX') {
          for (const request of pendingInputBoxes.splice(0)) listener(...request)
        } else if (pending) listener(...pending)
      }
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
    onThemeUpdate: (callback: (css: string) => void) => {
      const subscription = async (_: any, css: string) => {
        const allConfig = await triggerRPC<IObj>('PICLIST_GET_CONFIG')
        const enableCustomBgImg = allConfig?.settings?.enableCustomBgImg || false
        const customBgImgPath = allConfig?.settings?.customBgImgPath || ''
        const customBgOpacity = allConfig?.settings?.customBgImgOpacity || '0.7'
        const customBgBlur = allConfig?.settings?.customBgImgBlur || 5
        const config = enableCustomBgImg
          ? {
              imageUrl: customBgImgPath,
              opacity: customBgOpacity,
              blur: `${customBgBlur}px`,
            }
          : {}
        injectCSS(css, config)
        callback(css)
      }
      ipcRenderer.on('THEME_UPDATE', subscription)
      return () => {
        ipcRenderer.removeListener('THEME_UPDATE', subscription)
      }
    },
  })

  contextBridge.exposeInMainWorld('node', {
    pathToFileURL: (filePath: string) => pathToFileURL(filePath).href,
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
      readFileSync: fs.readFileSync,
      statSync: fs.statSync,
    },
    crypto: {
      randomBytes: crypto.randomBytes,
      createHash: (algorithm: string, text: string | Buffer) => crypto.createHash(algorithm).update(text).digest('hex'),
    },
    yaml: {
      parse: yaml.parseDocument,
    },
    mime: {
      lookup: mime.getType.bind(mime),
    },
  })
} catch (error) {
  console.error(error)
}
