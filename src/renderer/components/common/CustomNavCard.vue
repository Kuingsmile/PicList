<template>
  <div
    class="flex min-w-0 items-center rounded-lg border border-border bg-bg-secondary transition-[border-color,box-shadow,translate] duration-200 ease-apple motion-reduce:transition-none"
    :class="{
      'hover:-translate-y-px hover:border-accent hover:shadow-md motion-reduce:hover:translate-y-0':
        clickable && !disabled,
      'opacity-50': clickable && disabled,
    }"
  >
    <component
      :is="clickable ? 'button' : 'div'"
      :type="clickable ? 'button' : undefined"
      :disabled="clickable ? disabled : undefined"
      class="group flex min-w-0 flex-1 items-center gap-4 self-stretch rounded-lg p-4 text-left"
      :class="{ 'cursor-pointer disabled:cursor-not-allowed': clickable }"
      @click="handleClick"
    >
      <span
        v-if="icon"
        class="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-lg bg-accent text-white"
        aria-hidden="true"
      >
        <component :is="icon" :size="iconSize" />
      </span>
      <component :is="clickable ? 'span' : 'div'" class="min-w-0 flex-1">
        <span class="block text-[0.925rem] leading-[1.4] font-semibold break-words text-secondary">{{ title }}</span>
        <slot name="description">
          <span v-if="description" class="mt-1 block text-xs font-medium break-words text-secondary">
            {{ description }}
          </span>
        </slot>
      </component>
      <ChevronRightIcon
        v-if="clickable && showArrow"
        :size="16"
        class="shrink-0 text-main transition-[color,translate] duration-200 ease-apple motion-reduce:transition-none"
        :class="{
          'group-hover:translate-x-1 group-hover:text-accent group-focus-visible:translate-x-1 group-focus-visible:text-accent motion-reduce:translate-x-0':
            !disabled,
        }"
        aria-hidden="true"
      />
    </component>
    <div v-if="$slots.extra" class="shrink-0 py-4 pr-4">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon } from '@lucide/vue'
import type { Component } from 'vue'

const {
  title,
  icon = null,
  iconSize = 15,
  description = '',
  clickable = true,
  showArrow = true,
  disabled = false,
} = defineProps<{
  title: string
  icon?: Component | null
  iconSize?: number
  description?: string
  clickable?: boolean
  showArrow?: boolean
  disabled?: boolean
}>()

defineSlots<{
  description?: () => unknown
  extra?: () => unknown
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleClick(event: MouseEvent) {
  if (!clickable || disabled) return
  emit('click', event)
}
</script>
