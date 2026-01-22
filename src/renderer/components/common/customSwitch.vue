<template>
  <label
    class="flex cursor-pointer items-center gap-4 rounded-lg border border-border p-4 transition-all duration-200 ease-apple hover:border-accent hover:bg-surface hover:shadow-sm"
    :class="noBorder ? 'border-none' : ''"
  >
    <input v-model="modelValue" type="checkbox" class="peer hidden" />
    <span
      class="bg-linear-180-r relative shrink-0 rounded-full bg-gray-400/80 shadow-sm transition-all duration-medium ease-standard peer-checked:bg-accent before:absolute before:rounded-full before:bg-white before:shadow-sm before:transition-all before:duration-200 before:ease-apple before:content-[''] peer-checked:before:translate-x-[24px]"
      :class="
        small
          ? 'h-[21px] w-[44px] before:top-[2px] before:left-[2px] before:h-[17px] before:w-[17px]'
          : 'h-[28px] w-[52px] before:top-[3px] before:left-[3px] before:h-[22px] before:w-[22px]'
      "
    />
    <div class="flex flex-row items-center gap-1">
      <div class="flex flex-1 flex-col gap-1">
        <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
        <span v-if="!!description" class="text-xs text-secondary/90">{{ description }}</span>
      </div>
      <slot name="switch-text"></slot>
      <slot name="title-extra"></slot>
    </div>
  </label>
</template>

<script lang="ts" setup>
const modelValue = defineModel<boolean>()
const {
  title = '',
  description = '',
  noBorder = false,
  small = false,
} = defineProps<{
  noBorder?: boolean
  title?: string
  description?: string
  small?: boolean
}>()
</script>
