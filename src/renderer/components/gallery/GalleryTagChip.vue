<template>
  <span
    class="inline-block max-w-full min-w-0 truncate rounded px-1.5 py-0.5 text-xs leading-4 font-medium text-main"
    :style="{ backgroundColor: `hsl(${hue} 68% 50% / 20%)` }"
  >
    {{ tag }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { galleryTagKey } from '#/galleryTags'

const { tag } = defineProps<{ tag: string }>()
const hue = computed(() => {
  let hash = 0
  for (const char of galleryTagKey(tag)) hash = (Math.imul(hash, 31) + char.codePointAt(0)!) >>> 0
  return hash % 360
})
</script>
