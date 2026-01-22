<template>
  <div
    class="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-bg-secondary p-4 transition-all duration-200 ease-apple hover:-translate-y-px hover:border-accent hover:shadow-md"
    @click="emit('click')"
  >
    <div class="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-lg bg-accent text-white">
      <component :is="icon" :size="15" />
    </div>
    <div class="flex-1">
      <h4 class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</h4>
      <slot name="description">
        <p v-if="description" class="mt-1 text-xs font-medium text-secondary">{{ description }}</p>
      </slot>
    </div>
    <div v-if="!noarrow" class="text-main transition-all duration-200 ease-apple hover:translate-x-1 hover:text-accent">
      <ChevronRightIcon :size="16" />
    </div>
    <slot name="extra"></slot>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon } from 'lucide-vue-next'
const {
  title,
  icon,
  description = '',
  noarrow = false,
} = defineProps<{
  icon: any
  title: string
  description?: string
  noarrow?: boolean
}>()
const emit = defineEmits<(e: 'click') => void>()
</script>
