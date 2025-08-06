<template>
  <div
    id="app"
    :key="pageReloadCount"
  >
    <router-view />
    <UIServiceProvider />
  </div>
</template>

<script lang="ts" setup>
import type { IConfig } from 'piclist'
import { onBeforeMount, onMounted } from 'vue'

import UIServiceProvider from '@/components/ui/UIServiceProvider.vue'
import { useStore } from '@/hooks/useStore'
import { getConfig } from '@/utils/dataSender'
import { pageReloadCount } from '@/utils/global'

import { useAppStore } from './hooks/useAppStore'

const store = useStore()
const appStore = useAppStore()

onBeforeMount(async () => {
  const config = await getConfig<IConfig>()
  if (config) {
    store?.setDefaultPicBed(config?.picBed?.uploader || config?.picBed?.current || 'smms')
  }
})

onMounted(async () => {
  try {
    appStore.init()
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
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
