<template>
  <div id="app" :key="pageReloadCount">
    <router-view />
    <UIServiceProvider />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, onMounted } from 'vue'

import UIServiceProvider from '@/components/ui/UIServiceProvider.vue'
import { useAppStore } from '@/hooks/useAppStore'
import { useATagClick } from '@/hooks/useATagClick'
import { pageReloadCount, usePicBed } from '@/hooks/useGlobal'

useATagClick()

const appStore = useAppStore()
const { updatePicBeds } = usePicBed()

onBeforeMount(() => {
  updatePicBeds()
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
  name: 'PicList',
}
</script>

<style lang="stylus">
body,
html
  padding 0
  margin 0
  height 100%
#app
  height 100%
  user-select none
</style>
