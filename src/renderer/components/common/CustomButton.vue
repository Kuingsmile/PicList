<template>
  <button
    :type="nativeType"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-pressed="type === 'tab' ? active : undefined"
    class="group flex min-w-fit cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-fast ease-apple not-disabled:hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
    :class="buttonClasses"
    :data-active="active"
    @click="handleClick"
  >
    <LoaderCircle
      v-if="loading"
      :size="iconSize"
      class="shrink-0 animate-spin motion-reduce:animate-none"
      :class="iconClass"
      aria-hidden="true"
    />
    <slot v-else name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="shrink-0" :class="iconClass" aria-hidden="true" />
    </slot>
    <slot>
      <span v-if="text" class="text-sm leading-[1.4] font-semibold" :class="textClass">{{ text }}</span>
    </slot>
    <slot name="extra" />
  </button>
</template>

<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { type Component, computed } from 'vue'

const {
  text = '',
  disabled = false,
  loading = false,
  active = false,
  icon = null,
  iconSize = 16,
  type = 'primary',
  nativeType = 'button',
  iconClass = '',
  textClass = '',
} = defineProps<{
  text?: string
  icon?: Component | null
  active?: boolean
  iconSize?: number
  disabled?: boolean
  loading?: boolean
  type?: 'primary' | 'secondary' | 'danger' | 'tab' | 'custom'
  nativeType?: 'button' | 'submit' | 'reset'
  iconClass?: string
  textClass?: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  switch (type) {
    case 'primary':
      return 'bg-accent text-white not-disabled:hover:bg-accent-hover not-disabled:hover:-translate-y-px'
    case 'secondary':
      return 'border border-border bg-bg-secondary text-main not-disabled:hover:border-accent not-disabled:hover:bg-accent/10! not-disabled:hover:-translate-y-px'
    case 'danger':
      return 'bg-danger/70 text-white not-disabled:hover:bg-danger'
    case 'tab':
      return 'flex-1 text-secondary not-disabled:data-[active=false]:hover:bg-accent/30 data-[active=true]:text-white data-[active=true]:bg-accent not-disabled:hover:text-white!'
    default:
      return ''
  }
})

function handleClick(event: MouseEvent) {
  if (disabled || loading) return
  emit('click', event)
}
</script>
