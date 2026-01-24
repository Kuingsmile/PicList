<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <div
        class="flex w-full items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-1">
          <DatabaseIcon :size="24" class="text-accent" />
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.plugin.title') }}</h1>
            <p class="m-0 text-sm text-secondary">{{ t('pages.plugin.description') }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 overflow-visible">
          <CustomButton
            type="secondary"
            :icon="DownloadIcon"
            :text="t('pages.plugin.importLocal')"
            @click="handleImportLocalPlugin"
          />
          <CustomButton
            type="secondary"
            :icon="RefreshCwIcon"
            :text="t('pages.plugin.updateAll')"
            @click="handleUpdateAllPlugin"
          />
          <CustomButton
            type="primary"
            :icon="ExternalLinkIcon"
            :text="t('pages.plugin.openRemoteList')"
            @click="goAwesomeList"
          />
          <CustomButton
            type="primary"
            :icon="SearchIcon"
            :text="t('pages.plugin.browseAllPlugins')"
            @click="openBrowsePluginsDialog"
          />
        </div>
      </div>

      <!-- Search Card -->
      <div
        class="flex w-full flex-row items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="relative flex flex-1 items-center">
          <SearchIcon class="absolute left-1 z-1 text-accent" :size="20" />
          <input
            v-model="searchText"
            type="text"
            class="w-full rounded-lg border border-border bg-bg-secondary px-8 py-3 text-sm text-main placeholder:text-secondary focus:border-accent focus:bg-bg-tertiary focus:shadow-md focus:outline-none"
            :placeholder="t('pages.plugin.searchPlaceholder')"
          />
          <button
            v-if="searchText"
            class="absolute right-2 flex items-center rounded-full border border-border bg-transparent text-danger hover:bg-danger/10"
            @click="cleanSearch"
          >
            <XIcon :size="16" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <label class="flex cursor-pointer flex-col gap-1 select-none">
            <input v-model="strictSearch" type="checkbox" class="peer hidden" />
            <span
              class="relative flex items-center gap-2 text-sm font-semibold text-secondary before:inline-block before:h-[16px] before:w-[16px] before:shrink-0 before:rounded-sm before:border-2 before:border-accent/50 before:bg-surface before:content-[''] peer-checked:before:border-accent peer-checked:before:bg-accent peer-checked:after:absolute peer-checked:after:top-[2px] peer-checked:after:left-[5px] peer-checked:after:h-[9px] peer-checked:after:w-[5px] peer-checked:after:rotate-45 peer-checked:after:border-r-2 peer-checked:after:border-b-2 peer-checked:after:border-white peer-checked:after:content-[''] before:hover:bg-accent"
            >
              {{ t('pages.plugin.strictSearch') }}
            </span>
            <span class="ml-[24px] text-xs font-semibold text-secondary">{{
              t('pages.plugin.strictSearchDescription')
            }}</span>
          </label>
        </div>
      </div>

      <!-- Reload Notice -->
      <transition name="notice">
        <div
          v-if="needReload"
          class="flex w-full flex-row items-center justify-center gap-4 overflow-visible rounded-2xl border border-border-secondary p-2 shadow-md max-md:items-stretch max-md:p-5"
        >
          <div class="flex items-center gap-2">
            <AlertCircleIcon class="shrink-0 text-warning" :size="22" />
            <span class="flex-1 text-sm font-bold text-secondary">{{ t('pages.plugin.needRestart') }}</span>
            <CustomButton
              type="primary"
              :icon="RefreshCwIcon"
              :text="t('pages.plugin.restartApp')"
              class="bg-warning/80"
              @click="reloadApp"
            />
          </div>
        </div>
      </transition>

      <!-- Loading Overlay -->
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center rounded-xl bg-black/15"
      >
        <div class="mb-5 h-10 w-10 animate-spin rounded-full border-4 border-t-3 border-border border-t-accent" />
        <span class="text-2xl font-bold text-white">{{ t('pages.plugin.loading') }}</span>
      </div>

      <!-- Plugin Grid -->
      <div
        v-if="pluginList.length > 0 && !loading"
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary p-1 shadow-md"
      >
        <div class="no-scrollbar h-full w-full overflow-auto rounded-sm">
          <div class="grid w-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 border-none p-4 max-md:gap-4">
            <div
              v-for="item in pluginList"
              :key="item.fullName"
              class="relative flex h-auto flex-col rounded-xl border-2 border-border-secondary p-6 shadow-md transition-all duration-200 ease-apple hover:border-accent hover:shadow-xl [.disabled]:opacity-70"
              :class="{ disabled: !item.enabled && !searchText }"
            >
              <!-- Plugin Badge -->
              <div
                v-if="!item.gui"
                class="absolute top-4 right-4 z-1 rounded-sm bg-accent/20 px-2 py-1 text-sm font-semibold text-secondary"
              >
                CLI
              </div>

              <!-- Update Badge -->
              <div
                v-if="latestVersionMap[item.fullName] && latestVersionMap[item.fullName] !== item.version"
                class="absolute top-4 right-4 z-1 rounded-sm bg-success px-2 py-1 text-sm font-semibold text-white"
              >
                NEW
              </div>

              <!-- Plugin Header -->
              <div class="mb-4 flex items-start gap-4">
                <img
                  class="h-[48px] w-[48px] shrink-0 rounded-lg object-cover"
                  :src="item.logo"
                  :onerror="setSrc"
                  alt=""
                />
                <div class="relative min-w-0 flex-1">
                  <div class="flex flex-row gap-3">
                    <h3
                      class="br-3 mb-1 flex cursor-pointer items-center overflow-hidden text-base font-semibold text-ellipsis whitespace-nowrap text-main hover:text-accent"
                      @click="openHomepage(item.homepage)"
                    >
                      {{ item.name }}
                      <span class="rounded-sm bg-bg-tertiary px-2 py-1 text-xs font-normal text-secondary"
                        >v{{ item.version }}</span
                      >
                    </h3>
                  </div>
                  <p class="m-0 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-secondary">
                    {{ item.author.replace(/<.*>/, '') }}
                  </p>
                </div>
              </div>

              <!-- Plugin Description -->
              <div class="mb-6 flex flex-1 items-start">
                <p
                  class="m-0 min-h-10 overflow-hidden text-sm leading-[1.5] font-semibold text-secondary"
                  :title="item.description"
                >
                  {{ item.description }}
                </p>
              </div>

              <!-- Plugin Actions -->
              <div class="mt-auto pt-4">
                <template v-if="searchText">
                  <template v-if="!item.hasInstall">
                    <button
                      v-if="!item.ing"
                      class="flex w-full cursor-pointer items-center gap-2 rounded-md border-none bg-success/90 px-4 py-3 font-[inherit] text-sm font-semibold text-white not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                      @click="installPlugin(item)"
                    >
                      <DownloadIcon :size="16" />
                      {{ t('pages.plugin.install') }}
                    </button>
                    <button
                      v-else
                      class="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-surface-elevated px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                      disabled
                    >
                      <div
                        class="h-[16px] w-[16px] animate-spin rounded-full border-2 border-t-2 border-transparent border-t-current"
                      />
                      {{ t('pages.plugin.installing') }}
                    </button>
                  </template>
                  <button
                    v-else
                    class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-success bg-success/30 px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                    disabled
                  >
                    <CheckIcon :size="16" />
                    {{ t('pages.plugin.installed') }}
                  </button>
                </template>
                <template v-else>
                  <button
                    v-if="item.ing"
                    class="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-surface-elevated px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                    disabled
                  >
                    <div
                      class="h-[16px] w-[16px] animate-spin rounded-full border-2 border-t-2 border-transparent border-t-current"
                    />
                    {{ t('pages.plugin.doingSomething') }}
                  </button>
                  <template v-else>
                    <button
                      v-if="item.enabled"
                      class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-secondary px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                      @click="buildContextMenu(item)"
                    >
                      <SettingsIcon :size="16" />
                      {{ t('pages.plugin.settings') }}
                    </button>
                    <button
                      v-else
                      class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-secondary px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px not-disabled:hover:border-warning not-disabled:hover:bg-surface-elevated not-disabled:hover:text-warning disabled:cursor-not-allowed disabled:opacity-70"
                      @click="buildContextMenu(item)"
                    >
                      <XCircleIcon :size="16" />
                      {{ t('pages.plugin.disabled') }}
                    </button>
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!loading && pluginList.length === 0"
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary p-1 shadow-md"
      >
        <div class="flex flex-col items-center gap-4 text-center">
          <PackageIcon class="text-secondary" :size="48" />
          <h3 class="m-0 text-lg font-semibold text-main">
            {{ searchText ? t('pages.plugin.noPluginsFound') : t('pages.plugin.NoPluginsInstalled') }}
          </h3>
          <p class="m-0 max-w-[400px] text-sm font-semibold text-secondary">
            {{ searchText ? t('pages.plugin.tryDifferentSearch') : t('pages.plugin.installPluginsToGetStarted') }}
          </p>
          <CustomButton
            v-if="!searchText"
            type="primary"
            :icon="ExternalLinkIcon"
            :text="t('pages.plugin.browsePlugins')"
            @click="goAwesomeList"
          />
        </div>
      </div>
    </div>

    <!-- Config Modal -->
    <transition name="modal">
      <CustomModal
        v-if="dialogVisible"
        v-model:visible="dialogVisible"
        :title="t('pages.plugin.configThing', { c: configName })"
        width="600px"
        height="auto"
      >
        <div class="flex-1 overflow-y-auto p-4">
          <config-form :id="configName" ref="$configForm" :config="config" :type="currentType" mode="plugin" />
        </div>
        <template #footer>
          <CustomButton type="secondary" :text="t('common.cancel')" @click="dialogVisible = false" />
          <CustomButton type="primary" :text="t('common.confirm')" @click="handleConfirmConfig" />
        </template>
      </CustomModal>
    </transition>

    <!-- Browse All Plugins Modal -->
    <transition name="modal">
      <CustomModal
        v-if="showBrowseDialog"
        v-model:visible="showBrowseDialog"
        :title="t('pages.plugin.browseAllPlugins')"
      >
        <div class="flex h-full w-full flex-col gap-4 p-4">
          <div class="shrink-0">
            <div class="relative flex items-center">
              <SearchIcon class="absolute left-4 z-10 text-secondary" :size="20" />
              <input
                v-model="browseSearchText"
                type="text"
                class="w-full rounded-lg border border-border bg-bg-secondary pt-3 pr-4 pb-3 pl-12 font-[inherit] text-sm text-main placeholder:text-secondary focus:border-accent focus:bg-bg-tertiary focus:shadow-md focus:outline-none"
                :placeholder="t('pages.plugin.searchInBrowse')"
              />
              <button
                v-if="browseSearchText"
                class="absolute right-2 flex items-center rounded-full border border-border bg-transparent text-danger hover:bg-danger/10"
                @click="browseSearchText = ''"
              >
                <XIcon :size="16" />
              </button>
            </div>
          </div>
          <div v-if="loadingBrowse" class="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            <div
              class="h-12 w-12 animate-spin rounded-full border-[3px] border-t-[3px] border-border border-t-accent"
            />
            <span class="text-sm font-semibold text-accent">{{ t('pages.plugin.loadingPlugins') }}</span>
          </div>
          <div v-else class="flex-1 overflow-hidden rounded-md border border-border shadow-md">
            <div class="grid h-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 overflow-auto p-4">
              <div
                v-for="item in filteredBrowsePlugins"
                :key="item.fullName"
                class="relative flex h-auto flex-col rounded-xl border-2 border-border-secondary p-6 shadow-md transition-all duration-200 ease-apple hover:border-accent hover:shadow-xl [.disabled]:opacity-70"
              >
                <div class="mb-4 flex items-start gap-4">
                  <img
                    class="h-[48px] w-[48px] shrink-0 rounded-lg object-cover"
                    :src="item.logo"
                    :onerror="setSrc"
                    alt=""
                  />
                  <div class="relative min-w-0 flex-1">
                    <h3
                      class="br-3 mb-1 flex cursor-pointer items-center overflow-hidden text-base font-semibold text-ellipsis whitespace-nowrap text-main hover:text-accent"
                      @click="openHomepage(item.homepage)"
                    >
                      {{ item.name }}
                      <span class="rounded-sm bg-bg-tertiary px-2 py-1 text-xs font-normal text-secondary"
                        >v{{ item.version }}</span
                      >
                      <div
                        v-if="!item.gui"
                        class="absolute top-4 right-4 z-1 rounded-sm bg-accent/20 px-2 py-1 text-sm font-semibold text-secondary"
                      >
                        CLI
                      </div>
                    </h3>
                    <p class="m-0 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-secondary">
                      {{ item.author }}
                    </p>
                  </div>
                </div>
                <div class="mb-6 flex flex-1 items-start">
                  <p
                    class="m-0 min-h-10 overflow-hidden text-sm leading-[1.5] font-semibold text-secondary"
                    :title="item.description"
                  >
                    {{ item.description }}
                  </p>
                </div>
                <div class="mt-auto pt-4">
                  <template v-if="!item.hasInstall">
                    <button
                      v-if="!item.ing"
                      class="flex w-full cursor-pointer items-center gap-2 rounded-md border-none bg-success/90 px-4 py-3 font-[inherit] text-sm font-semibold text-white not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                      @click="installPluginFromBrowse(item)"
                    >
                      <DownloadIcon :size="16" />
                      {{ t('pages.plugin.install') }}
                    </button>
                    <button
                      v-else
                      class="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-surface-elevated px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                      disabled
                    >
                      <div
                        class="h-[16px] w-[16px] animate-spin rounded-full border-2 border-t-2 border-transparent border-t-current"
                      />
                      {{ t('pages.plugin.installing') }}
                    </button>
                  </template>
                  <button
                    v-else
                    class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-success bg-success/30 px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
                    disabled
                  >
                    <CheckIcon :size="16" />
                    {{ t('pages.plugin.installed') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="!loadingBrowse && filteredBrowsePlugins.length === 0"
            class="flex flex-col items-center gap-4 text-center"
          >
            <PackageIcon class="text-secondary opacity-50" :size="48" />
            <h3 class="m-0 text-lg font-semibold text-main">{{ t('pages.plugin.noPluginsFound') }}</h3>
            <p class="m-0 max-w-[400px] text-sm text-secondary">{{ t('pages.plugin.tryDifferentSearch') }}</p>
          </div>
        </div>
      </CustomModal>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import { debounce, DebouncedFunc } from 'lodash-es'
import {
  AlertCircleIcon,
  CheckIcon,
  DatabaseIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PackageIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-vue-next'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, toRaw, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import ConfigForm from '@/components/UnifiedConfigForm.vue'
import { usePicBed } from '@/hooks/useGlobal'
import { getRawData, handleStreamlinePluginName } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import {
  PICGO_CONFIG_PLUGIN,
  PICGO_HANDLE_PLUGIN_DONE,
  PICGO_HANDLE_PLUGIN_ING,
  PICGO_TOGGLE_PLUGIN,
} from '@/utils/constant'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { IRPCActionType } from '@/utils/enum'

const { t } = useI18n()
const { updatePicBeds } = usePicBed()
const searchText = ref('')
const pluginList = ref<IPicGoPlugin[]>([])
const config = ref<any[]>([])
const currentType = ref<'plugin' | 'uploader' | 'transformer'>('plugin')
const configName = ref('')
const dialogVisible = ref(false)
const pluginNameList = ref<string[]>([])
const loading = ref(true)
const needReload = ref(false)
const latestVersionMap = reactive<Record<string, string>>({})
const $configForm = useTemplateRef('$configForm')
const strictSearch = useStorage('plugin-strict-search', true)
const showBrowseDialog = ref(false)
const browseSearchText = ref('')
const browsePlugins = ref<IPicGoPlugin[]>([])
const loadingBrowse = ref(false)

const npmSearchText = computed(() => {
  return searchText.value.match('picgo-plugin-')
    ? searchText.value
    : searchText.value !== ''
      ? `picgo-plugin-${searchText.value}`
      : searchText.value
})

const filteredBrowsePlugins = computed(() => {
  if (!browseSearchText.value) {
    return browsePlugins.value
  }
  const search = browseSearchText.value.toLowerCase()
  return browsePlugins.value.filter(plugin => {
    return (
      plugin.name.toLowerCase().includes(search) ||
      plugin.fullName.toLowerCase().includes(search) ||
      plugin.description?.toLowerCase().includes(search) ||
      plugin.author?.toLowerCase().includes(search)
    )
  })
})

let getSearchResult: DebouncedFunc<(val: string) => void>

watch(npmSearchText, (val: string) => {
  if (val) {
    pluginList.value = []
    getSearchResult(val)
  } else {
    getPluginList()
  }
})

watch(showBrowseDialog, (val: boolean) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }
})

function setSrc(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = import.meta.env.BASE_URL + 'roundLogo.png'
}

async function getLatestVersionOfPlugIn(pluginName: string) {
  try {
    const res = await fetch(`https://registry.npmjs.com/${pluginName}`)
    const data = await res.json()
    latestVersionMap[pluginName] = data['dist-tags'].latest
  } catch (err) {
    console.error(err)
  }
}

function hideLoadingHandler() {
  loading.value = false
}

function picgoHandlePluginDoneHandler(fullName: string) {
  pluginList.value.forEach(item => {
    if (item.fullName === fullName || item.name === fullName) {
      item.ing = false
    }
  })
  loading.value = false
}

function pluginListHandler(list: IPicGoPlugin[]) {
  pluginList.value = list
  pluginNameList.value = list.map(item => item.fullName)
  for (const item of pluginList.value) {
    getLatestVersionOfPlugIn(item.fullName)
  }
  loading.value = false
}

function installPluginHandler({ success, body }: { success: boolean; body: string }) {
  loading.value = false
  pluginList.value.forEach(item => {
    if (item.fullName === body) {
      item.ing = false
      item.hasInstall = success
    }
  })
  // Update browse dialog if open
  browsePlugins.value.forEach(item => {
    if (item.fullName === body) {
      item.ing = false
      item.hasInstall = success
    }
  })
}

function updateSuccessHandler(plugin: string) {
  loading.value = false
  pluginList.value.forEach(item => {
    if (item.fullName === plugin) {
      item.ing = false
      item.hasInstall = true
    }
    updatePicBeds()
  })
  handleReload()
  getPluginList()
}

function uninstallSuccessHandler(plugin: string) {
  loading.value = false
  pluginList.value = pluginList.value.filter(item => {
    if (item.fullName === plugin) {
      // restore Uploader & Transformer after uninstalling
      if (item.config.transformer.name) {
        handleRestoreState('transformer', item.config.transformer.name)
      }
      if (item.config.uploader.name) {
        handleRestoreState('uploader', item.config.uploader.name)
      }
      updatePicBeds()
    }
    return item.fullName !== plugin
  })
  pluginNameList.value = pluginNameList.value.filter(item => item !== plugin)
}

function picgoConfigPluginHandler(
  _currentType: 'plugin' | 'transformer' | 'uploader',
  _configName: string,
  _config: any,
) {
  currentType.value = _currentType
  configName.value = _configName
  config.value = _config
  dialogVisible.value = true
}

function picgoHandlePluginIngHandler(fullName: string) {
  pluginList.value.forEach(item => {
    if (item.fullName === fullName || item.name === fullName) {
      item.ing = true
    }
  })
}

const picgoTogglePluginHandler = (fullName: string, enabled: boolean) => {
  const plugin = pluginList.value.find(item => item.fullName === fullName)
  if (plugin) {
    plugin.enabled = enabled
    updatePicBeds()
    needReload.value = true
  }
}

async function buildContextMenu(plugin: IPicGoPlugin) {
  window.electron.sendRPC(IRPCActionType.SHOW_PLUGIN_PAGE_MENU, getRawData(plugin))
}

function getPluginList() {
  window.electron.sendRPC(IRPCActionType.PLUGIN_GET_LIST)
}

function installPlugin(item: IPicGoPlugin) {
  if (!item.gui) {
    if (confirm(t('pages.plugin.notGuiImplement'))) {
      item.ing = true
      window.electron.sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
    }
  } else {
    item.ing = true
    window.electron.sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
  }
}

function reloadApp() {
  window.electron.sendRPC(IRPCActionType.RELOAD_APP)
}

async function handleReload() {
  saveConfig({
    needReload: true,
  })
  needReload.value = true
  if ('Notification' in window) {
    const successNotification = new Notification(t('pages.plugin.updateSuccess'), {
      body: t('pages.plugin.needRestart'),
    })
    successNotification.onclick = () => {
      reloadApp()
    }
  }
}

function cleanSearch() {
  searchText.value = ''
}

async function handleConfirmConfig() {
  const result = (await $configForm.value?.validate()) || false
  if (result !== false) {
    switch (currentType.value) {
      case 'plugin':
        saveConfig({
          [`${configName.value}`]: result,
        })
        break
      case 'uploader':
        saveConfig({
          [`picBed.${configName.value}`]: result,
        })
        break
      case 'transformer':
        saveConfig({
          [`transformer.${configName.value}`]: result,
        })
        break
    }
    if ('Notification' in window) {
      const successNotification = new Notification(t('pages.plugin.setResult'), {
        body: t('pages.plugin.setSuccess'),
      })
      successNotification.onclick = () => {
        return true
      }
    }
    dialogVisible.value = false
    getPluginList()
  }
}

function _getSearchResult(val: string) {
  fetch(`https://registry.npmjs.com/-/v1/search?text=${val}`)
    .then(async (res: Response) => {
      const data = await res.json()
      pluginList.value = data.objects
        .filter((item: INPMSearchResultObject) => {
          return strictSearch.value
            ? item.package.name.includes('picgo-plugin-') && item.package.name.includes(val)
            : item.package.name.includes('picgo-plugin-')
        })
        .map((item: INPMSearchResultObject) => {
          return handleSearchResult(item)
        })
      loading.value = false
    })
    .catch((err: any) => {
      console.log(err)
      loading.value = false
    })
}

function handleSearchResult(item: INPMSearchResultObject) {
  const pkg = item.package
  const name = handleStreamlinePluginName(pkg.name)
  let gui = false
  if (pkg.keywords && pkg.keywords.length > 0) {
    if (pkg.keywords.includes('picgo-gui-plugin')) {
      gui = true
    }
  }
  return {
    name,
    fullName: pkg.name,
    author: pkg.author?.name || pkg.publisher?.username || 'unknown',
    description: pkg.description,
    logo: `https://cdn.jsdelivr.net/npm/${pkg.name}/logo.png`,
    config: {},
    homepage: pkg.links ? pkg.links.homepage : '',
    hasInstall: pluginNameList.value.some(plugin => plugin === pkg.name),
    version: pkg.version,
    gui,
    ing: false, // installing or uninstalling
  }
}

// restore Uploader & Transformer
async function handleRestoreState(item: string, name: string) {
  if (item === 'uploader') {
    const current = await getConfig(configPaths.picBed.current)
    if (current === name) {
      saveConfig({
        [configPaths.picBed.current]: 'smms',
        [configPaths.picBed.uploader]: 'smms',
      })
    }
  }
  if (item === 'transformer') {
    const current = await getConfig(configPaths.picBed.transformer)
    if (current === name) {
      saveConfig({
        [configPaths.picBed.transformer]: 'path',
      })
    }
  }
}

function openHomepage(url: string) {
  if (url) {
    window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
  }
}

function goAwesomeList() {
  window.electron.sendRPC(IRPCActionType.OPEN_URL, 'https://github.com/PicGo/Awesome-PicGo')
}

async function openBrowsePluginsDialog() {
  showBrowseDialog.value = true
  browseSearchText.value = ''
  await fetchAllPlugins()
}

async function fetchAllPlugins() {
  loadingBrowse.value = true
  try {
    const res = await fetch('https://registry.npmjs.com/-/v1/search?text=picgo-plugin-&size=250')
    const data = await res.json()
    browsePlugins.value = data.objects
      .filter((item: INPMSearchResultObject) => {
        return item.package.name.startsWith('picgo-plugin-')
      })
      .map((item: INPMSearchResultObject) => {
        return handleSearchResult(item)
      })
      .sort((a: IPicGoPlugin, b: IPicGoPlugin) => {
        return b.fullName.localeCompare(a.fullName)
      })
  } catch (err) {
    console.error('Failed to fetch plugins:', err)
  } finally {
    loadingBrowse.value = false
  }
}

function installPluginFromBrowse(item: IPicGoPlugin) {
  if (!item.gui) {
    if (confirm(t('pages.plugin.notGuiImplement'))) {
      item.ing = true
      window.electron.sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
    }
  } else {
    item.ing = true
    window.electron.sendRPC(IRPCActionType.PLUGIN_INSTALL, item.fullName)
  }
}

function handleImportLocalPlugin() {
  window.electron.sendRPC(IRPCActionType.PLUGIN_IMPORT_LOCAL)
  loading.value = true
}

function handleUpdateAllPlugin() {
  window.electron.sendRPC(IRPCActionType.PLUGIN_UPDATE_ALL, toRaw(pluginNameList.value))
}

onBeforeMount(async () => {
  window.electron.ipcRendererOn('hideLoading', hideLoadingHandler)
  window.electron.ipcRendererOn(PICGO_HANDLE_PLUGIN_DONE, picgoHandlePluginDoneHandler)
  window.electron.ipcRendererOn('pluginList', pluginListHandler)
  window.electron.ipcRendererOn('installPlugin', installPluginHandler)
  window.electron.ipcRendererOn('updateSuccess', updateSuccessHandler)
  window.electron.ipcRendererOn('uninstallSuccess', uninstallSuccessHandler)
  window.electron.ipcRendererOn(PICGO_CONFIG_PLUGIN, picgoConfigPluginHandler)
  window.electron.ipcRendererOn(PICGO_HANDLE_PLUGIN_ING, picgoHandlePluginIngHandler)
  window.electron.ipcRendererOn(PICGO_TOGGLE_PLUGIN, picgoTogglePluginHandler)
  getPluginList()
  getSearchResult = debounce(_getSearchResult, 50)
  needReload.value = (await getConfig<boolean>(configPaths.needReload)) || false
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners('pluginList')
  window.electron.ipcRendererRemoveAllListeners('installPlugin')
  window.electron.ipcRendererRemoveAllListeners('uninstallSuccess')
  window.electron.ipcRendererRemoveAllListeners('updateSuccess')
  window.electron.ipcRendererRemoveAllListeners('hideLoading')
  window.electron.ipcRendererRemoveAllListeners(PICGO_HANDLE_PLUGIN_DONE)
  window.electron.ipcRendererRemoveAllListeners(PICGO_CONFIG_PLUGIN)
  window.electron.ipcRendererRemoveAllListeners(PICGO_HANDLE_PLUGIN_ING)
  window.electron.ipcRendererRemoveAllListeners(PICGO_TOGGLE_PLUGIN)

  // Reset body overflow
  document.body.style.overflow = 'auto'
})
</script>

<script lang="ts">
export default {
  name: 'PluginPage',
}
</script>
