<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <div
        class="flex w-full items-center justify-between gap-4 overflow-visible rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-1">
          <PlugIcon :size="24" class="text-accent" />
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
          <CustomButton :icon="ExternalLinkIcon" :text="t('pages.plugin.openRemoteList')" @click="goAwesomeList" />
          <CustomButton
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
        <CustomSwitch
          v-model="experimentalBundledNpm"
          no-border
          small
          :title="t('pages.plugin.bundledNpmTitle')"
          :description="t('pages.plugin.bundledNpmDescription')"
          @update:model-value="saveBundledNpmSetting"
        />
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
            <PluginCard
              v-for="item in pluginList"
              :key="item.fullName"
              :item="item"
              :install-mode="!!searchText"
              :latest-version="latestVersionMap[item.fullName]"
              :updated-at="updateTimeMap[item.fullName]"
              @install="installPlugin"
              @settings="buildContextMenu"
            />
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
            :icon="ExternalLinkIcon"
            :text="t('pages.plugin.browsePlugins')"
            @click="goAwesomeList"
          />
        </div>
      </div>
    </div>

    <!-- Config Modal -->
    <PluginConfigDialog
      v-model:visible="dialogVisible"
      :config-name="configName"
      :current-type="currentType"
      :config="config"
      @saved="getPluginList"
    />

    <!-- Browse All Plugins Modal -->
    <PluginBrowseDialog
      v-model:visible="showBrowseDialog"
      v-model:search-text="browseSearchText"
      :filtered-browse-plugins="filteredBrowsePlugins"
      :loading-browse="loadingBrowse"
      @install="installPlugin"
    />
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PackageIcon,
  PlugIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PluginBrowseDialog from '@/components/plugins/PluginBrowseDialog.vue'
import PluginCard from '@/components/plugins/PluginCard.vue'
import PluginConfigDialog from '@/components/plugins/PluginConfigDialog.vue'
import { usePlugins } from '@/composables/plugins/usePlugins'

defineOptions({ name: 'PluginPage' })
const { t } = useI18n()
const {
  pluginList,
  config,
  currentType,
  configName,
  dialogVisible,
  loading,
  needReload,
  experimentalBundledNpm,
  saveBundledNpmSetting,
  buildContextMenu,
  getPluginList,
  installPlugin,
  reloadApp,
  cleanSearch,
  goAwesomeList,
  handleImportLocalPlugin,
  handleUpdateAllPlugin,
  searchText,
  strictSearch,
  latestVersionMap,
  updateTimeMap,
  showBrowseDialog,
  browseSearchText,
  loadingBrowse,
  filteredBrowsePlugins,
  openBrowsePluginsDialog,
} = usePlugins()
</script>
