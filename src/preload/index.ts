import crypto from 'node:crypto'
import path from 'node:path'

import { clipboard, contextBridge, ipcRenderer, IpcRendererEvent, webFrame, webUtils } from 'electron'
import fs from 'fs-extra'
import mime from 'mime'
import { isProxy, isRef, toRaw, unref } from 'vue'
import yaml from 'yaml'

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
    const { mode, css } = await ipcRenderer.invoke('RPC_ACTIONS_INVOKE', 'THEME_GET_BOOTSTRAP')
    const allConfig = await ipcRenderer.invoke('RPC_ACTIONS_INVOKE', 'PICLIST_GET_CONFIG', [])
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
    onThemeUpdate: (callback: (css: string) => void) => {
      const subscription = async (_: any, css: string) => {
        const allConfig = await ipcRenderer.invoke('RPC_ACTIONS_INVOKE', 'PICLIST_GET_CONFIG', [])
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
    buffer: {
      from: Buffer.from,
    },
  })
} catch (error) {
  console.error(error)
}
