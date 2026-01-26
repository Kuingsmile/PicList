<template>
  <div v-if="title" :class="tight ? 'mb-0' : 'mb-3'" class="flex items-center gap-2 text-sm font-medium text-main">
    <slot name="icon">
      <component :is="icon" v-if="icon" :size="iconSize" class="text-accent" />
    </slot>
    <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{ title }}</span>
  </div>
  <div ref="dropdownRef" class="custom-multiselect relative">
    <button
      class="flex h-[28px] w-full cursor-pointer items-center justify-between rounded-md border border-border-secondary px-2 py-1.5 text-sm leading-[1.4] text-main transition-all duration-fast ease-apple hover:border-accent-hover focus:[.active]:border-accent-hover focus:[.active]:shadow-sm"
      :class="{ active: dropDownOpen }"
      @click="toggleDropdown($event)"
    >
      <span v-if="choosed?.length === 0" class="text-center text-xs font-semibold text-secondary">{{
        zeroPlaceholder
      }}</span>
      <span v-else class="text-center text-xs font-semibold text-secondary"
        >{{ choosed?.length }} {{ t('pages.gallery.selected') }}</span
      >
      <ChevronDownIcon :size="16" />
    </button>
    <div
      v-show="dropDownOpen"
      class="multiselect-dropdown fixed z-10000 mt-[2px] max-h-[150px] min-w-[185px] overflow-y-auto rounded-md border border-border-secondary bg-bg-tertiary px-2 py-1.5 text-main shadow-lg"
    >
      <label
        v-for="item in allList"
        :key="item.type"
        class="flex min-h-[unset] cursor-pointer items-center justify-between px-2 py-1 text-sm leading-[1.4] transition-all duration-fast ease-apple hover:bg-accent/50"
      >
        <input v-bind="$attrs" v-model="choosed" type="checkbox" :value="item.type" class="m-0" />
        {{ item.name }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ChevronDownIcon } from 'lucide-vue-next'
import { nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const choosed = defineModel<string[]>('choosed')
const { t } = useI18n()
const dropdownRef = ref(null)

const dropDownOpen = ref(false)
function toggleDropdown(event?: Event) {
  dropDownOpen.value = !dropDownOpen.value
  if (dropDownOpen.value && event) {
    nextTick(() => {
      const trigger = event.target as HTMLElement
      const dropdown = trigger.parentElement?.querySelector('.multiselect-dropdown') as HTMLElement
      if (dropdown && trigger) {
        const rect = trigger.getBoundingClientRect()
        dropdown.style.top = `${rect.bottom + 2}px`
        dropdown.style.left = `${rect.left}px`
        dropdown.style.width = `${Math.max(rect.width, 200)}px`
      }
    })
  }
}

onClickOutside(dropdownRef, () => {
  dropDownOpen.value = false
})

const {
  tight = true,
  title = '',
  icon = null,
  iconSize = 18,
  zeroPlaceholder,
  allList,
} = defineProps<{
  tight?: boolean
  title?: string
  icon?: any
  iconSize?: number
  zeroPlaceholder: string
  allList: any
}>()

onMounted(() => {
  if (!Array.isArray(choosed.value)) {
    choosed.value = []
  }
})
</script>
