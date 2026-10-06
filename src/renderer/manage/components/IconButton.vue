<template>
  <div class="group relative inline-block">
    <button
      v-tooltip="tips"
      type="button"
      :aria-label="title || tips || undefined"
      class="relative flex cursor-pointer items-center justify-center gap-1 rounded-md p-2 text-xs font-medium transition-all duration-150 ease-apple hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
      :class="{
        'border-none bg-accent text-white hover:bg-accent-hover': type === 'primary',
        'border-[1.5px] border-border text-main hover:bg-accent/50 hover:text-white': type === 'secondary',
        'border-none bg-error/80 text-white hover:bg-error': type === 'danger',
      }"
      :disabled
      @click="emit('click')"
    >
      <component :is="icon" v-if="icon" class="h-[16px] w-[16px]" aria-hidden="true" />
      <span v-if="title">{{ title }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const {
  icon = null,
  title = '',
  tips = '',
  type,
  disabled = false,
} = defineProps<{
  icon?: any
  title?: string
  tips?: string
  disabled?: boolean
  type: 'primary' | 'secondary' | 'danger'
}>()
const emit = defineEmits<{ click: [] }>()
</script>
