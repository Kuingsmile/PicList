import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'

import type { IStringKeyMap } from '#/types/types'

export const useAppStore = defineStore('app', () => {
  const settings = ref<IStringKeyMap>({
    app: {
      theme: 'light'
    }
  })
  const loading = ref(false)
  const error = ref<string | undefined>()

  // Track media query listener for cleanup
  let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null
  let mediaQuery: MediaQueryList | null = null

  function clearError() {
    error.value = undefined
  }

  const loadSettings = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      settings.value.app.theme = savedTheme
    }
    applyTheme(settings.value.app.theme || 'light')
  }

  function cleanupMediaQueryListener() {
    if (mediaQuery && mediaQueryListener) {
      mediaQuery.removeEventListener('change', mediaQueryListener)
      mediaQuery = null
      mediaQueryListener = null
    }
  }

  function applyTheme(theme: string) {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'auto')

    // Clean up existing listener before adding new one
    cleanupMediaQueryListener()

    if (theme === 'auto') {
      root.classList.add('auto')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')

      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQueryListener = (e: MediaQueryListEvent) => {
        if (settings.value.app.theme === 'auto') {
          root.classList.remove('light', 'dark')
          root.classList.add(e.matches ? 'dark' : 'light')
        }
      }
      mediaQuery.addEventListener('change', mediaQueryListener)
    } else {
      root.classList.add(theme)
    }
  }

  function setTheme(theme: 'light' | 'dark' | 'auto') {
    settings.value.app.theme = theme
    localStorage.setItem('theme', theme)
    applyTheme(theme)
  }

  function toggleTheme() {
    const currentTheme = settings.value.app.theme || 'light'
    const themes = ['light', 'dark', 'auto'] as const
    const currentIndex = themes.indexOf(currentTheme as any)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  function init() {
    try {
      loadSettings()
    } catch (err) {
      console.error('Application initialization failed:', err)
      throw err
    }
  }

  // Clean up when store is unmounted
  onUnmounted(() => {
    cleanupMediaQueryListener()
  })

  return {
    init,
    loadSettings,
    settings,
    loading,
    error,
    clearError,
    setTheme,
    toggleTheme,
    applyTheme
  }
})
