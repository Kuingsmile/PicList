import 'element-plus/dist/index.css'
import 'vue3-photo-preview/dist/index.css'
import 'video.js/dist/video-js.css'
import 'highlight.js/styles/stackoverflow-light.css'
import 'highlight.js/lib/common'

import hljsVuePlugin from '@highlightjs/vue-plugin'
import VueVideoPlayer from '@videojs-player/vue'
import ElementUI from 'element-plus'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import VueLazyLoad from 'vue3-lazyload'
import vue3PhotoPreview from 'vue3-photo-preview'

import App from '@/App.vue'
import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh-CN.json'
import zhTW from '@/i18n/locales/zh-TW.json'
import router from '@/router'
import { store } from '@/store'
import db from '@/utils/db'

type MessageSchema = typeof en

window.electron.setVisualZoomLevelLimits(1, 1)

const app = createApp(App)

app.config.globalProperties.$$db = db
app.config.globalProperties.triggerRPC = window.electron.triggerRPC
app.config.globalProperties.sendRPC = window.electron.sendRPC
app.config.globalProperties.sendToMain = window.electron.sendToMain

const i18n = createI18n<MessageSchema, 'en' | 'zh-CN' | 'zh-TW'>({
  locale: localStorage.getItem('currentLanguage') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW
  }
})
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(VueLazyLoad, {
  loading: '/loading.jpg',
  error: '/unknown-file-type.svg',
  delay: 500
})
app.use(i18n)
app.use(ElementUI)
app.use(router)
app.use(store)
app.use(vue3PhotoPreview)
app.use(pinia)
app.use(hljsVuePlugin)
app.use(VueVideoPlayer)
app.mount('#app')
