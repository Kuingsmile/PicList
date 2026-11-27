import { ipcRenderer } from 'electron'

import { THEME_UPDATE } from '#/constants/ipcChannels'

import { triggerRPC } from './rpc'

function setTheme(mode: string) {
  const m = mode === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', m)
  document.documentElement.classList.toggle('dark', m === 'dark')
  document.documentElement.classList.toggle('light', m === 'light')
}

async function injectCSS(css: string, settings?: IObj) {
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
  el.textContent = css

  const root = document.documentElement
  const enabled = settings?.enableCustomBgImg === true
  root.classList.toggle('custom-background', enabled)
  if (enabled) {
    // CSSOM keeps the image URL and numeric settings out of the theme stylesheet.
    const imageUrl = settings.customBgImgPath
    if (typeof imageUrl === 'string' && imageUrl) {
      root.style.setProperty('--background-image', `url("${CSS.escape(imageUrl)}")`, 'important')
    } else root.style.removeProperty('--background-image')
    const opacity = Number(settings.customBgImgOpacity ?? 0.7)
    const blur = Number(settings.customBgImgBlur ?? 5)
    root.style.setProperty(
      '--background-image-opacity',
      String(Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 0.7),
      'important',
    )
    root.style.setProperty('--background-blur', `${Number.isFinite(blur) ? Math.max(0, blur) : 5}px`, 'important')
  } else {
    root.style.removeProperty('--background-image')
    root.style.removeProperty('--background-image-opacity')
    root.style.removeProperty('--background-blur')
  }
}

export async function bootstrapTheme() {
  try {
    const { mode, css } = (await triggerRPC<{ mode: string; css: string }>('THEME_GET_BOOTSTRAP'))!
    const config = await triggerRPC<IObj>('PICLIST_GET_CONFIG')
    if (document.documentElement) setTheme(mode)
    await injectCSS(css, config?.settings)
  } catch (e) {
    console.error('[theme] bootstrap failed', e)
  }
}

export function onThemeUpdate(callback: (css: string) => void) {
  const subscription = async (_: any, css: string) => {
    const config = await triggerRPC<IObj>('PICLIST_GET_CONFIG')
    await injectCSS(css, config?.settings)
    callback(css)
  }
  ipcRenderer.on(THEME_UPDATE, subscription)
  return () => {
    ipcRenderer.removeListener(THEME_UPDATE, subscription)
  }
}
