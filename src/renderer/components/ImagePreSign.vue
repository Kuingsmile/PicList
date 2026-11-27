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
import type { ThumbnailCache } from '@/manage/utils/thumbnailCache'
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'

const { item, alias, url, config, cache, isShowThumbnail } = defineProps<{
  cache: ThumbnailCache<string>
  item: {
    ETag?: string
    LastModified?: string | Date
    fileSize?: number
    key: string
    isImage: boolean
    fileName: string | null | undefined
  }
  alias: string
  url: string
  config: any
  isShowThumbnail: boolean
}>()

const cacheKey = computed(() => JSON.stringify([alias, url, config, item.ETag, item.LastModified, item.fileSize]))

const imageSource = computed(() => {
  return isShowThumbnail && item.isImage ? preSignedUrl.value : `./assets/icons/${getFileIconPath(item.fileName ?? '')}`
})

const iconPath = computed(() => `./assets/icons/${getFileIconPath(item.fileName ?? '')}`)

const {
  source: preSignedUrl,
  isLoading,
  hasError,
} = useThumbnail(
  () => isShowThumbnail && item.isImage,
  [cacheKey, () => cache],
  signal => {
    const account = alias
    const params = getRawData(config)
    const ttl = Math.min(5 * 60_000, (Number(params.expires || 3600) - 30) * 1000)
    return cache.get(cacheKey.value, signal, ttl, async () => {
      const signed = await window.electron.triggerRPC<string>(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, account, params)
      if (!signed || signed === 'error') throw new Error('Failed to get pre-signed URL')
      return signed
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
