<template>
  <section class="processing-section">
    <header v-if="title || description" class="mb-3">
      <h3 v-if="title" class="flex items-center gap-2 text-sm font-semibold text-main">
        <component :is="icon" v-if="icon" :size="16" class="text-secondary" />
        {{ title }}
      </h3>
      <p v-if="description" class="mt-1 text-xs leading-relaxed text-secondary">{{ description }}</p>
    </header>
    <div class="processing-section-fields" :class="{ 'single-column': onlyOneRow }"><slot /></div>
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

<style scoped>
.processing-section-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.processing-section-fields.single-column {
  grid-template-columns: minmax(0, 1fr);
}

.processing-section-fields > :deep(.processing-section) {
  grid-column: 1 / -1;
}

@media (width <= 700px) {
  .processing-section-fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
