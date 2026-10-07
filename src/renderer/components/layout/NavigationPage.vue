<template>
  <nav
    :aria-label="t('navigation.ariaLabel')"
    class="flex shrink-0 flex-col overflow-hidden border-r border-border-secondary bg-bg-secondary transition-[width] duration-medium ease-apple"
    :class="collapsed ? 'w-[60px]' : 'w-[176px]'"
  >
    <div
      v-if="!compactNavigation"
      class="flex h-[52px] shrink-0 items-center gap-2 px-2"
      :class="collapsed ? 'justify-center' : 'justify-between pl-4'"
    >
      <div v-if="!collapsed" class="flex min-w-0 items-center gap-1.5">
        <span class="truncate text-base font-bold tracking-tight text-main">{{ t('app.title') }}</span>
        <span
          class="shrink-0 rounded-full bg-accent/10 px-1.5 text-[10px] leading-4 font-semibold text-accent tabular-nums"
        >
          v{{ pkg.version }}
        </span>
      </div>
      <button
        v-tooltip="{ content: toggleLabel, placement: collapsed ? 'right' : 'bottom' }"
        type="button"
        :aria-label="toggleLabel"
        :aria-expanded="!collapsed"
        class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast ease-apple hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
        @click="isCollapsed = !isCollapsed"
      >
        <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" :size="18" aria-hidden="true" />
      </button>
    </div>

    <div class="no-scrollbar flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      <template v-for="item in navigationItems" :key="item.id">
        <!-- Workspace pages stay on top; configuration pages sit at the bottom. -->
        <div v-if="item.id === 'settings'" class="min-h-4 flex-1" aria-hidden="true" />
        <NavigationPicBedGroup
          v-if="item.id === 'picbed'"
          :collapsed="collapsed"
          :label="item.name"
          :icon="item.icon"
        />
        <button
          v-else
          v-tooltip="{ content: collapsed ? item.name : '', placement: 'right' }"
          type="button"
          :data-nav="item.id"
          :aria-label="collapsed ? item.name : undefined"
          :aria-current="isItemActive(item) ? 'page' : undefined"
          :class="[navItemBase, collapsed ? 'justify-center' : 'px-3', navItemState(isItemActive(item))]"
          @click="router.push({ name: item.routes[0] })"
        >
          <component :is="item.icon" :size="18" class="shrink-0" aria-hidden="true" />
          <span v-if="!collapsed" class="min-w-0 flex-1 truncate">{{ item.name }}</span>
        </button>
      </template>
    </div>

    <div
      class="flex shrink-0 gap-1 border-t border-border-secondary p-2"
      :class="collapsed ? 'flex-col items-center' : 'items-center'"
    >
      <div class="theme-switcher" :class="collapsed ? '' : 'min-w-0 flex-1'">
        <ThemeSwitcher :collapsed="collapsed" />
      </div>
      <button
        v-tooltip="{ content: t('navigation.moreOptions'), placement: collapsed ? 'right' : 'top' }"
        type="button"
        aria-haspopup="menu"
        :aria-label="t('navigation.moreOptions')"
        class="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast ease-apple hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
        @click="openMenu"
      >
        <Ellipsis :size="18" aria-hidden="true" />
      </button>
    </div>
  </nav>

  <FirstTimeGuide ref="guideRef" />
  <PicBedQrCodeDialog />
</template>

<script setup lang="ts">
import {
  Cloud,
  DatabaseIcon,
  Ellipsis,
  FileCode,
  ImagesIcon,
  PanelLeftClose,
  PanelLeftOpen,
  PlugIcon,
  Settings,
  UploadIcon,
} from '@lucide/vue'
import { useMediaQuery, useStorage } from '@vueuse/core'
import pkg from 'root/package.json'
import { type Component, computed, onBeforeMount, onBeforeUnmount, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import FirstTimeGuide from '@/components/FirstTimeGuide.vue'
import NavigationPicBedGroup from '@/components/layout/NavigationPicBedGroup.vue'
import { navItemBase, navItemState } from '@/components/layout/navStyles'
import PicBedQrCodeDialog from '@/components/layout/PicBedQrCodeDialog.vue'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher.vue'
import {
  GALLERY_PAGE,
  MANAGE_LOGIN_PAGE,
  MANAGE_MAIN_PAGE,
  MANAGE_SETTING_PAGE_DIRECT,
  PLUGIN_PAGE,
  SCRIPT_PAGE,
  SETTING_PAGE,
  SHORTKEY_PAGE,
  UPLOAD_PAGE,
} from '@/router/config'
import { SHOW_FIRST_TIME_GUIDE } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'

interface NavigationItem {
  id: string
  name: string
  icon: Component
  /** Route names that highlight this item; the first one is where it navigates. */
  routes: string[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isCollapsed = useStorage('navigation-collapsed', false)
const compactNavigation = useMediaQuery('(max-width: 767px)')
const collapsed = computed(() => isCollapsed.value || compactNavigation.value)
const toggleLabel = computed(() => (collapsed.value ? t('navigation.expand') : t('navigation.collapse')))
const guideRef = useTemplateRef('guideRef')

const navigationItems = computed<NavigationItem[]>(() => [
  { id: 'upload', name: t('navigation.upload'), icon: UploadIcon, routes: [UPLOAD_PAGE] },
  {
    id: 'manage',
    name: t('navigation.manage'),
    icon: Cloud,
    routes: [MANAGE_LOGIN_PAGE, MANAGE_MAIN_PAGE, MANAGE_SETTING_PAGE_DIRECT],
  },
  { id: 'gallery', name: t('navigation.gallery'), icon: ImagesIcon, routes: [GALLERY_PAGE] },
  { id: 'picbed', name: t('navigation.picbed'), icon: DatabaseIcon, routes: [] },
  { id: 'settings', name: t('navigation.settings'), icon: Settings, routes: [SETTING_PAGE, SHORTKEY_PAGE] },
  { id: 'plugins', name: t('navigation.plugins'), icon: PlugIcon, routes: [PLUGIN_PAGE] },
  { id: 'scripts', name: t('navigation.scripts'), icon: FileCode, routes: [SCRIPT_PAGE] },
])

function isItemActive(item: NavigationItem) {
  return route.matched.some(record => item.routes.includes(record.name as string))
}

function openMenu() {
  window.electron.sendRPC(IRPCActionType.SHOW_MAIN_PAGE_MENU)
}

let removeGuideListener: () => void = () => {}

onBeforeMount(() => {
  removeGuideListener = window.electron.ipcRendererOn(SHOW_FIRST_TIME_GUIDE, () => guideRef.value?.restartGuide())
})

onBeforeUnmount(() => {
  removeGuideListener()
})
</script>
