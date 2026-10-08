<template>
  <div class="flex min-w-0 flex-col gap-2" :class="$attrs.class" :style="$attrs.style">
    <div class="flex min-w-0 items-center justify-between gap-3">
      <label :for="rangeId" class="min-w-0 text-sm font-semibold wrap-anywhere text-secondary">{{ title }}</label>
      <output
        :for="rangeId"
        class="shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-sm font-semibold text-accent tabular-nums"
        aria-hidden="true"
      >
        {{ showValue || modelValue }}
      </output>
    </div>
    <input
      v-bind="inputAttrs()"
      :id="rangeId"
      v-model.number="modelValue"
      type="range"
      :aria-label="ariaLabel || title || undefined"
      :min
      :max
      :step
      :disabled
      :aria-valuetext="showValue || undefined"
      :style="{ '--range-fill': `${fill}%` }"
      class="my-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,var(--color-accent)_var(--range-fill),var(--color-border)_var(--range-fill))] transition-colors duration-150 ease-apple focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-apple [&::-webkit-slider-thumb:hover]:scale-110"
    />
    <div v-if="minLabel || maxLabel" class="flex justify-between gap-3 text-xs text-tertiary" aria-hidden="true">
      <span>{{ minLabel }}</span>
      <span>{{ maxLabel }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
// Layout classes size the whole control; everything else belongs to the native range input.
function inputAttrs() {
  const { class: _class, style: _style, ...inputAttributes } = attrs
  return inputAttributes
}
const generatedId = `range-${useId()}`
const rangeId = computed(() => id || generatedId)
const modelValue = defineModel<number | undefined>({ default: undefined })

const {
  title = '',
  step = 1,
  min = 1,
  max = 100,
  showValue = '',
  minLabel = '',
  maxLabel = '',
  id = undefined,
  disabled = false,
  ariaLabel = undefined,
} = defineProps<{
  title?: string
  min?: number
  max?: number
  step?: number
  showValue?: string
  minLabel?: string
  maxLabel?: string
  id?: string
  disabled?: boolean
  ariaLabel?: string
}>()

const fill = computed(() => {
  const value = Math.min(max, Math.max(min, Number(modelValue.value) || 0))
  return max === min ? 0 : ((value - min) / (max - min)) * 100
})
</script>
