<template>
  <div id="app" :key="pageReloadCount">
    <router-view />
    <div class="bg-images" />
    <UIServiceProvider />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount } from 'vue'

import UIServiceProvider from '@/components/ui/UIServiceProvider.vue'
import { useATagClick } from '@/hooks/useATagClick'
import { pageReloadCount, usePicBed } from '@/hooks/useGlobal'

useATagClick()

const { updatePicBeds } = usePicBed()

onBeforeMount(() => {
  updatePicBeds()
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

.bg-images {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-image: var(--background-image);
  background-repeat: no-repeat, no-repeat;
  opacity: var(--background-image-opacity);
  filter: var(--background-blur);
  z-index: -1;
  pointer-events: none;
}
</style>
