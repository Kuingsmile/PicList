<template>
  <div class="mb-3 flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
    <span v-if="required" class="ml-1 text-danger">*</span>
  </div>
  <select
    v-model="modelValue"
    class="border-box w-full rounded-md border border-border bg-bg-tertiary p-3 text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus:outline-none"
    v-bind="$attrs"
  >
    <slot name="pre-info"></slot>
    <template v-if="selectList.length > 0">
      <option v-for="item in selectList" :key="item.value" :value="item.value">
        {{ item.label }}
      </option>
    </template>
    <slot name="extra"></slot>
  </select>
</template>

<script setup lang="ts">
const modelValue = defineModel<string>()

const {
  title,
  icon = null,
  iconSize = 18,
  selectList = [],
  required = false,
} = defineProps<{
  title: string
  icon?: any
  selectList?: { value: string; label: string }[]
  iconSize?: number
  required?: boolean
}>()
</script>
