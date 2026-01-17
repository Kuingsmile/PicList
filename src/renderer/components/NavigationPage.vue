<template>
  <nav class="navigation" :class="{ collapsed: isCollapsed }">
    <div class="title-bar">
      <div v-show="!isCollapsed" class="app-title">
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
        <component :is="isCollapsed ? ChevronRightIcon : ChevronLeftIcon" :size="16" />
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
        <span v-show="!isCollapsed" class="nav-label">{{ item.name }}</span>
      </div>

      <Disclosure v-show="!isCollapsed" v-slot="{ open }" as="div" class="nav-submenu">
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
      <div
        v-show="isCollapsed"
        class="nav-item collapsed-picbed"
        :title="t('navigation.picbed')"
        @click="isCollapsed = !isCollapsed"
      >
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
        <span v-show="!isCollapsed" class="nav-label">{{ item.name }}</span>
      </div>
    </div>
    <div class="sidebar-footer">
      <button class="footer-button" :title="t('navigation.moreOptions')" @click="openMenu">
        <Info :size="20" />
      </button>
    </div>
  </nav>

  <FirstTimeGuide ref="guideRef" />

  <TransitionRoot appear :show="qrcodeVisible" as="template">
    <Dialog as="div" class="qr-dialog" @close="qrcodeVisible = false">
      <div class="dialog-container">
        <TransitionChild as="template">
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

                    <transition>
                      <ListboxOptions class="listbox-options">
                        <ListboxOption
                          v-for="picbed in picBedG"
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
import { useStorage } from '@vueuse/core'
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

import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import * as config from '@/router/config'
import { SHOW_FIRST_TIME_GUIDE, SHOW_MAIN_PAGE_QRCODE } from '@/utils/constant'
import { getConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'

import FirstTimeGuide from './FirstTimeGuide.vue'
import ThemeSwitcher from './ui/ThemeSwitcher.vue'

const version = ref(pkg.version)
const isCollapsed = useStorage('navigation-collapsed', false)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const { picBedG } = usePicBed()

const routerConfig = reactive(config)
const qrcodeVisible = ref(false)
const choosedPicBedForQRCode: Ref<string[]> = ref([])
const picBedConfigString = ref('')
const guideRef = ref<InstanceType<typeof FirstTimeGuide> | null>(null)

let removeIpcListener: () => void = () => {}

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

const visiblePicBeds = computed(() => picBedG.value.filter(item => item.visible))

const qrCodeHandler = () => {
  qrcodeVisible.value = true
}

const guideHandler = () => {
  guideRef.value?.restartGuide()
}

function openMenu() {
  window.electron.sendRPC(IRPCActionType.SHOW_MAIN_PAGE_MENU)
}

function handleCopyPicBedConfig() {
  let result
  try {
    result = JSON.stringify(JSON.parse(picBedConfigString.value), null, 2)
  } catch (_e) {
    result = picBedConfigString.value
  }
  window.electron.clipboard.writeText(result)
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
  removeIpcListener = window.electron.ipcRendererOn(SHOW_MAIN_PAGE_QRCODE, qrCodeHandler)
  const removeGuideListener = window.electron.ipcRendererOn(SHOW_FIRST_TIME_GUIDE, guideHandler)

  const originalRemove = removeIpcListener
  removeIpcListener = () => {
    originalRemove()
    removeGuideListener()
  }
})

onBeforeUnmount(() => {
  removeIpcListener()
})
</script>

<style scoped src="./css/NavigationPage.css"></style>
