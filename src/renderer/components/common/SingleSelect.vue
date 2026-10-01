<template>
  <div :class="tight ? 'mb-0' : 'mb-3'" class="flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <span :id="labelId" class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
    <span v-if="required" class="ml-1 text-danger" aria-hidden="true">*</span>
  </div>
  <div ref="dropdownRef" class="sort-dropdown relative">
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled || keyList.length === 0"
      :aria-labelledby="labelId"
      aria-haspopup="listbox"
      :aria-expanded="dropDownOpen"
      :aria-controls="optionsId"
      class="flex min-h-[28px] w-full cursor-pointer items-center justify-between gap-1 rounded-md border border-border-secondary px-2 py-1.5 text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:border-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus:[.active]:border-accent-hover focus:[.active]:shadow-md"
      :class="{ active: dropDownOpen }"
      @click="toggleDropdown()"
      @keydown="handleTriggerKeydown"
    >
      <component :is="customFrontIcon || SortAscIcon" v-if="fronticon" :size="14" aria-hidden="true" />
      <span class="text-center text-xs font-semibold text-secondary">{{ placeholder || modelValue }}</span>
      <ChevronDownIcon :size="14" aria-hidden="true" />
    </button>
    <div
      v-show="dropDownOpen"
      :id="optionsId"
      ref="optionsRef"
      role="listbox"
      :aria-required="required || undefined"
      :aria-labelledby="labelId"
      class="sort-options fixed z-10000 max-h-[200px] overflow-y-auto overscroll-contain rounded-md border border-border-secondary bg-bg-tertiary shadow-lg"
      @keydown="handleOptionsKeydown"
    >
      <button
        v-for="key in keyList"
        :key
        type="button"
        role="option"
        data-dropdown-item
        tabindex="-1"
        :aria-selected="modelValue === key"
        class="block min-h-[unset] w-full cursor-pointer border-none bg-bg-tertiary px-2 py-1 text-center text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:bg-accent/50"
        :class="{ 'bg-accent/10! font-semibold': modelValue === key }"
        @click="selectItem(key)"
      >
        <slot name="item" :item="key"> {{ key }} </slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, SortAscIcon } from '@lucide/vue'
import { type Component, useId } from 'vue'

import { useDropdown } from '../../composables/useDropdown'

defineSlots<{
  icon?: () => unknown
  item?: (props: { item: string }) => unknown
}>()

const emit = defineEmits<{ change: [key: string] }>()
const modelValue = defineModel<string | undefined>({ default: undefined })
const labelId = `single-select-${useId()}`
const optionsId = `${labelId}-options`
const {
  dropdownRef,
  triggerRef,
  optionsRef,
  dropDownOpen,
  toggleDropdown,
  closeDropdown,
  handleTriggerKeydown,
  handleOptionsKeydown,
} = useDropdown()

function selectItem(key: string) {
  modelValue.value = key
  closeDropdown(true)
  emit('change', key)
}

const {
  title,
  placeholder = '',
  fronticon = true,
  keyList,
  icon = null,
  tight = true,
  iconSize = 18,
  customFrontIcon = null,
  required = false,
  disabled = false,
} = defineProps<{
  title: string
  icon?: Component | null
  iconSize?: number
  tight?: boolean
  placeholder?: string
  fronticon?: boolean
  customFrontIcon?: Component | null
  keyList: string[]
  required?: boolean
  disabled?: boolean
}>()
</script>
