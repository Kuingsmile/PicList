<template>
  <nav class="navigation" :class="{ collapsed: isCollapsed }">
    <div class="title-bar">
      <div v-if="!isCollapsed" class="app-title">
        <div class="app-text" @click="openGithubPage">
          {{ t('app.title') }}
        </div>
        <div class="app-version">v{{ version }}</div>
      </div>
      <button
        :title="isCollapsed ? t('navigation.expand') : t('navigation.collapse')"
        class="collapse-button"
        @click="isCollapsed = !isCollapsed"
      >
        <ChevronLeftIcon v-if="!isCollapsed" :size="20" />
        <ChevronRightIcon v-else :size="20" />
      </button>
    </div>

    <div class="theme-section">
      <ThemeSwitcher :collapsed="isCollapsed" />
    </div>

    <div class="nav-menu">
      <div
        v-for="item in navigationItems.slice(0, 3)"
        :key="item.path"
        class="nav-item"
        :class="{ 'router-link-active': isPathActive(item.path) }"
        :title="`${item.name}`"
        @click="navigateToPath(item.path)"
      >
        <div class="nav-icon-container">
          <component :is="item.icon" :size="18" />
        </div>
        <span v-if="!isCollapsed" class="nav-label">{{ item.name }}</span>
      </div>

      <Disclosure v-if="!isCollapsed" v-slot="{ open }" as="div" class="nav-submenu">
        <DisclosureButton class="nav-item submenu-trigger">
          <div class="nav-icon-container">
            <DatabaseIcon :size="18" />
          </div>
          <span class="nav-label">{{ t('navigation.picbed') }}</span>
          <ChevronDownIcon :size="16" class="submenu-arrow" :class="{ 'rotate-180': open }" />
        </DisclosureButton>
        <DisclosurePanel class="submenu-panel">
          <div
            v-for="item in visiblePicBeds"
            :key="item.type"
            class="submenu-item"
            @click="navigateToUploaderConfig(item.type)"
          >
            <span>{{ item.name }}</span>
          </div>
        </DisclosurePanel>
      </Disclosure>
      <div v-else class="nav-item collapsed-picbed" :title="t('navigation.picbed')" @click="isCollapsed = !isCollapsed">
        <div class="nav-icon-container">
          <DatabaseIcon :size="18" />
        </div>
      </div>

      <div
        v-for="item in navigationItems.slice(3)"
        :key="item.path"
        class="nav-item"
        :class="{ 'router-link-active': isPathActive(item.path) }"
        :title="`${item.name}`"
        @click="navigateToPath(item.path)"
      >
        <div class="nav-icon-container">
          <component :is="item.icon" :size="18" />
        </div>
        <span v-if="!isCollapsed" class="nav-label">{{ item.name }}</span>
      </div>
    </div>
    <div class="sidebar-footer">
      <button class="footer-button" :title="t('navigation.moreOptions')" @click="openMenu">
        <Info :size="20" />
      </button>
    </div>
  </nav>
  <TransitionRoot appear :show="qrcodeVisible" as="template">
    <Dialog as="div" class="qr-dialog" @close="qrcodeVisible = false">
      <div class="dialog-container">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <DialogPanel class="dialog-panel">
            <DialogTitle class="dialog-title">
              {{ t('navigation.picBedQrCode') }}
            </DialogTitle>

            <div class="dialog-content">
              <div class="form-group">
                <label class="form-label">{{ t('navigation.choosePicBed') }}</label>
                <Listbox v-model="choosedPicBedForQRCode" multiple>
                  <div class="listbox-container">
                    <ListboxButton class="listbox-button">
                      <span v-if="choosedPicBedForQRCode.length === 0" class="placeholder">
                        {{ t('navigation.selectPicBeds') }}
                      </span>
                      <span v-else class="selected-count">
                        {{ choosedPicBedForQRCode.length }} {{ t('navigation.selected') }}
                      </span>
                      <ChevronDownIcon :size="16" class="listbox-arrow" />
                    </ListboxButton>

                    <transition
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <ListboxOptions class="listbox-options">
                        <ListboxOption
                          v-for="picbed in picBedGlobal"
                          :key="picbed.type"
                          v-slot="{ active, selected }"
                          :value="picbed.type"
                        >
                          <li class="listbox-option" :class="{ active, selected }">
                            <span>{{ picbed.name }}</span>
                            <CheckIcon v-if="selected" :size="16" />
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>

                <button v-if="choosedPicBedForQRCode.length > 0" class="copy-button" @click="handleCopyPicBedConfig">
                  <CopyIcon :size="16" />
                  {{ t('navigation.copyPicBedConfig') }}
                </button>
              </div>

              <div v-if="choosedPicBedForQRCode.length > 0" class="qr-container">
                <qrcode-vue :size="280" :value="picBedConfigString" class="qr-code" />
              </div>
            </div>

            <div class="dialog-actions">
              <button class="cancel-button" @click="qrcodeVisible = false">
                {{ $t('navigation.close') }}
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { pick } from 'lodash-es'
import {
  BriefcaseBusiness,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DatabaseIcon,
  ImagesIcon,
  Info,
  PlugIcon,
  Settings,
  UploadIcon,
} from 'lucide-vue-next'
import QrcodeVue from 'qrcode.vue'
import pkg from 'root/package.json'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, reactive, Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import useMessage from '@/hooks/useMessage'
import * as config from '@/router/config'
import { SHOW_MAIN_PAGE_QRCODE } from '@/utils/constant'
import { getConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'
import { picBedGlobal, updatePicBedGlobal } from '@/utils/global'

import ThemeSwitcher from './ui/ThemeSwitcher.vue'
const version = ref(pkg.version)
const isCollapsed = ref(false)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const routerConfig = reactive(config)
const qrcodeVisible = ref(false)
const choosedPicBedForQRCode: Ref<string[]> = ref([])
const picBedConfigString = ref('')

let removeIpcListener: () => void = () => {}

// Save collapsed state to localStorage when it changes
watch(isCollapsed, newValue => {
  localStorage.setItem('navigation-collapsed', JSON.stringify(newValue))
})

watch(
  () => choosedPicBedForQRCode,
  val => {
    if (val.value.length > 0) {
      nextTick(async () => {
        const picBedConfig = await getConfig('picBed')
        const config = pick(picBedConfig, ...choosedPicBedForQRCode.value)
        picBedConfigString.value = JSON.stringify(config)
      })
    }
  },
  { deep: true },
)

const visiblePicBeds = computed(() => picBedGlobal.value.filter(item => item.visible))

const qrCodeHandler = () => {
  qrcodeVisible.value = true
}

function openMenu() {
  window.electron.sendRPC(IRPCActionType.SHOW_MAIN_PAGE_MENU)
}

function handleCopyPicBedConfig() {
  window.electron.clipboard.writeText(picBedConfigString.value)
  message.success(t('navigation.copySuccess'))
}

function navigateToPath(path: string) {
  router.push(path)
}

function navigateToUploaderConfig(type: string) {
  router.push({ name: routerConfig.UPLOADER_CONFIG_PAGE, params: { type } })
}

function isPathActive(path: string): boolean {
  return route.path === path
}

const navigationItems = computed(() => [
  { name: t('navigation.upload'), path: '/main-page/upload', icon: UploadIcon },
  { name: t('navigation.manage'), path: '/main-page/manage-login-page', icon: BriefcaseBusiness },
  { name: t('navigation.gallery'), path: '/main-page/gallery', icon: ImagesIcon },
  { name: t('navigation.settings'), path: '/main-page/settings', icon: Settings },
  {
    name: t('navigation.plugins'),
    path: '/main-page/plugins',
    icon: PlugIcon,
  },
])

function openGithubPage() {
  window.electron.sendRPC(IRPCActionType.OPEN_URL, 'https://github.com/Kuingsmile/PicList')
}

onBeforeMount(() => {
  // Load collapsed state from localStorage
  const savedState = localStorage.getItem('navigation-collapsed')
  if (savedState !== null) {
    isCollapsed.value = JSON.parse(savedState)
  }

  updatePicBedGlobal()
  removeIpcListener = window.electron.ipcRendererOn(SHOW_MAIN_PAGE_QRCODE, qrCodeHandler)
})

onBeforeUnmount(() => {
  removeIpcListener()
})
</script>

<style scoped>
.navigation {
  display: flex;
  overflow: hidden;
  border-right: 1px solid rgb(229 231 235);
  width: 150px;
  height: 100vh;
  background: var(--color-background-secondary);
  transition: width 0.3s ease;
  flex-direction: column;
}

.navigation.collapsed {
  width: 60px;
}

:root.dark .navigation,
:root.auto.dark .navigation {
  border-right-color: var(--color-background-secondary);
  background: var(--color-background-secondary);
}

.title-bar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 1.25rem 1rem;
  background: var(--color-background-secondary);
}

.navigation.collapsed .title-bar {
  padding: 1rem 0.5rem;
}

.collapse-button {
  position: absolute;
  top: 50%;
  right: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 4px;
  padding: 4px;
  color: var(--color-text-primary);
  background: transparent;
  transition: all 0.2s ease;
  transform: translateY(-50%);
  cursor: pointer;
}

.collapse-button:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}

.navigation.collapsed .collapse-button {
  position: static;
  transform: none;
}

:root.dark .title-bar,
:root.auto.dark .title-bar {
  border-bottom-color: var(--color-border);
  background: var(--color-background-secondary);
}

.app-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.app-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.app-text:hover {
  cursor: pointer;
  color: var(--color-blue-common);
}

.app-version {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface-elevated);
}

.theme-section {
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem;
}

:root.dark .theme-section,
:root.auto.dark .theme-section {
  border-bottom-color: var(--color-border);
}

.nav-menu {
  overflow-y: auto;
  padding: 1rem 0;
  min-height: 0;
  flex: 1;
}

.nav-item {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: rgb(75 85 99);
  transition: all 0.2s ease;
  gap: 0.75rem;
  cursor: pointer;
}

.navigation.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem 0.5rem;
  gap: 0;
}

.navigation.collapsed .nav-label {
  display: none;
}

:root.dark .nav-item,
:root.auto.dark .nav-item {
  color: rgb(209 213 219);
}

.nav-item:hover {
  color: rgb(17 24 39);
  background: rgb(243 244 246);
}

:root.dark .nav-item:hover,
:root.auto.dark .nav-item:hover {
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

.nav-item.router-link-active {
  border-right: 3px solid rgb(99 102 241);
  color: rgb(99 102 241);
  background: rgb(239 246 255);
}

:root.dark .nav-item.router-link-active,
:root.auto.dark .nav-item.router-link-active {
  border-right-color: rgb(129 140 248);
  color: rgb(129 140 248);
  background: rgb(30 58 138 / 20%);
}

.nav-icon-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-footer {
  border-top: 1px solid var(--color-border);
  padding: 12px;
}

.footer-button {
  position: fixed;
  bottom: 4px;
  left: 4px;
  border: none;
  border-radius: 6px;
  padding: 8px;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
}

.footer-button:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}

.nav-submenu {
  position: relative;
  justify-content: center;
  margin-top: 4px;
}

.submenu-trigger {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  color: rgb(75 85 99);
  background: transparent;
  transition: all 0.2s ease;
  gap: 0.75rem;
  cursor: pointer;
}

:root.dark .submenu-trigger,
:root.auto.dark .submenu-trigger {
  color: rgb(209 213 219);
}

.submenu-trigger:hover {
  color: rgb(17 24 39);
  background: rgb(243 244 246);
}

:root.dark .submenu-trigger:hover,
:root.auto.dark .submenu-trigger:hover {
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

.submenu-trigger .nav-icon-container {
  flex-shrink: 0;
}

.submenu-trigger span {
  flex-shrink: 0;
}

.submenu-arrow {
  position: absolute;
  right: 1rem;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.rotate-180 {
  transform: rotate(180deg);
}

.submenu-panel {
  display: flex;
  margin-top: 2px;
  padding-left: 2.75rem;
  flex-direction: column;
  gap: 4px;
}

.submenu-item {
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.submenu-item:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}

.collapsed-picbed {
  cursor: default;
}

.collapsed-picbed:hover {
  color: rgb(17 24 39);
  background: rgb(243 244 246);
}

:root.dark .collapsed-picbed:hover,
:root.auto.dark .collapsed-picbed:hover {
  color: rgb(243 244 246);
  background: rgb(55 65 81);
}

.qr-dialog {
  position: fixed;
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  inset: 0;
}

.dialog-container {
  position: fixed;
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  padding: 16px;
  min-height: 100vh;
  inset: 0;
}

.dialog-panel {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  background: var(--color-background-primary);
  box-shadow: var(--shadow-md);
}

.dialog-title {
  margin: 0;
  padding: 20px 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-content {
  padding: 20px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.listbox-container {
  position: relative;
}

.listbox-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 12px 16px;
  width: 100%;
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: var(--transition);
  cursor: pointer;
}

.listbox-button:hover {
  border-color: var(--color-accent);
}

.placeholder {
  color: var(--color-text-secondary);
}

.selected-count {
  color: var(--color-text-primary);
}

.listbox-arrow {
  color: var(--color-text-secondary);
}

.listbox-options {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 10;
  overflow-y: auto;
  margin-top: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  max-height: 300px;
  background: var(--color-background-primary);
  box-shadow: var(--shadow-md);
}

.listbox-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  transition: var(--transition);
  cursor: pointer;
}

.listbox-option.active {
  background: var(--color-surface-elevated);
}

.listbox-option.selected {
  color: white;
  background: var(--color-accent);
}

.copy-button {
  display: flex;
  align-items: center;
  margin-top: 12px;
  border: none;
  border-radius: var(--border-radius);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--color-accent);
  transition: var(--transition);
  gap: 8px;
  cursor: pointer;
}

.copy-button:hover {
  background: var(--color-accent-hover);
}

.qr-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.qr-code {
  overflow: hidden;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 24px 20px;
  gap: 12px;
}

.cancel-button {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 10px 20px;
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
  transition: var(--transition);
  cursor: pointer;
}

.cancel-button:hover {
  background: var(--color-border);
}

/* Responsive Design */
@media (width <= 768px) {
  .navigation {
    width: 60px;
  }

  .nav-label {
    display: none;
  }

  .app-title {
    display: none;
  }

  .collapse-button {
    display: none;
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  display: none;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  border-radius: 0;
  background: var(--color-border);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
</style>
