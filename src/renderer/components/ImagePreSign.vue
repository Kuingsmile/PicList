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
import { IRPCActionType } from '#/constants/rpcActions'
import { getRawData } from '#/utils/rawData'

const { item, alias, url, config, isShowThumbnail } = defineProps<{
  item: {
    key: string
    isImage: boolean
    fileName: string | null | undefined
  }
  alias: string
  url: string
  config: any
  isShowThumbnail: boolean
}>()

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
  [
    () => url,
    () => item.key,
    () => alias,
    () => config.bucketName,
    () => config.region,
    () => config.key,
    () => config.expires,
    () => config.customUrl,
    () => config.githubPrivate,
    () => config.rawUrl,
  ],
  async () => {
    const url = await window.electron.triggerRPC<string>(
      IRPCActionType.MANAGE_GET_PRE_SIGNED_URL,
      alias,
      getRawData(config),
    )
    if (!url || url === 'error') throw new Error('Failed to get pre-signed URL')
    return url
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
