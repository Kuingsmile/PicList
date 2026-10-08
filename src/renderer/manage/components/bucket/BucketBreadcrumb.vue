<template>
  <!-- The minimum width makes the domain field beside it wrap below before the path is squeezed away. -->
  <nav ref="nav" class="no-scrollbar flex min-w-48 flex-1 items-center gap-0.5 overflow-x-auto" :aria-label="label">
    <button
      type="button"
      :class="crumbClass(tailCrumbs.length === 0)"
      :title="rootTitle || rootLabel"
      :aria-current="tailCrumbs.length === 0 ? 'location' : undefined"
      @click="emit('navigate', segments[0]?.index ?? 0)"
    >
      <HomeIcon :size="14" class="text-accent" aria-hidden="true" />
      <span class="max-w-[220px] truncate">{{ rootLabel }}</span>
    </button>

    <!-- Deep paths keep the root and the last two folders in view; the rest wait behind "…". -->
    <template v-if="hiddenCrumbs.length">
      <ChevronRightIcon :size="14" class="shrink-0 text-tertiary" aria-hidden="true" />
      <div ref="dropdownRef" class="shrink-0">
        <button
          ref="triggerRef"
          v-tooltip="moreLabel"
          type="button"
          aria-haspopup="menu"
          :aria-expanded="dropDownOpen"
          :aria-controls="menuId"
          :aria-label="moreLabel"
          :class="[crumbClass(false), 'px-1.5!', { 'bg-accent/10 text-main': dropDownOpen }]"
          @click="toggleDropdown()"
          @keydown="handleTriggerKeydown"
        >
          <EllipsisIcon :size="16" aria-hidden="true" />
        </button>
        <div
          v-show="dropDownOpen"
          :id="menuId"
          ref="optionsRef"
          role="menu"
          :aria-label="moreLabel"
          class="fixed z-10000 overflow-y-auto overscroll-contain rounded-lg border border-border-secondary bg-bg-tertiary p-1 shadow-lg"
          @keydown="handleOptionsKeydown"
        >
          <button
            v-for="segment in hiddenCrumbs"
            :key="segment.index"
            type="button"
            role="menuitem"
            data-dropdown-item
            tabindex="-1"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-main transition-colors duration-fast hover:bg-accent/10 focus:bg-accent/10 focus:outline-none"
            :title="segment.name"
            @click="navigateHidden(segment.index)"
          >
            <FolderIcon :size="15" class="shrink-0 text-secondary" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate">{{ segment.name }}</span>
          </button>
        </div>
      </div>
    </template>

    <template v-for="(segment, position) in tailCrumbs" :key="segment.index">
      <ChevronRightIcon :size="14" class="shrink-0 text-tertiary" aria-hidden="true" />
      <button
        type="button"
        :class="crumbClass(position === tailCrumbs.length - 1)"
        :title="segment.name"
        :aria-current="position === tailCrumbs.length - 1 ? 'location' : undefined"
        @click="emit('navigate', segment.index)"
      >
        <span class="max-w-[220px] truncate">{{ segment.name }}</span>
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { ChevronRightIcon, EllipsisIcon, FolderIcon, HomeIcon } from '@lucide/vue'
import { computed, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDropdown } from '@/composables/useDropdown'

interface Crumb {
  name: string
  /** The segment's position in the prefix, which the parent slices the prefix by. */
  index: number
}

/** Shown in full up to this many crumbs; longer paths collapse their middle. */
const MAX_VISIBLE = 4

const {
  segments,
  label,
  rootLabel,
  rootTitle = '',
} = defineProps<{
  segments: Crumb[]
  label: string
  rootLabel: string
  rootTitle?: string
}>()

const emit = defineEmits<{ navigate: [index: number] }>()

const { t } = useI18n()

const menuId = useId()

const nav = useTemplateRef('nav')

const { dropDownOpen, toggleDropdown, closeDropdown, handleTriggerKeydown, handleOptionsKeydown } = useDropdown({
  minWidth: 220,
  maxHeight: 320,
})

const collapsed = computed(() => segments.length > MAX_VISIBLE)

const hiddenCrumbs = computed(() => (collapsed.value ? segments.slice(1, -2) : []))

const tailCrumbs = computed(() => (collapsed.value ? segments.slice(-2) : segments.slice(1)))

const moreLabel = computed(() => t('pages.manage.bucket.hiddenFolders', hiddenCrumbs.value.length))

// Long folder names can still overflow the bar; keep the current folder in view.
watch(
  () => segments,
  () => {
    closeDropdown()
    nav.value?.scrollTo({ left: nav.value.scrollWidth })
  },
  { immediate: true, flush: 'post' },
)

function crumbClass(current: boolean) {
  return [
    'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors duration-fast focus-visible:focus-ring',
    current
      ? 'font-semibold text-main hover:bg-accent/10'
      : 'font-medium text-secondary hover:bg-accent/10 hover:text-main',
  ]
}

function navigateHidden(index: number) {
  closeDropdown()
  emit('navigate', index)
}
</script>
