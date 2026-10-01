<template>
  <div class="relative flex h-full w-full items-center justify-center p-0">
    <div v-if="isLoading" class="flex h-full w-full items-center justify-center">
      <div class="h-[34px] w-[34px] animate-spin rounded-full border-3 border-t-3 border-border border-t-accent" />
    </div>
    <img
      v-else-if="!hasError"
      :src="imageSource"
      alt=""
      class="h-full w-full object-contain"
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <img v-else :src="iconPath" alt="" class="h-full w-full object-contain" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { useThumbnail } from '@/composables/useThumbnail'
import { getFileIconPath } from '@/manage/utils/filePresentation'
import { fetchPreviewResponse } from '@/manage/utils/filePreview'

const { item, url, config, isShowThumbnail } = defineProps<{
  item: {
    key: string
    isImage: boolean
    fileName: string | null | undefined
  }
  url: string
  config: any
  isShowThumbnail: boolean
}>()

const imageSource = computed(() => {
  return isShowThumbnail && item.isImage ? objectUrl.value : `./assets/icons/${getFileIconPath(item.fileName ?? '')}`
})

const iconPath = computed(() => `./assets/icons/${getFileIconPath(item.fileName ?? '')}`)

const {
  source: objectUrl,
  isLoading,
  hasError,
} = useThumbnail(
  () => isShowThumbnail && item.isImage,
  [
    () => url,
    () => item.key,
    () => config.authType,
    () => config.endpoint,
    () => config.sslEnabled,
    () => config.username,
    () => config.password,
  ],
  async signal => {
    const res = await fetchPreviewResponse(url, signal, config)
    return await res.blob()
  },
)

const handleImageLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleImageError = () => {
  isLoading.value = false
  hasError.value = true
}
</script>
