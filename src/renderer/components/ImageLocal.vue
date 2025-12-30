<template>
  <div class="image-container">
    <div v-if="isLoading" class="loading-placeholder">
      <div class="loading-spinner" />
    </div>
    <img
      v-else-if="!hasError"
      :src="isShowThumbnail && item.isImage ? base64Image : `./assets/icons/${getFileIconPath(item.fileName ?? '')}`"
      alt=""
      class="image"
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <img v-else :src="`./assets/icons/${getFileIconPath(item.fileName ?? '')}`" alt="" class="image" />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from 'vue'

import { getFileIconPath } from '@/manage/utils/common'

const base64Image = ref('')
const isLoading = ref(true)
const hasError = ref(false)

const props = defineProps<{
  isShowThumbnail: boolean
  item: {
    isImage: boolean
    fileName: string
  }
  localPath: string
}>()

const createBase64Image = async () => {
  try {
    const filePath = window.node.path.normalize(props.localPath)
    const base64 = await window.node.fs.readFile(filePath, 'base64')
    base64Image.value = `data:${window.node.mime.lookup(filePath) || 'image/png'};base64,${base64}`
    isLoading.value = false
  } catch (e) {
    console.log(e)
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

onBeforeMount(async () => {
  await createBase64Image()
})
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
  border-radius: 50%;
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
