<template>
  <div data-vjs-player class="h-full w-full">
    <video ref="videoElement" class="video-js" :crossorigin="crossorigin" :playsinline="playsinline" />
  </div>
</template>

<script setup lang="ts">
import 'video.js/dist/video-js.css'

import videojs from 'video.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    sources: { src: string; type?: string }[]
    options?: Record<string, unknown>
    volume?: number
    crossorigin?: 'anonymous' | 'use-credentials'
    controls?: boolean
    playsinline?: boolean
    loop?: boolean
  }>(),
  { options: () => ({}), volume: 1, crossorigin: undefined },
)
const emit = defineEmits<{ error: [event: unknown] }>()
const videoElement = ref<HTMLVideoElement>()
let player: ReturnType<typeof videojs> | undefined

onMounted(() => {
  if (!videoElement.value) return
  player = videojs(videoElement.value, {
    ...props.options,
    sources: props.sources,
    controls: props.controls,
    playsinline: props.playsinline,
    loop: props.loop,
  })
  player.on('error', (event: unknown) => emit('error', event))
  player.ready(() => {
    if (player && !player.isDisposed()) player.volume(props.volume)
  })
})

watch(
  () => props.sources,
  sources => player?.src(sources),
  { deep: true },
)
watch(
  () => props.volume,
  volume => player?.volume(volume),
)

onBeforeUnmount(() => {
  player?.dispose()
  player = undefined
})
</script>
