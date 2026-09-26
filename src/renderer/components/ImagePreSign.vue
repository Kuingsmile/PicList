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
import { IRPCActionType } from '@/utils/enum'

const props = defineProps<{
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
  return props.isShowThumbnail && props.item.isImage
    ? preSignedUrl.value
    : `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`
})

const iconPath = computed(() => `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)

const {
  source: preSignedUrl,
  isLoading,
  hasError,
} = useThumbnail(
  () => props.isShowThumbnail && props.item.isImage,
  [
    () => props.url,
    () => props.item.key,
    () => props.alias,
    () => props.config.bucketName,
    () => props.config.region,
    () => props.config.key,
    () => props.config.expires,
    () => props.config.customUrl,
    () => props.config.githubPrivate,
    () => props.config.rawUrl,
  ],
  async () => {
    const url = await window.electron.triggerRPC<string>(
      IRPCActionType.MANAGE_GET_PRE_SIGNED_URL,
      props.alias,
      props.config,
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
