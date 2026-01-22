<template>
  <div class="w-full rounded-lg border border-border bg-bg-secondary p-6 shadow-sm">
    <div class="mb-2 flex items-start gap-3">
      <div
        v-if="icon"
        class="mb-2 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-accent text-white"
      >
        <slot name="icon">
          <component :is="icon" :size="iconSize" />
        </slot>
      </div>
      <div>
        <slot name="title"
          ><h2 class="mb-2 text-lg font-semibold text-main">{{ title }}</h2></slot
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
const {
  title = '',
  description = '',
  icon = null,
  iconSize = 20,
  onlyOneRow = false,
} = defineProps<{
  title?: string
  description?: string
  icon?: any
  iconSize?: number
  onlyOneRow?: boolean
}>()
</script>
