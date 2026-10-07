<template>
  <Menu v-if="collapsed" as="div">
    <div ref="flyoutAnchor">
      <MenuButton
        v-tooltip="{ content: label, placement: 'right' }"
        data-nav="picbed"
        :aria-label="label"
        :class="[navItemBase, 'justify-center', navItemState(false, sectionActive)]"
      >
        <component :is="icon" :size="18" class="shrink-0" aria-hidden="true" />
      </MenuButton>
    </div>
    <Teleport to="body">
      <transition
        enter-active-class="transition duration-fast ease-apple"
        enter-from-class="-translate-x-1 opacity-0"
        leave-active-class="transition duration-fast ease-apple"
        leave-to-class="opacity-0"
      >
        <MenuItems
          class="fixed z-100 flex w-[220px] flex-col overflow-hidden rounded-xl border border-border bg-bg-tertiary text-main shadow-xl focus:outline-none"
          :style="flyoutStyle"
        >
          <div class="shrink-0 border-b border-border-secondary px-3 py-2 text-xs font-semibold text-tertiary">
            {{ label }}
          </div>
          <div class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-1.5">
            <MenuItem v-for="picBed in visiblePicBeds" :key="picBed.type" v-slot="{ active }">
              <button
                type="button"
                :aria-current="picBed.type === activeType ? 'page' : undefined"
                :class="[
                  navChildBase,
                  picBed.type === activeType
                    ? 'bg-accent/10 font-semibold text-accent'
                    : active
                      ? 'bg-accent/10 font-medium text-main'
                      : 'font-medium text-secondary',
                ]"
                @click="open(picBed.type)"
              >
                <span class="min-w-0 flex-1 truncate">{{ picBed.name }}</span>
                <span
                  v-if="picBed.type === defaultPicBedG"
                  class="flex shrink-0"
                  role="img"
                  :aria-label="t('navigation.defaultPicBed')"
                >
                  <Star :size="12" class="fill-current text-warning" aria-hidden="true" />
                </span>
              </button>
            </MenuItem>
            <p v-if="!visiblePicBeds.length" class="m-0 px-2.5 py-2 text-xs text-tertiary">
              {{ t('navigation.noVisiblePicBeds') }}
            </p>
          </div>
        </MenuItems>
      </transition>
    </Teleport>
  </Menu>

  <template v-else>
    <button
      type="button"
      data-nav="picbed"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      :class="[navItemBase, 'px-3', headerState]"
      @click="expanded = !expanded"
    >
      <component :is="icon" :size="18" class="shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate">{{ label }}</span>
      <ChevronDownIcon
        :size="15"
        class="shrink-0 opacity-60 transition-transform duration-fast ease-apple"
        :class="{ '-rotate-90': !expanded }"
        aria-hidden="true"
      />
    </button>
    <div
      v-show="expanded"
      :id="panelId"
      class="mb-1 ml-[20px] flex shrink-0 flex-col gap-1 border-l border-border pl-1.5"
    >
      <div v-if="showFilter" class="relative mt-1">
        <SearchIcon
          :size="13"
          class="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-tertiary"
          aria-hidden="true"
        />
        <input
          v-model="filter"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :aria-label="t('navigation.filterPicBeds')"
          :placeholder="t('navigation.filterPicBeds')"
          class="h-7 w-full min-w-0 rounded-md border border-border-secondary bg-bg-tertiary pr-6 pl-6 text-xs text-main shadow-sm transition-colors duration-fast ease-apple placeholder:text-tertiary hover:border-border focus:border-accent focus:outline-none"
          @keydown.esc.stop="filter = ''"
        />
        <button
          v-if="filter"
          type="button"
          :aria-label="t('common.clear')"
          class="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-tertiary transition-colors duration-fast ease-apple hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
          @click="filter = ''"
        >
          <XIcon :size="12" aria-hidden="true" />
        </button>
      </div>
      <!--
        The list reaches back over the tree line so the active marker isn't clipped by its overflow;
        a thin scrollbar that only shows on hover keeps it from reading as a second rail.
      -->
      <div
        ref="list"
        class="-ml-2 flex max-h-[min(40vh,360px)] flex-col gap-0.5 overflow-y-auto overscroll-contain pl-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-tertiary"
      >
        <button
          v-for="picBed in filteredPicBeds"
          :key="picBed.type"
          v-tooltip.overflow="{ content: picBed.name, placement: 'right' }"
          type="button"
          :data-picbed="picBed.type"
          :aria-current="picBed.type === activeType ? 'page' : undefined"
          :class="[navChildBase, navChildState(picBed.type === activeType)]"
          @click="open(picBed.type)"
        >
          <span class="min-w-0 flex-1 truncate" data-tooltip-overflow>{{ picBed.name }}</span>
          <span
            v-if="picBed.type === defaultPicBedG"
            v-tooltip="t('navigation.defaultPicBed')"
            class="flex shrink-0"
            role="img"
            :aria-label="t('navigation.defaultPicBed')"
          >
            <Star :size="12" class="fill-current text-warning" aria-hidden="true" />
          </span>
        </button>
        <p v-if="!filteredPicBeds.length" class="m-0 px-2.5 py-1.5 text-xs text-tertiary">
          {{ visiblePicBeds.length ? t('navigation.noMatchingPicBeds') : t('navigation.noVisiblePicBeds') }}
        </p>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon, SearchIcon, Star, XIcon } from '@lucide/vue'
import { useElementBounding, useStorage, useWindowSize } from '@vueuse/core'
import { type Component, computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { navChildBase, navChildState, navItemBase, navItemState } from '@/components/layout/navStyles'
import { usePicBed } from '@/composables/useGlobal'
import { PICBEDS_PAGE, UPLOADER_CONFIG_PAGE } from '@/router/config'

const { collapsed, label, icon } = defineProps<{
  collapsed: boolean
  label: string
  icon: Component
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { picBedG, defaultPicBedG } = usePicBed()

const expanded = useStorage('navigation-picbed-open', false)
const filter = ref('')
const panelId = `nav-picbeds-${useId()}`
const list = useTemplateRef<HTMLElement>('list')
const flyoutAnchor = useTemplateRef<HTMLElement>('flyoutAnchor')

const visiblePicBeds = computed(() => picBedG.value.filter(item => item.visible))
const showFilter = computed(() => visiblePicBeds.value.length > 8)
const filteredPicBeds = computed(() => {
  const query = showFilter.value ? filter.value.trim().toLocaleLowerCase() : ''
  if (!query) return visiblePicBeds.value
  return visiblePicBeds.value.filter(
    item => item.name.toLocaleLowerCase().includes(query) || item.type.toLocaleLowerCase().includes(query),
  )
})

const sectionActive = computed(() => route.name === UPLOADER_CONFIG_PAGE || route.name === PICBEDS_PAGE)
const activeType = computed(() => (sectionActive.value ? String(route.params.type ?? '') : ''))
// Tint the group header when the active picbed is collapsed away or filtered out.
const activeHidden = computed(
  () => !!activeType.value && (!expanded.value || !filteredPicBeds.value.some(item => item.type === activeType.value)),
)
const headerState = computed(() => {
  if (!activeHidden.value && sectionActive.value) return 'text-main hover:bg-accent/10'
  return navItemState(false, activeHidden.value)
})

const { top: anchorTop, bottom: anchorBottom, right: anchorRight } = useElementBounding(flyoutAnchor)
const { height: windowHeight } = useWindowSize()
const flyoutStyle = computed(() => {
  const gap = 14 // the sidebar's 8px padding plus 6px of clearance past its border
  const margin = 8
  const titleBarHeight = 32
  const left = `${anchorRight.value + gap}px`
  // Open upward when the trigger sits low, so the list keeps a usable height.
  if (anchorTop.value > windowHeight.value * 0.6) {
    return {
      left,
      bottom: `${windowHeight.value - anchorBottom.value}px`,
      maxHeight: `${anchorBottom.value - titleBarHeight - margin}px`,
    }
  }
  return { left, top: `${anchorTop.value}px`, maxHeight: `${windowHeight.value - anchorTop.value - margin}px` }
})

function open(type: string) {
  router.push({ name: UPLOADER_CONFIG_PAGE, params: { type } })
}

watch(
  activeType,
  async type => {
    if (!type || collapsed || !expanded.value) return
    await nextTick()
    list.value?.querySelector(`[data-picbed="${CSS.escape(type)}"]`)?.scrollIntoView({ block: 'nearest' })
  },
  { flush: 'post' },
)
</script>
