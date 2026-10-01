<template>
  <label :for="rangeId" class="text-sm font-semibold text-main">{{ title }}</label>
  <input
    v-bind="$attrs"
    :id="rangeId"
    v-model.number="modelValue"
    type="range"
    :aria-label="ariaLabel || title || undefined"
    :min
    :max
    :step
    :disabled
    :aria-valuetext="showValue || undefined"
    class="my-3 h-[8px] w-full appearance-none rounded-sm bg-linear-to-l from-accent transition-colors duration-150 ease-apple focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-apple [&::-webkit-slider-thumb:hover]:scale-105 [&::-webkit-slider-thumb:hover]:shadow-md"
  />
  <div
    class="mt-2 inline-flex max-w-full min-w-14 items-center justify-center rounded-md bg-accent px-2 py-1.5 text-sm font-semibold wrap-anywhere text-white shadow-sm"
  >
    {{ showValue || modelValue }}
  </div>
</template>

<script lang="ts" setup>
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const generatedId = `range-${useId()}`
const rangeId = computed(() => id || generatedId)
const modelValue = defineModel<number | undefined>({ default: undefined })

const {
  title = '',
  step = 1,
  min = 1,
  max = 100,
  showValue = '',
  id = undefined,
  disabled = false,
  ariaLabel = undefined,
} = defineProps<{
  title?: string
  min?: number
  max?: number
  step?: number
  showValue?: string
  id?: string
  disabled?: boolean
  ariaLabel?: string
}>()
</script>
