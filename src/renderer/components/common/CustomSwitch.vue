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
        :aria-checked="!!modelValue"
        :aria-required="required || undefined"
        class="peer sr-only"
        @change.stop="emit('change', !!modelValue)"
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
    <div v-if="tips" class="group relative inline-block">
      <button
        type="button"
        :aria-label="t('common.help')"
        :aria-describedby="tipsId"
        class="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full p-[2px] text-secondary hover:bg-bg-secondary hover:text-accent"
      >
        <Info :size="16" aria-hidden="true" />
      </button>
      <div
        :id="tipsId"
        role="tooltip"
        class="invisible absolute top-[125%] left-1/2 z-1000 w-max max-w-[200px] translate-x-[-50%] rounded-md border border-border bg-bg-tertiary p-2 text-center text-xs text-main opacity-0 shadow-md transition-opacity duration-300 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
        v-html="tipsHtml"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Info } from '@lucide/vue'
import { computed, onMounted, useAttrs, useId } from 'vue'
import { useI18n } from 'vue-i18n'

import { renderMarkdown } from '@/utils/markdown'

defineSlots<{
  'custom-title'?: () => unknown
  'switch-text'?: () => unknown
  'title-extra'?: () => unknown
}>()

const emit = defineEmits<{ change: [value: boolean] }>()
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const { t } = useI18n()
const tipsId = `switch-${useId()}-tips`
const tipsHtml = computed(() => transformMarkdownToHTML(tips))

function inputAttrs() {
  const { class: _class, style: _style, ...inputAttributes } = attrs
  return inputAttributes
}

const modelValue = defineModel<boolean>()
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

function transformMarkdownToHTML(markdown: string) {
  try {
    return renderMarkdown(markdown, false)
  } catch (_e) {
    return ''
  }
}

onMounted(() => {
  if (typeof modelValue.value === 'string') {
    modelValue.value = modelValue.value === 'true'
  }
})
</script>
