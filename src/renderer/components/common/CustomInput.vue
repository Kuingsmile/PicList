<template>
  <div class="flex flex-col">
    <div class="mb-1 flex items-center gap-2">
      <label :for="inputId" class="text-sm font-semibold text-secondary"
        >{{ title }}
        <span v-if="required" class="ml-1 text-danger" aria-hidden="true">*</span>
      </label>
      <slot name="title-extra"></slot>
      <HelpTooltip v-if="tips" :content="tips" />
    </div>
    <div class="relative w-full">
      <input
        v-bind="$attrs"
        :id="inputId"
        v-model="modelValue"
        :type
        :disabled
        :aria-required="required || undefined"
        class="box-border w-full rounded-md border border-border bg-bg-tertiary p-3 text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'pr-10': isPassword }"
        :placeholder
      />
      <button
        v-if="isPassword"
        type="button"
        :disabled
        :aria-label="passwordVisible ? t('common.hidePassword') : t('common.showPassword')"
        :aria-controls="inputId"
        :aria-pressed="passwordVisible"
        class="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-main disabled:cursor-not-allowed disabled:opacity-50"
        @click="passwordVisible = !passwordVisible"
      >
        <EyeIcon v-if="type === 'password'" class="text-accent" :size="16" aria-hidden="true" />
        <EyeClosedIcon v-else class="text-accent" :size="16" aria-hidden="true" />
      </button>
      <slot name="input-extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeClosedIcon, EyeIcon } from '@lucide/vue'
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import HelpTooltip from '@/components/common/HelpTooltip.vue'

defineSlots<{
  'title-extra'?: () => unknown
  'input-extra'?: () => unknown
}>()

const [modelValue, modifiers] = defineModel<any>({
  default: undefined,
  set(value) {
    let result = value
    if (modifiers.trim && typeof result === 'string') {
      result = result.trim()
    }
    if (modifiers.number) {
      const n = parseFloat(result)
      result = isNaN(n) ? result : n
    }
    return result
  },
})

const { t } = useI18n()
const generatedId = `input-${useId()}`
const inputId = computed(() => id || generatedId)
const passwordVisible = ref(false)
const type = computed(() => (isPassword ? (passwordVisible.value ? 'text' : 'password') : nativeType || inputType))

const {
  isPassword = false,
  title,
  inputType = 'text',
  placeholder,
  tips = '',
  required = false,
  id = undefined,
  disabled = false,
  type: nativeType = undefined,
} = defineProps<{
  isPassword?: boolean
  title: string
  inputType?: string
  placeholder: string
  required?: boolean
  tips?: string
  id?: string
  disabled?: boolean
  type?: string
}>()

defineOptions({
  inheritAttrs: false,
})

watch(
  () => isPassword,
  () => {
    passwordVisible.value = false
  },
)
</script>
