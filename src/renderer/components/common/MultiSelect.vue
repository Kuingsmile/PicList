<template>
  <div v-if="title" :class="tight ? 'mb-0' : 'mb-3'" class="flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
    <span v-if="required" class="text-danger" aria-hidden="true">*</span>
  </div>
  <div ref="dropdownRef" class="custom-multiselect relative">
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled || allList.length === 0"
      :aria-label="title || zeroPlaceholder"
      :aria-expanded="dropDownOpen"
      :aria-controls="optionsId"
      class="flex min-h-[28px] w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border-secondary px-2 py-1.5 text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:border-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus:[.active]:border-accent-hover focus:[.active]:shadow-sm"
      :class="{ active: dropDownOpen }"
      @click="toggleDropdown()"
      @keydown="handleTriggerKeydown"
    >
      <span v-if="choosed?.length === 0" class="text-center text-xs font-semibold text-secondary">{{
        zeroPlaceholder
      }}</span>
      <span v-else class="text-center text-xs font-semibold text-secondary"
        >{{ choosed?.length }} {{ t('pages.gallery.selected') }}</span
      >
      <ChevronDownIcon :size="16" class="shrink-0" aria-hidden="true" />
    </button>
    <div
      v-show="dropDownOpen"
      :id="optionsId"
      ref="optionsRef"
      role="group"
      :aria-label="title || zeroPlaceholder"
      class="multiselect-dropdown fixed z-10000 max-h-[150px] overflow-y-auto overscroll-contain rounded-md border border-border-secondary bg-bg-tertiary px-2 py-1.5 text-main shadow-lg"
      @keydown="handleOptionsKeydown"
    >
      <label
        v-for="item in allList"
        :key="item.type"
        class="flex min-h-[unset] cursor-pointer items-center justify-between px-2 py-1 text-sm leading-[1.4] transition-all duration-fast ease-apple hover:bg-accent/50"
      >
        <input
          v-bind="$attrs"
          v-model="choosed"
          type="checkbox"
          :disabled
          :value="item.type"
          data-dropdown-item
          tabindex="-1"
          class="m-0 mr-2 shrink-0 accent-accent"
        />
        <span class="min-w-0 flex-1 wrap-break-word">{{ item.name }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@lucide/vue'
import { type Component, onMounted, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDropdown } from '../../composables/useDropdown'

defineSlots<{
  icon?: () => unknown
}>()

const choosed = defineModel<string[] | undefined>('choosed', { default: undefined })
const { t } = useI18n()
defineOptions({ inheritAttrs: false })
const optionsId = `multi-select-${useId()}-options`
const {
  dropdownRef,
  triggerRef,
  optionsRef,
  dropDownOpen,
  toggleDropdown,
  handleTriggerKeydown,
  handleOptionsKeydown,
} = useDropdown({ minWidth: 200, maxHeight: 150 })

const {
  tight = true,
  title = '',
  icon = null,
  iconSize = 18,
  zeroPlaceholder,
  allList,
  disabled = false,
  required = false,
} = defineProps<{
  tight?: boolean
  title?: string
  icon?: Component | null
  iconSize?: number
  zeroPlaceholder: string
  allList: readonly { type: string; name: string }[]
  disabled?: boolean
  required?: boolean
}>()

onMounted(() => {
  if (!Array.isArray(choosed.value)) {
    choosed.value = []
  }
})
</script>
