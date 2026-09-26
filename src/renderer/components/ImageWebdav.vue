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
import { getAuthHeader } from '@/manage/utils/digestAuth'
import { formatEndpoint } from '@/utils/common'

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
  return props.isShowThumbnail && props.item.isImage
    ? objectUrl.value
    : `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`
})

const iconPath = computed(() => `./assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)

async function getWebdavHeader(key: string, signal: AbortSignal) {
  let headers: Record<string, any>
  if (props.config.authType === 'digest') {
    const authHeader = await getAuthHeader(
      'GET',
      formatEndpoint(props.config.endpoint, props.config.sslEnabled || false),
      `/${key.replace(/^\//, '')}`,
      props.config.username,
      props.config.password,
      signal,
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

const {
  source: objectUrl,
  isLoading,
  hasError,
} = useThumbnail(
  () => props.isShowThumbnail && props.item.isImage,
  [
    () => props.url,
    () => props.item.key,
    () => props.config.authType,
    () => props.config.endpoint,
    () => props.config.sslEnabled,
    () => props.config.username,
    () => props.config.password,
  ],
  async signal => {
    const url = props.url
    const headers = await getWebdavHeader(props.item.key, signal)
    signal.throwIfAborted()
    const res = await fetch(url, { method: 'GET', headers, signal })
    if (!res.ok) throw new Error('Network response was not ok.')
    return await res.blob()
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
