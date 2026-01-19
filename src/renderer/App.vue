<template>
  <div id="layout" :key="pageReloadCount" class="h-full select-none">
    <router-view />
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
