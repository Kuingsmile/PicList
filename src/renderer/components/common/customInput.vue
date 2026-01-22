<template>
  <div class="flex flex-col">
    <label class="mb-2 text-sm font-semibold text-secondary">{{ title }}</label>

    <div class="relative w-full">
      <input
        v-model="modelValue"
        :type="type"
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
const modelValue = defineModel<string>()
const type = ref('text')
const {
  isPassword = false,
  title,
  placeholder,
} = defineProps<{
  isPassword?: boolean
  title: string
  placeholder: string
}>()
onMounted(() => {
  if (isPassword) {
    type.value = 'password'
  }
})
</script>
