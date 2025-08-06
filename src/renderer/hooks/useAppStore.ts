import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { IStringKeyMap } from '#/types/types'

export const useAppStore = defineStore('app', () => {
  const settings = ref<IStringKeyMap>({
    app: {
      theme: 'light'
    }
  })
  const loading = ref(false)
  const error = ref<string | undefined>()

  function clearError () {
    error.value = undefined
  }

  const loadSettings = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      settings.value.app.theme = savedTheme
    }
    applyTheme(settings.value.app.theme || 'light')
  }

  function applyTheme (theme: string) {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'auto')

    if (theme === 'auto') {
      root.classList.add('auto')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', e => {
        if (settings.value.app.theme === 'auto') {
          root.classList.remove('light', 'dark')
          root.classList.add(e.matches ? 'dark' : 'light')
        }
      })
    } else {
      root.classList.add(theme)
    }
  }

  function setTheme (theme: 'light' | 'dark' | 'auto') {
    settings.value.app.theme = theme
    localStorage.setItem('theme', theme)
    applyTheme(theme)
  }

  function toggleTheme () {
    const currentTheme = settings.value.app.theme || 'light'
    const themes = ['light', 'dark', 'auto'] as const
    const currentIndex = themes.indexOf(currentTheme as any)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  function init () {
    try {
      loadSettings()
    } catch (err) {
      console.error('Application initialization failed:', err)
      throw err
    }
  }

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
