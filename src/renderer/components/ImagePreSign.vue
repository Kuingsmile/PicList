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
import { computed, onMounted, ref, watch } from 'vue'

import { getFileIconPath } from '@/manage/utils/common'
import { IRPCActionType } from '@/utils/enum'

const preSignedUrl = ref('')
const isLoading = ref(true)
const hasError = ref(false)

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

async function getUrl() {
  try {
    isLoading.value = true
    hasError.value = false
    preSignedUrl.value = await window.electron.triggerRPC<any>(
      IRPCActionType.MANAGE_GET_PRE_SIGNED_URL,
      props.alias,
      props.config,
    )
    isLoading.value = false
  } catch (error) {
    console.error('Failed to get pre-signed URL:', error)
    hasError.value = true
    isLoading.value = false
  }
}

const handleImageLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleImageError = () => {
  isLoading.value = false
  hasError.value = true
}

watch(() => [props.url, props.item], getUrl, { deep: true })

onMounted(getUrl)
</script>
