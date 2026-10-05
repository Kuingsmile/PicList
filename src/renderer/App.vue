<template>
  <div id="layout" class="h-full min-h-screen w-full select-none">
    <router-view />
    <UIServiceProvider />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, onBeforeUnmount } from 'vue'

import UIServiceProvider from '@/components/ui/UIServiceProvider.vue'
import { useATagClick } from '@/composables/useATagClick'
import { usePicBed } from '@/composables/useGlobal'

defineOptions({ name: 'PicList' })

useATagClick()

const { updatePicBeds } = usePicBed()

const removeThemeListener = window.electron.onThemeUpdate(() => {})
onBeforeUnmount(removeThemeListener)

onBeforeMount(() => {
  updatePicBeds()
})
</script>
