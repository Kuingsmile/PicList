<template>
  <div :class="tight ? 'mb-0' : 'mb-3'" class="flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <label :id="labelId" :for="selectId" class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">
      {{ title }}
    </label>
    <span v-if="required" class="ml-1 text-danger" aria-hidden="true">*</span>
    <HelpTooltip v-if="tips" :content="tips" />
  </div>
  <div ref="dropdownRef" class="sort-dropdown relative">
    <button
      v-bind="$attrs"
      :id="selectId"
      ref="triggerRef"
      type="button"
      :disabled="disabled || getOptions().length === 0"
      :aria-labelledby="labelId"
      aria-haspopup="listbox"
      :aria-expanded="dropDownOpen"
      :aria-controls="optionsId"
      :aria-required="required || undefined"
      class="flex min-h-[28px] w-full cursor-pointer items-center justify-between gap-1 rounded-md border border-border-secondary px-2 py-1.5 text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:border-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus:[.active]:border-accent-hover focus:[.active]:shadow-md"
      :class="{ active: dropDownOpen }"
      @click="toggleDropdown()"
      @keydown="handleTriggerKeydown"
    >
      <component :is="customFrontIcon || SortAscIcon" v-if="fronticon" :size="14" aria-hidden="true" />
      <span class="text-center text-[0.8rem] font-semibold text-secondary">{{ getSelectedLabel() }}</span>
      <ChevronDownIcon :size="14" aria-hidden="true" />
    </button>
    <div
      v-show="dropDownOpen"
      :id="optionsId"
      ref="optionsRef"
      role="listbox"
      :aria-required="required || undefined"
      :aria-labelledby="labelId"
      class="fixed z-10000 max-h-[200px] overflow-y-auto overscroll-contain rounded-md border border-border-secondary bg-bg-tertiary shadow-lg"
      @keydown="handleOptionsKeydown"
    >
      <button
        v-for="option in getOptions()"
        :key="option.value"
        type="button"
        role="option"
        data-dropdown-item
        tabindex="-1"
        :disabled="disabled || option.disabled"
        :aria-selected="modelValue === option.value"
        class="block min-h-[unset] w-full cursor-pointer border-none bg-bg-tertiary px-2 py-1 text-center text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'bg-accent/10! font-semibold': modelValue === option.value }"
        @click="selectItem(option)"
      >
        <slot name="item" :item="option.value" :option="option"> {{ option.label }} </slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, SortAscIcon } from '@lucide/vue'
import { Comment, type Component, computed, Fragment, isVNode, useId, type VNode, watch } from 'vue'

import HelpTooltip from '@/components/common/HelpTooltip.vue'

import { useDropdown } from '../../composables/useDropdown'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

const slots = defineSlots<{
  icon?: () => unknown
  item?: (props: { item: string; option: SelectOption }) => unknown
  'pre-info'?: () => VNode[]
  extra?: () => VNode[]
}>()

defineOptions({ inheritAttrs: false })
const emit = defineEmits<{ change: [key: string] }>()
const modelValue = defineModel<string | undefined>({ default: undefined })
const generatedId = `single-select-${useId()}`
const selectId = computed(() => id || generatedId)
const labelId = computed(() => `${selectId.value}-label`)
const optionsId = computed(() => `${selectId.value}-options`)
const { dropDownOpen, toggleDropdown, closeDropdown, handleTriggerKeydown, handleOptionsKeydown } = useDropdown()

function selectItem(option: SelectOption) {
  if (disabled || option.disabled) return
  modelValue.value = option.value
  closeDropdown(true)
  emit('change', option.value)
}

function getOptionText(children: unknown): string {
  if (Array.isArray(children)) return children.map(getOptionText).join('')
  if (isVNode(children)) return children.type === Comment ? '' : getOptionText(children.children)
  return typeof children === 'string' || typeof children === 'number' ? String(children) : ''
}

function getSlotOptions(nodes: VNode[], groupDisabled = false): SelectOption[] {
  return nodes.flatMap(node => {
    const isDisabled = groupDisabled || node.props?.disabled === '' || !!node.props?.disabled
    if (node.type === Fragment || node.type === 'optgroup') {
      return getSlotOptions(Array.isArray(node.children) ? node.children.filter(isVNode) : [], isDisabled)
    }
    if (node.type !== 'option') return []
    const label = node.props?.label ?? getOptionText(node.children)
    return [{ value: node.props?.value ?? label, label, disabled: isDisabled }]
  })
}

// Resolve option slots during rendering so conditional and translated options stay up to date.
function getOptions(): SelectOption[] {
  return [
    ...getSlotOptions(slots['pre-info']?.() || []),
    ...(selectList ?? keyList.map(value => ({ value, label: value }))),
    ...getSlotOptions(slots.extra?.() || []),
  ]
}

function getSelectedLabel() {
  return getOptions().find(option => option.value === modelValue.value)?.label ?? (placeholder || modelValue.value)
}

const {
  title,
  placeholder = '',
  fronticon = true,
  keyList = [],
  selectList = undefined,
  icon = null,
  tight = true,
  iconSize = 18,
  customFrontIcon = null,
  required = false,
  disabled = false,
  id = undefined,
  tips = '',
} = defineProps<{
  title: string
  icon?: Component | null
  iconSize?: number
  tight?: boolean
  placeholder?: string
  fronticon?: boolean
  customFrontIcon?: Component | null
  keyList?: readonly string[]
  selectList?: readonly SelectOption[]
  required?: boolean
  disabled?: boolean
  id?: string
  tips?: string
}>()

watch(
  () => disabled,
  value => {
    if (value) closeDropdown()
  },
)
</script>
