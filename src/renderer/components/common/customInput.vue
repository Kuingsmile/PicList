<template>
  <div class="flex flex-col">
    <div class="flex items-center gap-2">
      <label class="mb-2 text-sm font-semibold text-secondary"
        >{{ title }}
        <span v-if="required" class="ml-1 text-red-400">*</span>
      </label>
      <slot name="title-extra"></slot>
    </div>
    <div class="relative w-full">
      <input
        v-model="modelValue"
        :type="type"
        v-bind="$attrs"
        class="box-border w-full rounded-md border border-border bg-bg-tertiary p-3 pr-10 text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus:outline-none"
        :placeholder="placeholder"
      />

      <button
        v-if="isPassword"
        type="button"
        class="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center text-main"
        @click="type = type === 'password' ? 'text' : 'password'"
      >
        <EyeIcon v-if="type === 'password'" class="text-accent" :size="16" />
        <EyeClosedIcon v-else class="text-accent" :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeClosedIcon, EyeIcon } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

const modelValue = defineModel<any>()
const type = ref('text')

const {
  isPassword = false,
  title,
  inputType = 'text',
  placeholder,
  required = false,
} = defineProps<{
  isPassword?: boolean
  title: string
  inputType?: string
  placeholder: string
  required?: boolean
}>()

defineOptions({
  inheritAttrs: false,
})

onMounted(() => {
  if (isPassword) {
    type.value = 'password'
  } else {
    type.value = inputType
  }
})
</script>
