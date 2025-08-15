<template>
  <nav
    class="navigation"
    :class="{ collapsed: isCollapsed }"
  >
    <div class="title-bar">
      <div
        v-if="!isCollapsed"
        class="app-title"
      >
        <div
          class="app-text"
          @click="openGithubPage"
        >
          {{ t('app.title') }}
        </div>
        <div class="app-version">
          v{{ version }}
        </div>
      </div>
      <button
        :title="isCollapsed ? t('navigation.expand') : t('navigation.collapse')"
        class="collapse-button"
        @click="isCollapsed = !isCollapsed"
      >
        <ChevronLeftIcon
          v-if="!isCollapsed"
          :size="20"
        />
        <ChevronRightIcon
          v-else
          :size="20"
        />
      </button>
    </div>

    <div class="theme-section">
      <ThemeSwitcher :collapsed="isCollapsed" />
    </div>

    <div class="nav-menu">
      <router-link
        v-for="item in navigationItems.slice(0, 3)"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :title="`${item.name}`"
      >
        <div class="nav-icon-container">
          <component
            :is="item.icon"
            :size="18"
          />
        </div>
        <span
          v-if="!isCollapsed"
          class="nav-label"
        >{{ item.name }}</span>
      </router-link>

      <Disclosure
        v-if="!isCollapsed"
        v-slot="{ open }"
        as="div"
        class="nav-submenu"
      >
        <DisclosureButton class="nav-item submenu-trigger">
          <div class="nav-icon-container">
            <DatabaseIcon :size="18" />
          </div>
          <span class="nav-label">{{ t('navigation.picbed') }}</span>
          <ChevronDownIcon
            :size="16"
            class="submenu-arrow"
            :class="{ 'rotate-180': open }"
          />
        </DisclosureButton>
        <DisclosurePanel class="submenu-panel">
          <router-link
            v-for="item in visiblePicBeds"
            :key="item.type"
            :to="{ name: routerConfig.UPLOADER_CONFIG_PAGE, params: { type: item.type } }"
            class="submenu-item"
          >
            <span>{{ item.name }}</span>
          </router-link>
        </DisclosurePanel>
      </Disclosure>
      <div
        v-else
        class="nav-item collapsed-picbed"
        :title="t('navigation.picbed')"
        @click="isCollapsed = !isCollapsed"
      >
        <div class="nav-icon-container">
          <DatabaseIcon :size="18" />
        </div>
      </div>

      <router-link
        v-for="item in navigationItems.slice(3)"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :title="`${item.name}`"
      >
        <div class="nav-icon-container">
          <component
            :is="item.icon"
            :size="18"
          />
        </div>
        <span
          v-if="!isCollapsed"
          class="nav-label"
        >{{ item.name }}</span>
      </router-link>
    </div>
    <div class="sidebar-footer">
      <button
        class="footer-button"
        :title="t('navigation.moreOptions')"
        @click="openMenu"
      >
        <Info :size="20" />
      </button>
    </div>
  </nav>
  <TransitionRoot
    appear
    :show="qrcodeVisible"
    as="template"
  >
    <Dialog
      as="div"
      class="qr-dialog"
      @close="qrcodeVisible = false"
    >
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
                <Listbox
                  v-model="choosedPicBedForQRCode"
                  multiple
                >
                  <div class="listbox-container">
                    <ListboxButton class="listbox-button">
                      <span
                        v-if="choosedPicBedForQRCode.length === 0"
                        class="placeholder"
                      >
                        {{ t('navigation.selectPicBeds') }}
                      </span>
                      <span
                        v-else
                        class="selected-count"
                      >
                        {{ choosedPicBedForQRCode.length }} {{ t('navigation.selected') }}
                      </span>
                      <ChevronDownIcon
                        :size="16"
                        class="listbox-arrow"
                      />
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
                          <li
                            class="listbox-option"
                            :class="{ active, selected }"
                          >
                            <span>{{ picbed.name }}</span>
                            <CheckIcon
                              v-if="selected"
                              :size="16"
                            />
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>

                <button
                  v-if="choosedPicBedForQRCode.length > 0"
                  class="copy-button"
                  @click="handleCopyPicBedConfig"
                >
                  <CopyIcon :size="16" />
                  {{ t('navigation.copyPicBedConfig') }}
                </button>
              </div>

              <div
                v-if="choosedPicBedForQRCode.length > 0"
                class="qr-container"
              >
                <qrcode-vue
                  :size="280"
                  :value="picBedConfigString"
                  class="qr-code"
                />
              </div>
            </div>

            <div class="dialog-actions">
              <button
                class="cancel-button"
                @click="qrcodeVisible = false"
              >
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
  TransitionRoot
} from '@headlessui/vue'
import { pick } from 'lodash-es'
import { BriefcaseBusiness, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, DatabaseIcon, ImagesIcon, Info, PlugIcon, Settings, UploadIcon } from 'lucide-vue-next'
import QrcodeVue from 'qrcode.vue'
import pkg from 'root/package.json'
import { computed, nextTick, onBeforeMount, onBeforeUnmount, reactive, Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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
const message = useMessage()
const routerConfig = reactive(config)
const qrcodeVisible = ref(false)
const choosedPicBedForQRCode: Ref<string[]> = ref([])
const picBedConfigString = ref('')

let removeIpcListener: () => void = () => {}

// Save collapsed state to localStorage when it changes
watch(isCollapsed, (newValue) => {
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
  { deep: true }
)

const visiblePicBeds = computed(() =>
  picBedGlobal.value.filter(item => item.visible)
)

const qrCodeHandler = () => {
  qrcodeVisible.value = true
}

function openMenu () {
  window.electron.sendRPC(IRPCActionType.SHOW_MAIN_PAGE_MENU)
}

function handleCopyPicBedConfig () {
  window.electron.clipboard.writeText(picBedConfigString.value)
  message.success(t('navigation.copySuccess'))
}

const navigationItems = computed(() => [
  { name: t('navigation.upload'), path: '/main-page/upload', icon: UploadIcon },
  { name: t('navigation.manage'), path: '/main-page/manage-login-page', icon: BriefcaseBusiness },
  { name: t('navigation.gallery'), path: '/main-page/gallery', icon: ImagesIcon },
  { name: t('navigation.settings'), path: '/main-page/settings', icon: Settings },
  {
    name: t('navigation.plugins'),
    path: '/main-page/plugins',
    icon: PlugIcon
  }
])

function openGithubPage () {
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
  flex-direction: column;
  width: 150px;
  height: 100vh;
  background: var(--color-background-secondary);
  border-right: 1px solid rgb(229 231 235);
  overflow: hidden;
  transition: width 0.3s ease;
}

.navigation.collapsed {
  width: 60px;
}

:root.dark .navigation,
:root.auto.dark .navigation {
  background: var(--color-background-secondary);
  border-right-color: var(--color-background-secondary);
}

.title-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  position: relative;
}

.navigation.collapsed .title-bar {
  padding: 1rem 0.5rem;
}

.collapse-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-button:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
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
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface-elevated);
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.theme-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

:root.dark .theme-section,
:root.auto.dark .theme-section {
  border-bottom-color: var(--color-border);
}

.nav-menu {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
  min-height: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: rgb(75 85 99);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.navigation.collapsed .nav-item {
  padding: 0.75rem 0.5rem;
  justify-content: center;
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
  background: rgb(243 244 246);
  color: rgb(17 24 39);
}

:root.dark .nav-item:hover,
:root.auto.dark .nav-item:hover {
  background: rgb(55 65 81);
  color: rgb(243 244 246);
}

.nav-item.router-link-active {
  background: rgb(239 246 255);
  color: rgb(99 102 241);
  border-right: 3px solid rgb(99 102 241);
}

:root.dark .nav-item.router-link-active,
:root.auto.dark .nav-item.router-link-active {
  background: rgb(30 58 138 / 0.2);
  color: rgb(129 140 248);
  border-right-color: rgb(129 140 248);
}

.nav-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--color-border);
}

.footer-button {
  cursor: pointer;
  position: fixed;
  bottom: 4px;
  left: 4px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 6px;
}

.footer-button:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.nav-submenu {
  margin-top: 4px;
  justify-content: center;
  position: relative;
}

.submenu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: rgb(75 85 99);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  width: 100%;
  cursor: pointer;
  position: relative;
}

:root.dark .submenu-trigger,
:root.auto.dark .submenu-trigger {
  color: rgb(209 213 219);
}

.submenu-trigger:hover {
  background: rgb(243 244 246);
  color: rgb(17 24 39);
}

:root.dark .submenu-trigger:hover,
:root.auto.dark .submenu-trigger:hover {
  background: rgb(55 65 81);
  color: rgb(243 244 246);
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
  margin-top: 2px;
  padding-left: 2.75rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.submenu-item:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.collapsed-picbed {
  cursor: default;
}

.collapsed-picbed:hover {
  background: rgb(243 244 246);
  color: rgb(17 24 39);
}

:root.dark .collapsed-picbed:hover,
:root.auto.dark .collapsed-picbed:hover {
  background: rgb(55 65 81);
  color: rgb(243 244 246);
}

.qr-dialog {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  overflow-y: auto;
  align-items: center;
  justify-content: center;
}

.dialog-container {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.dialog-panel {
  width: 100%;
  max-width: 500px;
  background: var(--color-background-primary);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.dialog-title {
  padding: 20px 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
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
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--transition);
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
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 4px;
  background: var(--color-background-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
  max-height: 300px;
  overflow-y: auto;
}

.listbox-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: var(--transition);
}

.listbox-option.active {
  background: var(--color-surface-elevated);
}

.listbox-option.selected {
  background: var(--color-accent);
  color: white;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 16px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
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
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.dialog-actions {
  padding: 0 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-button {
  padding: 10px 20px;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.cancel-button:hover {
  background: var(--color-border);
}
/* Responsive Design */
@media (max-width: 768px) {
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
  background: var(--color-border);
  border-radius: 0px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
</style>
