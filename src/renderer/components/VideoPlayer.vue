<template>
  <div data-vjs-player class="h-full w-full">
    <video ref="videoElement" class="video-js" :crossorigin :playsinline />
  </div>
</template>

<script setup lang="ts">
import 'video.js/dist/video-js.css'

import videojs from 'video.js'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'

const {
  sources,
  options = {},
  volume = 1,
  crossorigin = undefined,
  controls,
  playsinline,
  loop,
} = defineProps<{
  sources: { src: string; type?: string }[]
  options?: Record<string, unknown>
  volume?: number
  crossorigin?: 'anonymous' | 'use-credentials'
  controls?: boolean
  playsinline?: boolean
  loop?: boolean
}>()
const emit = defineEmits<{ error: [event: unknown] }>()
const videoElement = useTemplateRef('videoElement')
let player: ReturnType<typeof videojs> | undefined

onMounted(() => {
  if (!videoElement.value) return
  player = videojs(videoElement.value, {
    ...options,
    sources,
    controls,
    playsinline,
    loop,
  })
  player.on('error', (event: unknown) => emit('error', event))
  player.ready(() => {
    if (player && !player.isDisposed()) player.volume(volume)
  })
})

watch(
  () => sources,
  sources => player?.src(sources),
  { deep: 2 },
)
watch(
  () => volume,
  volume => player?.volume(volume),
)

onBeforeUnmount(() => {
  player?.dispose()
  player = undefined
})
</script>
