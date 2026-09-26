<template>
  <div class="relative flex h-full w-full items-center justify-center p-0">
    <div v-if="isLoading" class="flex h-full w-full items-center justify-center">
      <div class="h-[34px] w-[34px] animate-spin rounded-full border-3 border-t-3 border-border border-t-accent" />
    </div>
    <img
      v-else-if="!hasError"
      :src="isShowThumbnail && item.isImage ? base64Image : `./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
      alt=""
      class="h-full w-full object-contain"
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <img
      v-else
      :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
      alt=""
      class="h-full w-full object-contain"
    />
  </div>
</template>

<script lang="ts" setup>
import { useThumbnail } from '@/hooks/useThumbnail'
import { getFileIconPath } from '@/manage/utils/common'

const props = defineProps<{
  isShowThumbnail: boolean
  item: {
    isImage: boolean
    fileName: string
  }
  localPath: string
}>()

const {
  source: base64Image,
  isLoading,
  hasError,
} = useThumbnail(
  () => props.isShowThumbnail && props.item.isImage,
  [() => props.localPath],
  async signal => {
    const filePath = window.node.path.normalize(props.localPath)
    const base64 = await window.node.fs.readFile(filePath, 'base64')
    signal.throwIfAborted()
    return `data:${window.node.mime.lookup(filePath) || 'image/png'};base64,${base64}`
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
