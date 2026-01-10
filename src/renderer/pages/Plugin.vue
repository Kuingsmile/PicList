<template>
  <div class="plugin-container">
    <!-- Header Card -->
    <div class="plugin-card header-card">
      <div class="card-header">
        <div class="header-content">
          <div class="header-icon">
            <DatabaseIcon :size="24" />
          </div>
          <div>
            <h1>{{ t('pages.plugin.title') }}</h1>
            <p>{{ t('pages.plugin.description') }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            class="action-button secondary"
            :title="t('pages.plugin.importLocal')"
            @click="handleImportLocalPlugin"
          >
            <DownloadIcon :size="16" />
            {{ t('pages.plugin.importLocal') }}
          </button>
          <button class="action-button secondary" :title="t('pages.plugin.updateAll')" @click="handleUpdateAllPlugin">
            <RefreshCwIcon :size="16" />
            {{ t('pages.plugin.updateAll') }}
          </button>
          <button class="action-button" :title="t('pages.plugin.pluginList')" @click="goAwesomeList">
            <ExternalLinkIcon :size="16" />
            {{ t('pages.plugin.list') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search Card -->
    <div class="plugin-card search-card">
      <div class="search-container">
        <div class="search-input-wrapper">
          <SearchIcon class="search-icon" :size="20" />
          <input
            v-model="searchText"
            type="text"
            class="search-input"
            :placeholder="t('pages.plugin.searchPlaceholder')"
          />
          <button v-if="searchText" class="clear-button" @click="cleanSearch">
            <XIcon :size="16" />
          </button>
        </div>
        <div class="search-options">
          <label class="strict-search-checkbox">
            <input v-model="strictSearch" type="checkbox" class="checkbox-input" />
            <span class="checkbox-label">{{ t('pages.plugin.strictSearch') }}</span>
            <span class="checkbox-description">{{ t('pages.plugin.strictSearchDescription') }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Reload Notice -->
    <transition name="notice">
      <div v-if="needReload" class="plugin-card notice-card">
        <div class="notice-content">
          <AlertCircleIcon class="notice-icon" :size="20" />
          <span class="notice-text">{{ t('pages.plugin.needRestart') }}</span>
          <button class="action-button small" @click="reloadApp">
            {{ t('pages.plugin.restartApp') }}
          </button>
        </div>
      </div>
    </transition>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner" />
      <span class="loading-text">{{ t('pages.plugin.loading') }}</span>
    </div>

    <!-- Plugin Grid -->
    <div class="plugin-grid">
      <div
        v-for="item in pluginList"
        :key="item.fullName"
        class="plugin-card plugin-item-card"
        :class="{ disabled: !item.enabled && !searchText }"
      >
        <!-- Plugin Badge -->
        <div v-if="!item.gui" class="cli-badge">CLI</div>

        <!-- Update Badge -->
        <div
          v-if="latestVersionMap[item.fullName] && latestVersionMap[item.fullName] !== item.version"
          class="update-badge"
        >
          NEW
        </div>

        <!-- Plugin Header -->
        <div class="plugin-header">
          <img class="plugin-logo" :src="item.logo" :onerror="setSrc" alt="" />
          <div class="plugin-info">
            <h3 class="plugin-name" @click="openHomepage(item.homepage)">
              {{ item.name }}
              <span class="plugin-version">v{{ item.version }}</span>
            </h3>
            <p class="plugin-author">
              {{ item.author.replace(/<.*>/, '') }}
            </p>
          </div>
        </div>

        <!-- Plugin Description -->
        <div class="plugin-description">
          <p :title="item.description">
            {{ item.description }}
          </p>
        </div>

        <!-- Plugin Actions -->
        <div class="plugin-actions">
          <template v-if="searchText">
            <template v-if="!item.hasInstall">
              <button v-if="!item.ing" class="plugin-button install-button" @click="installPlugin(item)">
                <DownloadIcon :size="16" />
                {{ t('pages.plugin.install') }}
              </button>
              <button v-else class="plugin-button installing-button" disabled>
                <div class="button-spinner" />
                {{ t('pages.plugin.installing') }}
              </button>
            </template>
            <button v-else class="plugin-button installed-button" disabled>
              <CheckIcon :size="16" />
              {{ t('pages.plugin.installed') }}
            </button>
          </template>
          <template v-else>
            <button v-if="item.ing" class="plugin-button processing-button" disabled>
              <div class="button-spinner" />
              {{ t('pages.plugin.doingSomething') }}
            </button>
            <template v-else>
              <button v-if="item.enabled" class="plugin-button settings-button" @click="buildContextMenu(item)">
                <SettingsIcon :size="16" />
                {{ t('pages.plugin.settings') }}
              </button>
              <button v-else class="plugin-button disabled-button" @click="buildContextMenu(item)">
                <XCircleIcon :size="16" />
                {{ t('pages.plugin.disabled') }}
              </button>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && pluginList.length === 0" class="plugin-card empty-state">
      <div class="empty-content">
        <PackageIcon class="empty-icon" :size="48" />
        <h3>{{ searchText ? t('pages.plugin.noPluginsFound') : t('pages.plugin.NoPluginsInstalled') }}</h3>
        <p>{{ searchText ? t('pages.plugin.tryDifferentSearch') : t('pages.plugin.installPluginsToGetStarted') }}</p>
        <button v-if="!searchText" class="action-button" @click="goAwesomeList">
          <ExternalLinkIcon :size="16" />
          {{ t('pages.plugin.browsePlugins') }}
        </button>
      </div>
    </div>

    <!-- Config Modal -->
    <transition name="modal">
      <div v-if="dialogVisible" class="modal-overlay" @click="dialogVisible = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">
              {{ t('pages.plugin.configThing', { c: configName }) }}
            </h2>
            <button class="modal-close" @click="dialogVisible = false">
              <XIcon :size="20" />
            </button>
          </div>
          <div class="modal-content">
            <config-form
              :id="configName"
              ref="$configForm"
              :config="config"
              :type="currentType"
              color-mode="white"
              mode="plugin"
              :show-tooltips="false"
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="dialogVisible = false">
              {{ t('common.cancel') }}
            </button>
            <button class="btn btn-primary" @click="handleConfirmConfig">
              {{ t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
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

function setSrc(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = import.meta.env.BASE_URL + 'roundLogo.png'
}

const npmSearchText = computed(() => {
  return searchText.value.match('picgo-plugin-')
    ? searchText.value
    : searchText.value !== ''
      ? `picgo-plugin-${searchText.value}`
      : searchText.value
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

watch(dialogVisible, (val: boolean) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
  }
})

async function getLatestVersionOfPlugIn(pluginName: string) {
  try {
    const res = await fetch(`https://registry.npmjs.com/${pluginName}`)
    const data = await res.json()
    latestVersionMap[pluginName] = data['dist-tags'].latest
  } catch (err) {
    console.error(err)
  }
}

const hideLoadingHandler = () => {
  loading.value = false
}

const picgoHandlePluginDoneHandler = (fullName: string) => {
  pluginList.value.forEach(item => {
    if (item.fullName === fullName || item.name === fullName) {
      item.ing = false
    }
  })
  loading.value = false
}

const pluginListHandler = (list: IPicGoPlugin[]) => {
  pluginList.value = list
  pluginNameList.value = list.map(item => item.fullName)
  for (const item of pluginList.value) {
    getLatestVersionOfPlugIn(item.fullName)
  }
  loading.value = false
}

const installPluginHandler = ({ success, body }: { success: boolean; body: string }) => {
  loading.value = false
  pluginList.value.forEach(item => {
    if (item.fullName === body) {
      item.ing = false
      item.hasInstall = success
    }
  })
}

const updateSuccessHandler = (plugin: string) => {
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

const uninstallSuccessHandler = (plugin: string) => {
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

const picgoConfigPluginHandler = (
  _currentType: 'plugin' | 'transformer' | 'uploader',
  _configName: string,
  _config: any,
) => {
  currentType.value = _currentType
  configName.value = _configName
  config.value = _config
  dialogVisible.value = true
}

const picgoHandlePluginIngHandler = (fullName: string) => {
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
      console.log(data)
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

<style scoped src="./css/PluginPage.css"></style>
