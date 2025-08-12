/// <reference types="vitest/config" />
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin()
    ],
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
        '~': resolve('src/main'),
        root: resolve('./'),
        '#': resolve('src/universal'),
        apis: resolve('src/main/apis'),
        '@core': resolve('src/main/apis/core')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin(),
      VueI18nPlugin({
      /* options */
      // locale messages resource pre-compile option
        include: resolve(dirname(fileURLToPath(import.meta.url)), './src/renderer/i18n/locales/**')
      })
    ],
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
        '~': resolve('src/main'),
        root: resolve('./'),
        '#': resolve('src/universal')
      }
    }
  },
  renderer: {
    root: resolve('src/renderer'),
    base: './',
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
        '~': resolve('src/main'),
        root: resolve('./'),
        '#': resolve('src/universal')
      }
    },
    plugins: [vue()],
    server: {
      port: 3000
    }
  }
})
