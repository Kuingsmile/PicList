<template>
  <div :class="tight ? 'mb-0' : 'mb-3'" class="flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
    <span v-if="required" class="ml-1 text-danger">*</span>
  </div>
  <div ref="dropdownRef" class="sort-dropdown relative">
    <button
      ref="triggerRef"
      class="flex h-[28px] w-full cursor-pointer items-center justify-between gap-1 rounded-md border border-border-secondary px-2 py-1.5 text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:border-accent-hover focus:[.active]:border-accent-hover focus:[.active]:shadow-md"
      :class="{ active: dropDownOpen }"
      @click="toggleDropdown()"
    >
      <component :is="customFrontIcon || SortAscIcon" v-if="fronticon" :size="14" />
      <span class="text-center text-xs font-semibold text-secondary">{{ placeholder || modelValue }}</span>
      <ChevronDownIcon :size="14" />
    </button>
    <div
      v-show="dropDownOpen"
      ref="optionsRef"
      class="sort-options fixed z-10 mt-[2px] max-h-[200px] min-w-[150px] overflow-hidden overflow-y-auto rounded-md border border-border-secondary bg-bg-tertiary shadow-lg"
    >
      <button
        v-for="key in keyList"
        :key="key"
        class="block min-h-[unset] w-full cursor-pointer border-none bg-bg-tertiary px-2 py-1 text-center text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:bg-accent/50"
        @click="selectItem(key)"
      >
        <slot name="item" :item="key"> {{ key }} </slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ChevronDownIcon, SortAscIcon } from 'lucide-vue-next'
import { nextTick, ref } from 'vue'

const emit = defineEmits<(e: 'change', key: string) => void>()
const dropdownRef = ref(null)
const modelValue = defineModel<string>()
const triggerRef = ref<HTMLElement | null>(null)
const optionsRef = ref<HTMLElement | null>(null)

function selectItem(key: string) {
  modelValue.value = key
  dropDownOpen.value = false
  emit('change', key)
}

const dropDownOpen = ref(false)

async function toggleDropdown() {
  dropDownOpen.value = !dropDownOpen.value

  if (dropDownOpen.value) {
    await nextTick()
    updatePosition()
  }
}

function updatePosition() {
  const trigger = triggerRef.value
  const dropdown = optionsRef.value
  if (!trigger || !dropdown) return

  const rect = trigger.getBoundingClientRect()
  const dropdownHeight = dropdown.offsetHeight
  const dropdownWidth = Math.max(rect.width, 160)
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  // 1. 垂直位置计算：检查下方空间是否足够
  const spaceBelow = viewportHeight - rect.bottom
  const canFitBelow = spaceBelow > dropdownHeight + 10 // 预留10px间距

  if (!canFitBelow && rect.top > dropdownHeight) {
    // 空间不足且上方放得下，向上翻转
    dropdown.style.top = `${rect.top - dropdownHeight - 4}px`
  } else {
    // 默认向下
    dropdown.style.top = `${rect.bottom + 2}px`
  }

  // 2. 水平位置计算：防止右侧溢出
  let leftPos = rect.left
  if (leftPos + dropdownWidth > viewportWidth) {
    leftPos = viewportWidth - dropdownWidth - 10 // 靠右对齐并留点边距
  }

  dropdown.style.left = `${leftPos}px`
  dropdown.style.width = `${dropdownWidth}px`
}

onClickOutside(dropdownRef, () => {
  dropDownOpen.value = false
})

const {
  title,
  placeholder = '',
  fronticon = true,
  keyList,
  icon = null,
  tight = true,
  iconSize = 18,
  customFrontIcon = null,
  required = false,
} = defineProps<{
  title: string
  icon?: any
  iconSize?: number
  tight?: boolean
  placeholder?: string
  fronticon?: boolean
  customFrontIcon?: any
  keyList: string[]
  required?: boolean
}>()
</script>
