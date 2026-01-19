<template>
  <div id="layout" :key="pageReloadCount" class="h-full select-none">
    <router-view />
    <div
      class="pointer-events-none absolute inset-0 -z-1 bg-custom bg-cover bg-fixed bg-center bg-no-repeat opacity-custom blur-custom"
    />
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
