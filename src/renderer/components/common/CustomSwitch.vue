<template>
  <div
    class="flex min-w-0 flex-wrap items-center gap-2 rounded-xl"
    :class="[$attrs.class, noHover ? '' : 'hover:border-accent hover:bg-surface hover:shadow-sm']"
    :style="$attrs.style"
  >
    <label
      class="relative flex max-w-full min-w-0 items-center gap-4 rounded-lg border border-border transition-all duration-200 ease-apple"
      :class="{
        'border-none': noBorder,
        'p-4': !tighter,
        'cursor-pointer hover:border-accent': !disabled,
        'cursor-not-allowed opacity-50': disabled,
      }"
    >
      <input
        v-bind="inputAttrs()"
        v-model="modelValue"
        type="checkbox"
        role="switch"
        :disabled
        :aria-checked="modelValue"
        :aria-required="required || undefined"
        class="peer sr-only"
        @change.stop
      />
      <span
        class="relative shrink-0 rounded-full bg-gray-400/80 shadow-sm transition-all duration-medium ease-standard peer-checked:bg-accent peer-checked:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1),0_2px_8px_color-mix(in_srgb,var(--color-accent),transparent_30%)] peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-tertiary before:absolute before:rounded-full before:bg-white before:shadow-sm before:transition-all before:duration-200 before:ease-apple before:content-['']"
        aria-hidden="true"
        :class="
          small
            ? 'h-[21px] w-[44px] before:top-[2px] before:left-[2px] before:h-[17px] before:w-[17px] peer-checked:before:translate-x-[23px]'
            : 'h-[28px] w-[52px] before:top-[3px] before:left-[3px] before:h-[22px] before:w-[22px] peer-checked:before:translate-x-[24px]'
        "
      />
      <div class="flex min-w-0 flex-row items-center gap-1 wrap-anywhere">
        <slot name="custom-title"></slot>
        <div v-if="!!title" class="flex flex-1 flex-col gap-1">
          <div>
            <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
            <span v-if="required" class="ml-1 text-danger" aria-hidden="true">*</span>
          </div>
          <span v-if="!!description" class="text-xs text-secondary/90">{{ description }}</span>
        </div>
        <slot name="switch-text"></slot>
      </div>
    </label>
    <slot name="title-extra"></slot>
    <HelpTooltip v-if="tips" :content="tips" />
  </div>
</template>

<script lang="ts" setup>
import { useAttrs } from 'vue'

import HelpTooltip from '@/components/common/HelpTooltip.vue'

defineSlots<{
  'custom-title'?: () => unknown
  'switch-text'?: () => unknown
  'title-extra'?: () => unknown
}>()

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

function inputAttrs() {
  const { class: _class, style: _style, ...inputAttributes } = attrs
  return inputAttributes
}

const modelValue = defineModel<boolean>({ default: false })
const {
  title = '',
  description = '',
  noBorder = false,
  small = false,
  tips = '',
  required = false,
  noHover = false,
  tighter = false,
  disabled = false,
} = defineProps<{
  noBorder?: boolean
  title?: string
  description?: string
  small?: boolean
  tips?: string
  required?: boolean
  noHover?: boolean
  tighter?: boolean
  disabled?: boolean
}>()
</script>
