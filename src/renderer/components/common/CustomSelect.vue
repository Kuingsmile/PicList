<template>
  <div class="mb-3 flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <label :for="selectId" class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</label>
    <span v-if="required" class="ml-1 text-danger" aria-hidden="true">*</span>
  </div>
  <select
    v-bind="$attrs"
    :id="selectId"
    v-model="modelValue"
    :disabled="disabled"
    :aria-required="required || undefined"
    class="box-border w-full rounded-md border border-border bg-bg-tertiary p-3 text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
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
import { type Component, computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const generatedId = `select-${useId()}`
const selectId = computed(() => id || generatedId)
const modelValue = defineModel<string | undefined>({ default: undefined })

const {
  title,
  icon = null,
  iconSize = 18,
  selectList = [],
  required = false,
  id = undefined,
  disabled = false,
} = defineProps<{
  title: string
  icon?: Component | null
  selectList?: { value: string; label: string }[]
  iconSize?: number
  required?: boolean
  id?: string
  disabled?: boolean
}>()
</script>
