<template>
  <label
    class="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-bg px-4 py-3.5 transition-all duration-200 ease-apple hover:border-accent-hover hover:bg-accent/8"
  >
    <input v-model="modelValue" type="radio" :value="value" class="peer hidden" />
    <span
      class="relative h-[18px] w-[18px] rounded-full border border-border bg-bg transition-all duration-200 ease-apple peer-checked:border-accent peer-checked:after:absolute peer-checked:after:top-1/2 peer-checked:after:left-1/2 peer-checked:after:h-[10px] peer-checked:after:w-[10px] peer-checked:after:-translate-x-1/2 peer-checked:after:-translate-y-1/2 peer-checked:after:transform peer-checked:after:rounded-full peer-checked:after:bg-accent peer-checked:after:content-['']"
    />
    <span class="text-sm font-medium text-main">{{ title }}</span>
  </label>
</template>
<script lang="ts" setup>
const modelValue = defineModel<string>()
const { value = '', title = '' } = defineProps<{
  value?: string
  title?: string
}>()
</script>
