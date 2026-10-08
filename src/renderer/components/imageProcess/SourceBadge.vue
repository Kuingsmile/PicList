<template>
  <span
    class="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs leading-normal"
    :class="tones[source ?? 'combined']"
  >
    <component :is="icons[source ?? 'combined']" :size="12" class="shrink-0" aria-hidden="true" />
    <span class="min-w-0 wrap-anywhere">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { Box, Combine, Globe, Layers, UserRound } from '@lucide/vue'

import type { ProcessingConfigSource } from '@/utils/imageProcessingConfig'

const { source = undefined, label } = defineProps<{ source?: ProcessingConfigSource; label: string }>()

// More specific levels get stronger accents so overrides stand out from shared values.
const tones = {
  config: 'bg-accent/15 font-semibold text-accent',
  provider: 'bg-accent/8 font-medium text-accent',
  global: 'bg-bg-tertiary text-secondary',
  default: 'text-tertiary',
  combined: 'bg-bg-tertiary text-secondary',
}
const icons = { config: UserRound, provider: Layers, global: Globe, default: Box, combined: Combine }
</script>
