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

import { useThumbnail } from '@/hooks/useThumbnail'
import { getFileIconPath } from '@/manage/utils/common'
import { fetchPreviewResponse } from '@/manage/utils/filePreview'

const props = defineProps<{
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
  return props.isShowThumbnail && props.item.isImage
    ? objectUrl.value
    : `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`
})

const iconPath = computed(() => `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)

const {
  source: objectUrl,
  isLoading,
  hasError,
} = useThumbnail(
  () => props.isShowThumbnail && props.item.isImage,
  [
    () => props.url,
    () => props.item.key,
    () => props.config.authType,
    () => props.config.endpoint,
    () => props.config.sslEnabled,
    () => props.config.username,
    () => props.config.password,
  ],
  async signal => {
    const res = await fetchPreviewResponse(props.url, signal, props.config)
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
