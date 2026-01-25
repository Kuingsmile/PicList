<template>
  <div class="flex flex-col">
    <div class="mb-1 flex items-center gap-2">
      <label class="text-sm font-semibold text-secondary"
        >{{ title }}
        <span v-if="required" class="ml-1 text-danger">*</span>
      </label>
      <slot name="title-extra"></slot>
      <div v-if="tips" class="group relative inline-block">
        <div
          class="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full p-[2px] text-secondary hover:bg-bg-secondary hover:text-accent"
        >
          <Info :size="16" />
        </div>
        <div
          class="invisible absolute top-[125%] left-1/2 z-1000 w-max max-w-[200px] translate-x-[-50%] rounded-md border border-border bg-bg-tertiary p-2 text-center text-xs text-main opacity-0 shadow-md transition-opacity duration-300 group-hover:visible group-hover:opacity-100"
          v-html="transformMarkdownToHTML(tips)"
        />
      </div>
    </div>
    <div class="relative w-full">
      <input
        v-model="modelValue"
        :type="type"
        v-bind="$attrs"
        class="box-border w-full rounded-md border border-border bg-bg-tertiary p-3 pr-10 text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
      <slot name="input-extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeClosedIcon, EyeIcon, Info } from 'lucide-vue-next'
import { marked } from 'marked'
import { onMounted, ref } from 'vue'

const [modelValue, modifiers] = defineModel<any>({
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

const type = ref('text')

const {
  isPassword = false,
  title,
  inputType = 'text',
  placeholder,
  tips = '',
  required = false,
} = defineProps<{
  isPassword?: boolean
  title: string
  inputType?: string
  placeholder: string
  required?: boolean
  tips?: string
}>()

function transformMarkdownToHTML(markdown: string) {
  try {
    return marked.parse(markdown)
  } catch (_e) {
    return markdown
  }
}

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
