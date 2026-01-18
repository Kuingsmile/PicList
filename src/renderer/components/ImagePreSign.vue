<template>
  <div class="image-container">
    <div v-if="isLoading" class="loading-placeholder">
      <div class="loading-spinner" />
    </div>
    <img
      v-else-if="!hasError"
      :src="imageSource"
      alt=""
      class="image"
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <img v-else :src="iconPath" alt="" class="image" />
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

<style scoped>
.image-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  width: 100%;
  height: 100px;
}

.image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.loading-spinner {
  border: 2px solid #e4e7ed;
  border-top: 2px solid #409eff;
  border-radius: var(--radius-round);
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
