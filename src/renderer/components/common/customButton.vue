<template>
  <button
    :disabled="disabled"
    class="flex min-w-fit cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-fast ease-apple not-disabled:hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    :class="classVar"
    :data-active="active"
    @click="emit('click')"
  >
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" />
    </slot>
    <slot>
      <span
        :class="textClassVar"
        :data-active="active"
        class="[.primary] text-sm leading-[1.4] font-semibold text-secondary"
        >{{ text }}</span
      >
    </slot>
    <slot name="extra"> </slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const {
  text,
  disabled,
  active = false,
  icon = null,
  iconSize = 16,
  type = 'primary',
} = defineProps<{
  text: string
  icon?: any
  active?: boolean
  iconSize?: number
  disabled?: boolean
  type?: 'primary' | 'secondary' | 'tab'
}>()

const textClassVar = computed(() => {
  switch (type) {
    case 'primary':
      return 'text-white'
    case 'secondary':
      return 'text-main'
    case 'tab':
      return active ? 'text-white' : 'text-secondary'
    default:
      return ''
  }
})

const classVar = computed(() => {
  switch (type) {
    case 'primary':
      return 'bg-accent text-white not-disabled:hover:bg-accent-hover! not-disabled:hover:-translate-y-px'
    case 'secondary':
      return 'border border-border! bg-bg-secondary! text-main! not-disabled:hover:bg-surface-elevated! not-disabled:hover:-translate-y-px'
    case 'tab':
      return 'flex-1 text-secondary not-disabled:data-[active=false]:hover:bg-accent/30! data-[active=true]:text-white data-[active=true]:bg-accent!'
    default:
      return ''
  }
})
const emit = defineEmits<(e: 'click') => void>()
</script>
