/// <reference types="vitest/config" />
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'electron-vite'

const alias = {
  '@': resolve('src/renderer'),
  '~': resolve('src/main'),
  root: resolve('./'),
  '#': resolve('src/universal'),
  apis: resolve('src/main/apis'),
  '@core': resolve('src/main/apis/core'),
}
export default defineConfig({
  main: {
    build: {
      externalizeDeps: true,
    },
    resolve: {
      alias,
    },
  },
  preload: {
    build: {
      externalizeDeps: true,
    },
    plugins: [],
    resolve: {
      alias,
    },
  },
  renderer: {
    root: resolve('src/renderer'),
    base: './',
    resolve: {
      alias,
    },
    plugins: [
      vue(),
      VueI18nPlugin({
        /* options */
        // locale messages resource pre-compile option
        include: resolve(dirname(fileURLToPath(import.meta.url)), './src/renderer/i18n/locales/**'),
      }),
    ],
    server: {
      port: 30303,
    },
  },
})
