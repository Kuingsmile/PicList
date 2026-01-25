<template>
  <label class="text-sm font-semibold text-main">{{ title }}</label>
  <input
    v-model.number="modelValue"
    type="range"
    :min="min"
    :max="max"
    :step="step"
    class="my-3 h-[8px] w-full appearance-none rounded-sm bg-linear-to-l from-accent transition-colors duration-150 ease-apple outline-none [&::--moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:h-[22px] [&::-moz-range-thumb]:w-[22px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:ease-apple [&::-webkit-slider-thumb:hover]:scale-105 [&::-webkit-slider-thumb:hover]:shadow-md"
  />
  <div
    class="mt-2 inline-flex max-w-16 min-w-14 items-center justify-center rounded-md bg-accent px-2 py-1.5 text-sm font-semibold text-white shadow-sm"
  >
    {{ showValue }}
  </div>
</template>

<script lang="ts" setup>
const modelValue = defineModel<number>()

const {
  title = '',
  step = 1,
  min = 1,
  max = 100,
  showValue = '',
} = defineProps<{
  title?: string
  min?: number
  max?: number
  step?: number
  showValue?: string
}>()
</script>
