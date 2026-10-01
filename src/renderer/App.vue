<template>
  <div id="layout" class="h-full min-h-screen w-full select-none">
    <router-view />
    <UIServiceProvider />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount } from 'vue'

import UIServiceProvider from '@/components/ui/UIServiceProvider.vue'
import { useATagClick } from '@/composables/useATagClick'
import { usePicBed } from '@/composables/useGlobal'

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
