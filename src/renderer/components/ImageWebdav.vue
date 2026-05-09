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
  let headers: Record<string, any>
  if (props.config.authType === 'digest') {
    const authHeader = await getAuthHeader(
      'GET',
      formatEndpoint(props.config.endpoint, props.config.sslEnabled || false),
      `/${key.replace(/^\//, '')}`,
      props.config.username,
      props.config.password,
    )
    headers = {
      Authorization: authHeader,
    }
  } else {
    headers = {
      Authorization: 'Basic ' + btoa(`${props.config.username}:${props.config.password}`),
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
