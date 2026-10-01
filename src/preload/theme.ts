import { ipcRenderer } from 'electron'

import { THEME_UPDATE } from '#/constants/ipcChannels'

import { triggerRPC } from './rpc'

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

function getThemeConfig(allConfig?: IObj) {
  const enableCustomBgImg = allConfig?.settings?.enableCustomBgImg || false
  const customBgImgPath = allConfig?.settings?.customBgImgPath || ''
  const customBgOpacity = allConfig?.settings?.customBgImgOpacity || '0.7'
  const customBgBlur = allConfig?.settings?.customBgImgBlur || 5
  return enableCustomBgImg ? { imageUrl: customBgImgPath, opacity: customBgOpacity, blur: `${customBgBlur}px` } : {}
}

export async function bootstrapTheme() {
  try {
    const { mode, css } = (await triggerRPC<{ mode: string; css: string }>('THEME_GET_BOOTSTRAP'))!
    const config = getThemeConfig(await triggerRPC<IObj>('PICLIST_GET_CONFIG'))
    if (document.documentElement) setTheme(mode)
    if (css) await injectCSS(css, config)
  } catch (e) {
    console.error('[theme] bootstrap failed', e)
  }
}

export function onThemeUpdate(callback: (css: string) => void) {
  const subscription = async (_: any, css: string) => {
    const config = getThemeConfig(await triggerRPC<IObj>('PICLIST_GET_CONFIG'))
    injectCSS(css, config)
    callback(css)
  }
  ipcRenderer.on(THEME_UPDATE, subscription)
  return () => {
    ipcRenderer.removeListener(THEME_UPDATE, subscription)
  }
}
