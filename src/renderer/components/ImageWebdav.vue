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
import { getAuthHeader } from '@/manage/utils/digestAuth'
import { formatEndpoint } from '@/utils/common'

const base64Url = ref('')
const success = ref(false)
const isLoading = ref(true)
const hasError = ref(false)

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
  return props.isShowThumbnail && props.item.isImage && success.value
    ? base64Url.value
    : `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`
})

const iconPath = computed(() => `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)

async function getWebdavHeader(key: string) {
  let headers = {} as any
  if (props.config.authType === 'digest') {
    const authHeader = await getAuthHeader(
      'GET',
      formatEndpoint(props.config.endpoint, props.config.sslEnabled || false),
      `/${key.replace(/^\//, '')}`,
      props.config.username,
      props.config.password
    )
    headers = {
      Authorization: authHeader
    }
  } else {
    headers = {
      Authorization: 'Basic ' + Buffer.from(`${props.config.username}:${props.config.password}`).toString('base64')
    }
  }
  return headers
}

const fetchImage = async () => {
  try {
    isLoading.value = true
    hasError.value = false
    const headers = await getWebdavHeader(props.item.key)
    const res = await fetch(props.url, { method: 'GET', headers })
    if (res.status >= 200 && res.status < 300) {
      const blob = await res.blob()
      success.value = true
      base64Url.value = URL.createObjectURL(blob)
      isLoading.value = false
    } else {
      throw new Error('Network response was not ok.')
    }
  } catch (err) {
    success.value = false
    hasError.value = true
    isLoading.value = false
    console.log(err)
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

watch(() => [props.url, props.item], fetchImage, { deep: true })

onMounted(fetchImage)
</script>

<style scoped>
.image-container {
  height: 100px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  display: block;
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e4e7ed;
  border-top: 2px solid #409eff;
  border-radius: 50%;
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
