// Vue 组件选项
import { ComponentOptions } from 'vue'

// 事件常量
import { FORCE_UPDATE, GET_PICBEDS } from '~/universal/events/constants'

// 事件总线
import bus from '~/renderer/utils/bus'

// Electron 相关
import { ipcRenderer } from 'electron'

export const mainMixin: ComponentOptions = {
  inject: ['forceUpdateTime'],

  created () {
    // FIXME: may be memory leak
    this?.$watch('forceUpdateTime', (newVal: number, oldVal: number) => {
      if (oldVal !== newVal) {
        this?.$forceUpdate()
      }
    })
  },

  methods: {
    forceUpdate () {
      bus.emit(FORCE_UPDATE)
    },
    getPicBeds () {
      ipcRenderer.send(GET_PICBEDS)
    }
  }
}
