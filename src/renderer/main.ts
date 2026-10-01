import './index.css'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import VueLazyLoad from 'vue3-lazyload'

import App from '@/App.vue'
import { getInitialLocale } from '@/i18n/locale'
import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh-CN.json'
import zhTW from '@/i18n/locales/zh-TW.json'
import router from '@/router'
import db from '@/services/galleryDatabase'
import { store } from '@/stores/appStore'

type MessageSchema = typeof zhCN

window.electron.setVisualZoomLevelLimits(1, 1)
const userLanguage = navigator.language || 'zh-CN'

const app = createApp(App)

app.config.globalProperties.$$db = db
app.config.globalProperties.triggerRPC = window.electron.triggerRPC
app.config.globalProperties.sendRPC = window.electron.sendRPC
app.config.globalProperties.sendToMain = window.electron.sendToMain

const i18n = createI18n<[MessageSchema], 'en' | 'zh-CN' | 'zh-TW', false>({
  legacy: false,
  locale: getInitialLocale(localStorage.getItem('currentLanguage'), userLanguage),
  fallbackLocale: 'zh-CN',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
  },
})
watch(
  i18n.global.locale,
  locale => {
    document.documentElement.lang = locale
  },
  { immediate: true },
)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(VueLazyLoad, {
  loading: './loading.jpg',
  error: './unknown-file-type.svg',
  delay: 500,
})
app.use(i18n)
app.use(router)
app.use(store)
app.use(pinia)
app.mount('#app')
