<template>
  <div class="flex items-center rounded-xl hover:bg-surface hover:shadow-sm">
    <label
      class="flex cursor-pointer items-center gap-4 rounded-lg border border-border p-4 transition-all duration-200 ease-apple hover:border-accent"
      :class="noBorder ? 'border-none' : ''"
    >
      <input v-model="modelValue" type="checkbox" class="peer hidden" @change.stop="emit('change', modelValue)" />
      <span
        class="bg-linear-180-r relative shrink-0 rounded-full bg-gray-400/80 shadow-sm transition-all duration-medium ease-standard peer-checked:bg-accent peer-checked:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1),0_2px_8px_color-mix(in_srgb,var(--color-accent),transparent_30%)] before:absolute before:rounded-full before:bg-white before:shadow-sm before:transition-all before:duration-200 before:ease-apple before:content-[''] peer-checked:before:translate-x-[24px]"
        :class="
          small
            ? 'h-[21px] w-[44px] before:top-[2px] before:left-[2px] before:h-[17px] before:w-[17px]'
            : 'h-[28px] w-[52px] before:top-[3px] before:left-[3px] before:h-[22px] before:w-[22px]'
        "
      />
      <div class="flex flex-row items-center gap-1">
        <slot name="custom-title"></slot>
        <div v-if="!!title" class="flex flex-1 flex-col gap-1">
          <div>
            <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
            <span v-if="required" class="ml-1 text-danger">*</span>
          </div>
          <span v-if="!!description" class="text-xs text-secondary/90">{{ description }}</span>
        </div>
        <slot name="switch-text"></slot>
      </div>
    </label>
    <slot name="title-extra"></slot>
    <div v-if="tips" class="relative">
      <div
        class="flex h-[20px] w-[20px] cursor-pointer items-center justify-center rounded-full p-[2px] text-secondary hover:bg-bg-secondary hover:text-accent"
        @click="toggleTooltip()"
      >
        <Info :size="16" />
      </div>
      <div
        v-show="visibleTooltips"
        class="absolute top-full left-0 z-1000 max-w-[300px] min-w-[200px] rounded-md border border-border bg-bg-secondary p-3 text-xs leading-[1.4] text-main shadow-lg max-md:max-w-[250px] max-md:min-w-[150px]"
        v-html="transformMarkdownToHTML(tips)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Info } from 'lucide-vue-next'
import { marked } from 'marked'
import { onMounted, ref } from 'vue'

const emit = defineEmits(['change'])

const visibleTooltips = ref(false)

const modelValue = defineModel<boolean>()
const {
  title = '',
  description = '',
  noBorder = false,
  small = false,
  tips = '',
  required = false,
} = defineProps<{
  noBorder?: boolean
  title?: string
  description?: string
  small?: boolean
  tips?: string
  required?: boolean
}>()

function toggleTooltip() {
  visibleTooltips.value = !visibleTooltips.value
}

function transformMarkdownToHTML(markdown: string) {
  try {
    return marked.parse(markdown)
  } catch (_e) {
    return markdown
  }
}

onMounted(() => {
  if (typeof modelValue.value === 'string') {
    modelValue.value = modelValue.value === 'true'
  }
})
</script>
