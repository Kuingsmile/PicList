<template>
  <div class="relative flex h-full w-full items-center justify-center p-0">
    <div v-if="isLoading" class="flex h-full w-full items-center justify-center">
      <div class="h-[34px] w-[34px] animate-spin rounded-full border-3 border-t-3 border-border border-t-accent" />
    </div>
    <img
      v-else-if="!hasError"
      :src="imageSource"
      decoding="async"
      loading="lazy"
      alt=""
      class="h-full w-full object-contain"
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <img v-else decoding="async" loading="lazy" :src="iconPath" alt="" class="h-full w-full object-contain" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { useThumbnail } from '@/composables/useThumbnail'
import { getFileIconPath } from '@/manage/utils/filePresentation'
import { fetchPreviewResponse } from '@/manage/utils/filePreview'
import type { ThumbnailCache } from '@/manage/utils/thumbnailCache'

const { item, url, config, cache, isShowThumbnail } = defineProps<{
  cache: ThumbnailCache<Blob>
  item: {
    etag?: string
    lastmod?: string
    fileSize?: number
    key: string
    isImage: boolean
    fileName: string | null | undefined
  }
  url: string
  config: any
  isShowThumbnail: boolean
}>()

const cacheKey = computed(() => JSON.stringify([url, item.key, item.etag, item.lastmod, item.fileSize]))

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
  [cacheKey, () => cache],
  signal => {
    const target = url
    const credentials = { authType: config.authType, username: config.username, password: config.password }
    return cache.get(cacheKey.value, signal, 5 * 60_000, async signal => {
      const res = await fetchPreviewResponse(target, signal, credentials)
      return res.blob()
    })
  },
)

const handleImageLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleImageError = () => {
  cache.delete(cacheKey.value)
  isLoading.value = false
  hasError.value = true
}
</script>
