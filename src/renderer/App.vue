<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts" setup>
// 状态管理
import { useStore } from '@/hooks/useStore'

// Vue 生命周期钩子
import { onBeforeMount, onMounted, onUnmounted } from 'vue'

// 数据发送工具函数
import { getConfig } from './utils/dataSender'

// 类型声明
import type { IConfig } from 'piclist'

// 其他工具
import bus from './utils/bus'
import { FORCE_UPDATE } from '~/universal/events/constants'
import { useATagClick } from './hooks/useATagClick'

useATagClick()
const store = useStore()
onBeforeMount(async () => {
  const config = await getConfig<IConfig>()
  if (config) {
    store?.setDefaultPicBed(config?.picBed?.uploader || config?.picBed?.current || 'smms')
  }
})

onMounted(() => {
  bus.on(FORCE_UPDATE, () => {
    store?.updateForceUpdateTime()
  })
})

onUnmounted(() => {
  bus.off(FORCE_UPDATE)
})

</script>

<script lang="ts">
export default {
  name: 'PicGoApp'
}
</script>

<style lang="stylus">
  body,
  html
    padding 0
    margin 0
    height 100%
    font-family "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif
  #app
    height 100%
    user-select none
    overflow hidden
  .el-button-group
    width 100%
    .el-button
      width 50%
</style>
