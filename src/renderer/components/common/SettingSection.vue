<template>
  <div class="w-full rounded-lg border border-border bg-bg-secondary p-6 shadow-sm">
    <div
      v-if="title || description || icon || $slots.title || $slots.description || $slots.icon"
      class="mb-2 flex items-start gap-3"
    >
      <div
        v-if="icon || $slots.icon"
        class="mb-2 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-accent text-white"
      >
        <slot name="icon">
          <component :is="icon" :size="iconSize" aria-hidden="true" />
        </slot>
      </div>
      <div class="min-w-0 wrap-break-word">
        <slot name="title"
          ><h2 v-if="title" class="mb-2 text-lg font-semibold text-main">{{ title }}</h2></slot
        >
        <slot name="description">
          <p v-if="description !== ''" class="mb-6 text-sm text-secondary">
            {{ description }}
          </p>
        </slot>
      </div>
    </div>

    <div :class="onlyOneRow ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4 max-md:grid-cols-1'">
      <slot />
    </div>
    <slot name="extra"></slot>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineSlots<{
  icon?: () => unknown
  title?: () => unknown
  description?: () => unknown
  default?: () => unknown
  extra?: () => unknown
}>()

const {
  title = '',
  description = '',
  icon = null,
  iconSize = 20,
  onlyOneRow = false,
} = defineProps<{
  title?: string
  description?: string
  icon?: Component | null
  iconSize?: number
  onlyOneRow?: boolean
}>()
</script>
