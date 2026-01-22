<template>
  <div :class="tight ? 'mb-0' : 'mb-3'" class="flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
  </div>
  <div ref="dropdownRef" class="sort-dropdown relative">
    <button
      class="flex h-[28px] w-full cursor-pointer items-center justify-between gap-1 rounded-md border border-border-secondary px-2 py-1.5 text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:border-accent-hover focus:[.active]:border-accent-hover focus:[.active]:shadow-md"
      :class="{ active: dropDownOpen }"
      @click="toggleDropdown($event)"
    >
      <SortAscIcon v-if="fronticon" :size="14" />
      <span class="text-center text-xs font-semibold text-secondary">{{ placeholder || modelValue }}</span>
      <ChevronDownIcon :size="14" />
    </button>
    <div
      v-show="dropDownOpen"
      class="sort-options fixed z-10 mt-[2px] min-w-[150px] overflow-hidden rounded-md border border-border-secondary bg-bg-tertiary shadow-lg"
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

const dropdownRef = ref(null)
const modelValue = defineModel<string>()

function selectItem(key: string) {
  modelValue.value = key
  dropDownOpen.value = false
}

const dropDownOpen = ref(false)
function toggleDropdown(event?: Event) {
  dropDownOpen.value = !dropDownOpen.value

  if (dropDownOpen.value && event) {
    nextTick(() => {
      const trigger = event.target as HTMLElement
      const dropdown = trigger.parentElement?.querySelector('.sort-options') as HTMLElement
      if (dropdown && trigger) {
        const rect = trigger.getBoundingClientRect()
        dropdown.style.top = `${rect.bottom + 2}px`
        dropdown.style.left = `${rect.left}px`
        dropdown.style.width = `${Math.max(rect.width, 160)}px`
      }
    })
  }
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
} = defineProps<{
  title: string
  icon?: any
  iconSize?: number
  tight?: boolean
  placeholder?: string
  fronticon?: boolean
  keyList: string[]
}>()
</script>
