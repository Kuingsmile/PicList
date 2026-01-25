<template>
  <nav
    class="group no-scrollbar flex h-screen w-[150px] flex-col overflow-hidden border-r border-r-border-secondary/50 bg-bg-secondary transition-all duration-medium ease-apple max-md:w-[60px] [.collapsed]:w-[60px]"
    :class="{ collapsed: isCollapsed }"
  >
    <div
      class="relative flex items-center justify-center bg-bg-secondary px-4 py-5 group-[.collapsed]:px-2 group-[.collapsed]:py-4"
    >
      <div v-show="!isCollapsed" class="flex flex-col items-center gap-1 group-[.collapsed]:hidden max-md:hidden">
        <div
          class="text-[16px] font-bold tracking-tight text-main hover:cursor-pointer hover:text-accent"
          @click="openGithubPage"
        >
          {{ t('app.title') }}
        </div>
        <div
          class="rounded-lg border border-border/50 bg-bg-secondary px-[8px] py-[3px] text-[10px] font-medium text-secondary"
        >
          v{{ version }}
        </div>
      </div>
      <button
        :title="isCollapsed ? t('navigation.expand') : t('navigation.collapse')"
        class="absolute top-1/2 right-[8px] flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-[4px] transition-all duration-200 ease-apple group-[.collapsed]:absolute group-[.collapsed]:top-[20px] group-[.collapsed]:right-[16px] group-[.collapsed]:transform-none hover:bg-accent/30 hover:text-white"
        @click="isCollapsed = !isCollapsed"
      >
        <component :is="isCollapsed ? ChevronRightIcon : ChevronLeftIcon" :size="16" />
      </button>
    </div>

    <div class="theme-switcher flex items-center justify-center p-3">
      <ThemeSwitcher :collapsed="isCollapsed" />
    </div>

    <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto py-4">
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
        <span v-show="!isCollapsed" class="max-md:hidden" :class="isCollapsed ? 'hidden' : ''">{{ item.name }}</span>
      </div>

      <Disclosure v-show="!isCollapsed" v-slot="{ open }" as="div" class="relative mt-[4px] justify-center">
        <DisclosureButton
          class="nav-item relative flex w-full cursor-pointer items-center justify-center gap-3 border-none bg-transparent px-4 py-3 text-sm font-medium text-secondary no-underline transition-all duration-200 ease-apple hover:bg-surface-elevated hover:text-main"
        >
          <div class="nav-icon-container">
            <DatabaseIcon :size="18" />
          </div>
          <span class="shrink-0 max-md:hidden" :class="isCollapsed ? 'hidden' : ''">{{ t('navigation.picbed') }}</span>
          <ChevronDownIcon
            :size="16"
            class="absolute right-4 shrink-0 transition-all duration-200 ease-apple"
            :class="{ 'rotate-180': open }"
          />
        </DisclosureButton>
        <DisclosurePanel class="mt-[2px] flex flex-col gap-[4px] pl-11">
          <div
            v-for="item in visiblePicBeds"
            :key="item.type"
            :class="{ 'router-link-active': isPicBedPathActive(item.type) }"
            class="flex cursor-pointer items-center px-4 py-2 text-sm font-medium text-secondary no-underline transition-all duration-200 ease-apple hover:bg-surface-elevated hover:text-accent-hover [.router-link-active]:border-r-4 [.router-link-active]:border-accent [.router-link-active]:bg-surface [.router-link-active]:text-accent"
            @click="navigateToUploaderConfig(item.type)"
          >
            <span>{{ item.name }}</span>
          </div>
        </DisclosurePanel>
      </Disclosure>
      <div
        v-show="isCollapsed"
        class="nav-item cursor-default bg-surface-elevated hover:text-main"
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
        <span v-show="!isCollapsed" class="max-md:hidden" :class="isCollapsed ? 'hidden' : ''">{{ item.name }}</span>
      </div>
    </div>
    <div class="border-t border-t-border p-3">
      <button
        class="fixed bottom-[4px] left-[4px] cursor-pointer rounded-full border-none bg-transparent p-[8px] text-tertiary hover:bg-accent/30 hover:text-white"
        :title="t('navigation.moreOptions')"
        @click="openMenu"
      >
        <Info :size="20" />
      </button>
    </div>
  </nav>

  <FirstTimeGuide ref="guideRef" />

  <TransitionRoot appear :show="qrcodeVisible" as="template">
    <Dialog
      as="div"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      @close="qrcodeVisible = false"
    >
      <div class="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto p-[16px]">
        <TransitionChild as="template">
          <DialogPanel
            class="w-full max-w-[500px] overflow-visible rounded-xl border border-border bg-bg-tertiary shadow-md"
          >
            <DialogTitle class="m-0 px-[24px] pt-[20px] text-2xl font-semibold text-main">
              {{ t('navigation.picBedQrCode') }}
            </DialogTitle>

            <div class="p-4">
              <div class="mb-5">
                <label class="mb-2 block text-base font-medium text-main">{{ t('navigation.choosePicBed') }}</label>
                <Listbox v-model="choosedPicBedForQRCode" multiple>
                  <div class="relative">
                    <ListboxButton
                      class="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-base text-main hover:border-accent"
                    >
                      <span v-if="choosedPicBedForQRCode.length === 0" class="text-secondary">
                        {{ t('navigation.selectPicBeds') }}
                      </span>
                      <span v-else class="text-main">
                        {{ choosedPicBedForQRCode.length }} {{ t('navigation.selected') }}
                      </span>
                      <ChevronDownIcon :size="16" class="text-secondary" />
                    </ListboxButton>

                    <transition>
                      <ListboxOptions
                        class="absolute top-full right-0 left-0 z-1000 mt-[4px] max-h-[300px] overflow-y-auto rounded-sm border border-border bg-bg-tertiary shadow-md"
                      >
                        <ListboxOption
                          v-for="picbed in picBedG"
                          :key="picbed.type"
                          v-slot="{ active, selected }"
                          :value="picbed.type"
                        >
                          <li
                            class="flex cursor-pointer items-center justify-between px-4 py-3 text-base text-main [.active]:bg-surface-elevated [.selected]:bg-accent [.selected]:text-white"
                            :class="{ active, selected }"
                          >
                            <span>{{ picbed.name }}</span>
                            <CheckIcon v-if="selected" :size="16" />
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>

                <button
                  v-if="choosedPicBedForQRCode.length > 0"
                  class="mt-3 flex cursor-pointer items-center gap-2 rounded-sm border-none bg-accent px-4 py-2 text-base font-medium text-white hover:bg-accent-hover"
                  @click="handleCopyPicBedConfig"
                >
                  <CopyIcon :size="16" />
                  {{ t('navigation.copyPicBedConfig') }}
                </button>
              </div>

              <div v-if="choosedPicBedForQRCode.length > 0" class="flex justify-center py-5">
                <qrcode-vue :size="280" :value="picBedConfigString" class="overflow-hidden shadow-sm" />
              </div>
            </div>

            <div class="flex justify-end gap-3 px-4 pb-4">
              <button
                class="cursor-pointer rounded-sm border border-border bg-danger/50 px-4 py-2 text-base text-main hover:bg-danger/70"
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
  TransitionRoot,
} from '@headlessui/vue'
import { useStorage } from '@vueuse/core'
import { pick } from 'lodash-es'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cloud,
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

import FirstTimeGuide from '@/components/FirstTimeGuide.vue'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher.vue'
import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import * as config from '@/router/config'
import { SHOW_FIRST_TIME_GUIDE, SHOW_MAIN_PAGE_QRCODE } from '@/utils/constant'
import { getConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'

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

const visiblePicBeds = computed(() => picBedG.value.filter(item => item.visible))

const navigationItems = computed(() => [
  { name: t('navigation.upload'), path: '/main-page/upload', icon: UploadIcon },
  { name: t('navigation.manage'), path: '/main-page/manage-login-page', icon: Cloud },
  { name: t('navigation.gallery'), path: '/main-page/gallery', icon: ImagesIcon },
  { name: t('navigation.settings'), path: '/main-page/settings', icon: Settings },
  {
    name: t('navigation.plugins'),
    path: '/main-page/plugins',
    icon: PlugIcon,
  },
])

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

function isPicBedPathActive(type: string): boolean {
  return route.name === routerConfig.UPLOADER_CONFIG_PAGE && route.params.type === type
}

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
