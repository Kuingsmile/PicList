<template>
  <label
    class="flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-bg p-4 transition-all duration-200 ease-apple hover:border-accent hover:bg-surface hover:shadow-sm"
  >
    <input v-model="modelValue" type="checkbox" class="peer hidden" />
    <span
      class="bg-linear-180-r relative h-[28px] w-[52px] shrink-0 rounded-full bg-gray-400/80 shadow-sm transition-all duration-medium ease-standard peer-checked:bg-accent before:absolute before:top-[3px] before:left-[3px] before:h-[22px] before:w-[22px] before:rounded-full before:bg-white before:shadow-sm before:transition-all before:duration-200 before:ease-apple before:content-[''] peer-checked:before:translate-x-[24px]"
    />
    <div class="flex flex-1 flex-col gap-1">
      <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ props.title }}</span>
      <span class="text-xs text-secondary/90">{{ props.description }}</span>
    </div>
  </label>
</template>

<script lang="ts" setup>
const modelValue = defineModel<boolean>()
const props = defineProps<{
  title?: string
  description?: string
}>()
</script>
