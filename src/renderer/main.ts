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
import VueLazyLoad from 'vue3-lazyload'
import vue3PhotoPreview from 'vue3-photo-preview'

import App from '@/App.vue'
import { T } from '@/i18n/index'
import router from '@/router'
import { store } from '@/store'
import { initTalkingData } from '@/utils/analytic'
import db from '@/utils/db'

window.electron.setVisualZoomLevelLimits(1, 1)

const app = createApp(App)

app.config.globalProperties.$$db = db
app.config.globalProperties.$T = T
app.config.globalProperties.triggerRPC = window.electron.triggerRPC
app.config.globalProperties.sendRPC = window.electron.sendRPC
app.config.globalProperties.sendToMain = window.electron.sendToMain

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(VueLazyLoad, {
  loading: 'file://loading.jpg',
  error: 'file://unknown-file-type.svg',
  delay: 500
})
app.use(ElementUI)
app.use(router)
app.use(store)
app.use(vue3PhotoPreview)
app.use(pinia)
app.use(hljsVuePlugin)
app.use(VueVideoPlayer)
app.mount('#app')

initTalkingData()
