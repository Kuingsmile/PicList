import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'electron-vite'

const sharedAliases = {
  root: resolve('./'),
  '#': resolve('src/shared'),
}
const mainAliases = {
  ...sharedAliases,
  '~': resolve('src/main'),
  apis: resolve('src/main/apis'),
  '@core': resolve('src/main/apis/core'),
}
const rendererAliases = {
  ...sharedAliases,
  '@': resolve('src/renderer'),
}
export default defineConfig({
  main: {
    build: {
      // Bundle these pure-JS clients instead of resolving their many modules at launch.
      externalizeDeps: { exclude: ['got', '@octokit/rest'] },
    },
    resolve: {
      alias: mainAliases,
    },
  },
  preload: {
    build: {
      // Each window runs the preload: avoid loading Vue, YAML and MIME from disk again.
      externalizeDeps: false,
    },
    plugins: [],
    resolve: {
      alias: sharedAliases,
    },
  },
  renderer: {
    root: resolve('src/renderer'),
    base: './',
    resolve: {
      alias: rendererAliases,
      dedupe: [
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/search',
        '@codemirror/lang-javascript',
        '@codemirror/lang-css',
        '@codemirror/lang-json',
        '@codemirror/theme-one-dark',
        'codemirror',
      ],
    },
    optimizeDeps: {
      include: [
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/search',
        '@codemirror/lang-javascript',
        '@codemirror/lang-css',
        '@codemirror/lang-json',
        '@codemirror/theme-one-dark',
        'codemirror',
      ],
    },
    plugins: [
      tailwindcss(),
      vue(),
      VueI18nPlugin({
        /* options */
        // locale messages resource pre-compile option
        include: resolve(dirname(fileURLToPath(import.meta.url)), './src/renderer/i18n/locales/**'),
      }),
    ],
    server: {
      host: '127.0.0.1',
      port: 30303,
      strictPort: true,
    },
  },
})
