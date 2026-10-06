<template>
  <section class="processing-section">
    <header v-if="title || description" class="mb-3">
      <h3 v-if="title" class="flex items-center gap-2 text-sm font-semibold text-main">
        <component :is="icon" v-if="icon" :size="16" class="text-secondary" />
        {{ title }}
      </h3>
      <p v-if="description" class="mt-1 text-xs leading-relaxed text-secondary">{{ description }}</p>
    </header>
    <div
      class="grid grid-cols-2 gap-[12px] [&.single-column]:grid-cols-1 [&>.processing-section]:col-span-full [@media(width<=700px)]:grid-cols-1"
      :class="{ 'single-column': onlyOneRow }"
    >
      <slot />
    </div>
    <slot name="extra" />
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineSlots<{
  default?: () => unknown
  extra?: () => unknown
}>()

const {
  title = '',
  description = '',
  icon = null,
  onlyOneRow = false,
} = defineProps<{
  title?: string
  description?: string
  icon?: Component | null
  onlyOneRow?: boolean
}>()
</script>
