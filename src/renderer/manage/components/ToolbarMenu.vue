<template>
  <div ref="dropdownRef" class="relative">
    <button
      ref="triggerRef"
      v-tooltip="tips || undefined"
      type="button"
      :disabled
      aria-haspopup="menu"
      :aria-expanded="dropDownOpen"
      :aria-controls="menuId"
      :aria-label="label || undefined"
      class="flex h-[32px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-2.5 text-sm font-medium whitespace-nowrap text-main transition-all duration-fast ease-apple not-disabled:hover:border-accent not-disabled:hover:bg-accent/10 focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
      :class="{ 'border-accent bg-accent/10': dropDownOpen }"
      @click="toggleDropdown()"
      @keydown="handleTriggerKeydown"
    >
      <slot />
      <ChevronDownIcon
        :size="14"
        class="shrink-0 text-secondary transition-transform duration-fast ease-apple"
        :class="{ 'rotate-180': dropDownOpen }"
        aria-hidden="true"
      />
    </button>
    <div
      v-show="dropDownOpen"
      :id="menuId"
      ref="optionsRef"
      role="menu"
      :aria-label="label || undefined"
      class="fixed z-10000 overflow-y-auto overscroll-contain rounded-lg border border-border-secondary bg-bg-tertiary p-1 shadow-lg"
      @keydown="handleOptionsKeydown"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :role="option.checked === undefined ? 'menuitem' : 'menuitemradio'"
        :aria-checked="option.checked"
        :aria-selected="option.checked || undefined"
        data-dropdown-item
        tabindex="-1"
        class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-main transition-colors duration-fast hover:bg-accent/10 focus:bg-accent/10 focus:outline-none"
        :class="{ 'font-semibold text-accent': option.checked }"
        @click="select(option.value)"
      >
        <component :is="option.icon" v-if="option.icon" :size="15" class="shrink-0" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
        <CheckIcon v-if="option.checked" :size="15" class="shrink-0" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, ChevronDownIcon } from '@lucide/vue'
import { type Component, useId } from 'vue'

import { useDropdown } from '@/composables/useDropdown'

export interface ToolbarMenuOption {
  value: string
  label: string
  icon?: Component
  /** Set for single-choice menus; leave undefined for plain actions. */
  checked?: boolean
}

const {
  options,
  label = '',
  tips = '',
  disabled = false,
} = defineProps<{
  options: ToolbarMenuOption[]
  label?: string
  tips?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [value: string] }>()

const menuId = useId()
const { dropDownOpen, toggleDropdown, closeDropdown, handleTriggerKeydown, handleOptionsKeydown } = useDropdown({
  minWidth: 180,
  maxHeight: 320,
})

function select(value: string) {
  closeDropdown(true)
  emit('select', value)
}
</script>
