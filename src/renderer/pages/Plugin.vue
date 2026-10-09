<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div
      class="relative z-1 flex h-full w-full min-w-0 flex-col items-center justify-start gap-4 rounded-xl border-none p-4"
    >
      <!-- Header -->
      <header
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:p-5"
      >
        <div class="flex min-w-0 flex-1 items-center gap-4 p-1">
          <PlugIcon :size="24" class="shrink-0 text-accent" aria-hidden="true" />
          <div class="min-w-0">
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.plugin.title') }}</h1>
            <p class="m-0 flex flex-wrap items-center gap-x-2 text-sm text-secondary tabular-nums" aria-live="polite">
              <span>{{ t('pages.plugin.installedCount', pluginList.length) }}</span>
              <template v-if="updatablePlugins.length">
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  class="cursor-pointer font-medium text-accent hover:underline focus-visible:focus-ring"
                  @click="showUpdates"
                >
                  {{ t('pages.plugin.updatesAvailable', updatablePlugins.length) }}
                </button>
              </template>
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <CustomButton
            type="secondary"
            :icon="FolderInputIcon"
            :text="t('pages.plugin.importLocal')"
            @click="handleImportLocalPlugin"
          />
          <CustomButton
            type="secondary"
            :icon="RefreshCwIcon"
            :disabled="pluginList.length === 0 || anyBusy"
            :text="t('pages.plugin.updateAll')"
            @click="handleUpdateAllPlugin"
          />
        </div>
      </header>

      <!-- Restart notice -->
      <Transition name="notice">
        <div
          v-if="needReload"
          class="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-warning/50 bg-warning/10 px-5 py-2.5 shadow-md"
          role="status"
        >
          <AlertCircleIcon class="shrink-0 text-warning" :size="20" aria-hidden="true" />
          <span class="min-w-0 flex-1 text-sm font-medium text-main">{{ t('pages.plugin.needRestartHint') }}</span>
          <CustomButton :icon="RotateCwIcon" :text="t('pages.plugin.restartApp')" @click="reloadApp" />
        </div>
      </Transition>

      <!-- Toolbar -->
      <div
        class="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-border-secondary px-4 py-3 shadow-md"
      >
        <div
          class="flex h-[36px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5"
          role="group"
          :aria-label="t('pages.plugin.title')"
        >
          <CustomButton
            type="tab"
            :icon="PackageIcon"
            :icon-size="14"
            :active="activeTab === 'installed'"
            class="h-full px-3! py-0!"
            @click="activeTab = 'installed'"
          >
            <span class="text-sm font-semibold">{{ t('pages.plugin.installedTab') }}</span>
            <span
              class="min-w-[18px] rounded-full px-1 text-[11px] font-semibold tabular-nums"
              :class="activeTab === 'installed' ? 'bg-white/25' : 'bg-bg-tertiary'"
            >
              {{ pluginList.length }}
            </span>
          </CustomButton>
          <CustomButton
            type="tab"
            :icon="CompassIcon"
            :icon-size="14"
            :active="activeTab === 'discover'"
            :text="t('pages.plugin.discoverTab')"
            class="h-full px-3! py-0!"
            @click="activeTab = 'discover'"
          />
        </div>

        <div class="relative flex min-w-[200px] flex-1 items-center">
          <SearchIcon :size="16" class="pointer-events-none absolute left-3 text-secondary" aria-hidden="true" />
          <input
            v-if="activeTab === 'installed'"
            v-model="installedQuery"
            type="search"
            class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-8 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
            :placeholder="t('pages.plugin.filterInstalled')"
            :aria-label="t('pages.plugin.filterInstalled')"
          />
          <input
            v-else
            v-model="searchText"
            type="search"
            class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-8 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
            :placeholder="t('pages.plugin.searchNpm')"
            :aria-label="t('pages.plugin.searchNpm')"
          />
          <button
            v-if="activeQuery"
            type="button"
            class="absolute right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
            :aria-label="t('common.clear')"
            @click="clearQuery"
          >
            <XIcon :size="14" aria-hidden="true" />
          </button>
        </div>

        <div
          v-if="activeTab === 'installed' && pluginList.length > 0"
          class="flex h-[36px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5"
          role="group"
          :aria-label="t('pages.plugin.statusFilter')"
        >
          <CustomButton
            v-for="option in statusOptions"
            :key="option.value"
            type="tab"
            :active="statusFilter === option.value"
            class="h-full px-2.5! py-0!"
            @click="statusFilter = option.value"
          >
            <span class="text-sm font-semibold">{{ option.label }}</span>
            <span v-if="option.count" class="text-xs tabular-nums opacity-80">{{ option.count }}</span>
          </CustomButton>
        </div>
        <template v-else-if="activeTab === 'discover'">
          <CustomSwitch
            v-model="strictSearch"
            small
            no-border
            no-hover
            tighter
            class="h-[36px] px-2"
            :title="t('pages.plugin.strictSearch')"
            :tips="t('pages.plugin.strictSearchDescription')"
          />
          <button
            type="button"
            class="flex h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring"
            @click="goAwesomeList"
          >
            <ExternalLinkIcon :size="15" aria-hidden="true" />{{ t('pages.plugin.awesomeList') }}
          </button>
        </template>
      </div>

      <!-- Content -->
      <section
        class="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-border-secondary shadow-md"
        :aria-busy="contentLoading || undefined"
      >
        <!-- Discover results bar -->
        <div
          v-if="activeTab === 'discover' && !discoverFailed"
          class="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-secondary px-4 py-2"
        >
          <div
            class="flex min-w-0 flex-1 items-center gap-2 text-xs whitespace-nowrap text-secondary tabular-nums"
            aria-live="polite"
          >
            <LoaderCircle
              v-if="discoverLoading"
              :size="13"
              class="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ statusLine }}
          </div>
          <div
            class="flex h-[32px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5"
            role="group"
            :aria-label="t('pages.plugin.discoverFilters')"
          >
            <CustomButton
              type="tab"
              :icon="AppWindowIcon"
              :icon-size="14"
              :active="guiOnly"
              :text="t('pages.plugin.guiOnly')"
              class="h-full px-2.5! py-0!"
              @click="guiOnly = !guiOnly"
            />
            <CustomButton
              type="tab"
              :icon="EyeOffIcon"
              :icon-size="14"
              :active="hideInstalled"
              :text="t('pages.plugin.hideInstalled')"
              class="h-full px-2.5! py-0!"
              @click="hideInstalled = !hideInstalled"
            />
          </div>
          <div class="flex items-center gap-2">
            <SingleSelect
              v-model="discoverSort"
              class="h-[32px] min-w-[150px]"
              :title="t('pages.plugin.sortBy')"
              :custom-front-icon="ArrowDownUpIcon"
              :select-list="sortOptions"
            />
          </div>
        </div>

        <div class="no-scrollbar flex min-h-0 flex-1 flex-col overflow-auto p-4">
          <!-- Status line -->
          <div
            v-if="activeTab === 'installed' && statusLine"
            class="mb-3 flex items-center gap-2 text-xs text-secondary tabular-nums"
            aria-live="polite"
          >
            <LoaderCircle
              v-if="contentLoading"
              :size="13"
              class="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ statusLine }}
          </div>

          <!-- Skeleton -->
          <div
            v-if="showSkeleton"
            class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
            aria-hidden="true"
          >
            <div
              v-for="n in 6"
              :key="n"
              class="flex h-[168px] animate-pulse flex-col gap-3 rounded-lg border border-border bg-bg-secondary p-4 motion-reduce:animate-none"
            >
              <div class="flex items-center gap-3">
                <div class="h-[40px] w-[40px] rounded-lg bg-bg-tertiary" />
                <div class="flex flex-1 flex-col gap-2">
                  <div class="h-3 w-1/2 rounded bg-bg-tertiary" />
                  <div class="h-2.5 w-1/3 rounded bg-bg-tertiary" />
                </div>
              </div>
              <div class="h-2.5 w-full rounded bg-bg-tertiary" />
              <div class="h-2.5 w-4/5 rounded bg-bg-tertiary" />
            </div>
          </div>

          <!-- Error -->
          <div
            v-else-if="activeTab === 'discover' && discoverFailed"
            class="m-auto flex max-w-[420px] flex-col items-center gap-3 py-10 text-center"
          >
            <CloudOffIcon class="text-secondary" :size="40" aria-hidden="true" />
            <h2 class="m-0 text-base font-semibold text-main">{{ t('pages.plugin.loadFailed') }}</h2>
            <p class="m-0 text-sm text-secondary">{{ t('pages.plugin.loadFailedHint') }}</p>
            <CustomButton :icon="RotateCwIcon" :text="t('pages.plugin.retry')" @click="retryDiscover" />
          </div>

          <!-- Grid -->
          <div v-else-if="visiblePlugins.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            <PluginCard
              v-for="item in visiblePlugins"
              :key="item.fullName"
              :item="item"
              :install-mode="activeTab === 'discover'"
              :latest-version="activeTab === 'installed' ? latestVersionMap[item.fullName] : undefined"
              :updated-at="activeTab === 'installed' ? updateTimeMap[item.fullName] : item.date"
              @install="installPlugin"
              @update="updatePlugin"
              @manage="buildContextMenu"
            />
          </div>

          <!-- Empty -->
          <div v-else class="m-auto flex max-w-[420px] flex-col items-center gap-3 py-10 text-center">
            <component :is="emptyState.icon" class="text-secondary" :size="40" aria-hidden="true" />
            <h2 class="m-0 text-base font-semibold text-main">{{ emptyState.title }}</h2>
            <p class="m-0 text-sm text-secondary">{{ emptyState.description }}</p>
            <CustomButton
              v-if="emptyState.action"
              :icon="emptyState.action.icon"
              :text="emptyState.action.text"
              @click="emptyState.action.run"
            />
          </div>
        </div>

        <!-- Install settings -->
        <footer class="flex shrink-0 flex-wrap items-center gap-2 border-t border-border-secondary px-4 py-1.5">
          <CustomSwitch
            v-model="experimentalBundledNpm"
            small
            no-border
            no-hover
            tighter
            class="py-1"
            :title="t('pages.plugin.bundledNpmTitle')"
            :tips="t('pages.plugin.bundledNpmDescription')"
            @update:model-value="saveBundledNpmSetting"
          />
        </footer>
      </section>
    </div>

    <PluginConfigDialog
      v-model:visible="dialogVisible"
      :config-name="configName"
      :current-type="currentType"
      :config="config"
      @saved="getPluginList"
    />
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircleIcon,
  AppWindowIcon,
  ArrowDownUpIcon,
  CloudOffIcon,
  CompassIcon,
  ExternalLinkIcon,
  EyeOffIcon,
  FolderInputIcon,
  LoaderCircle,
  PackageIcon,
  PackageSearchIcon,
  PlugIcon,
  RefreshCwIcon,
  RotateCwIcon,
  SearchIcon,
  SearchXIcon,
  SparklesIcon,
  XIcon,
} from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { type Component, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import PluginCard from '@/components/plugins/PluginCard.vue'
import PluginConfigDialog from '@/components/plugins/PluginConfigDialog.vue'
import { usePlugins } from '@/composables/plugins/usePlugins'

defineOptions({ name: 'PluginPage' })

type StatusFilter = 'all' | 'updates' | 'disabled'
type DiscoverSort = 'relevance' | 'downloads' | 'updated' | 'name'

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
  updatablePlugins,
  buildContextMenu,
  getPluginList,
  installPlugin,
  updatePlugin,
  reloadApp,
  goAwesomeList,
  handleImportLocalPlugin,
  handleUpdateAllPlugin,
  searchText,
  strictSearch,
  latestVersionMap,
  updateTimeMap,
  discoverPlugins,
  discoverLoading,
  discoverFailed,
  loadBrowsePlugins,
  retryDiscover,
} = usePlugins()

const activeTab = useStorage<'installed' | 'discover'>('plugin-page-tab', 'installed')
const installedQuery = ref('')
const statusFilter = ref<StatusFilter>('all')
const discoverSort = useStorage<DiscoverSort>('plugin-discover-sort', 'downloads')
const guiOnly = ref(false)
const hideInstalled = ref(false)

const anyBusy = computed(() => pluginList.value.some(item => item.ing))
const disabledCount = computed(() => pluginList.value.filter(item => !item.enabled).length)
const activeQuery = computed(() => (activeTab.value === 'installed' ? installedQuery.value : searchText.value))

const statusOptions = computed<{ value: StatusFilter; label: string; count?: number }[]>(() => [
  { value: 'all', label: t('pages.plugin.filterAll') },
  { value: 'updates', label: t('pages.plugin.filterUpdates'), count: updatablePlugins.value.length },
  { value: 'disabled', label: t('pages.plugin.filterDisabled'), count: disabledCount.value },
])

const sortOptions = computed<{ value: DiscoverSort; label: string }[]>(() => [
  { value: 'downloads', label: t('pages.plugin.sortDownloads') },
  { value: 'updated', label: t('pages.plugin.sortUpdated') },
  { value: 'name', label: t('pages.plugin.sortName') },
  { value: 'relevance', label: t('pages.plugin.sortRelevance') },
])

const discoverComparators: Record<Exclude<DiscoverSort, 'relevance'>, (a: IPicGoPlugin, b: IPicGoPlugin) => number> = {
  downloads: (a, b) => (b.downloads ?? 0) - (a.downloads ?? 0),
  updated: (a, b) => (b.date || '').localeCompare(a.date || ''),
  name: (a, b) => a.name.localeCompare(b.name),
}

const filteredDiscover = computed(() => {
  const list = discoverPlugins.value.filter(
    item => (!guiOnly.value || item.gui) && (!hideInstalled.value || !item.hasInstall),
  )
  // 'relevance' keeps the order npm returned.
  return discoverSort.value === 'relevance' ? list : list.sort(discoverComparators[discoverSort.value])
})

const filteredInstalled = computed(() => {
  const query = installedQuery.value.trim().toLowerCase()
  const updatable = new Set(updatablePlugins.value)
  return pluginList.value.filter(item => {
    if (statusFilter.value === 'updates' && !updatable.has(item)) return false
    if (statusFilter.value === 'disabled' && item.enabled) return false
    if (!query) return true
    return [item.name, item.fullName, item.description, item.author].some(field => field?.toLowerCase().includes(query))
  })
})

const visiblePlugins = computed(() =>
  activeTab.value === 'installed' ? filteredInstalled.value : filteredDiscover.value,
)
const contentLoading = computed(() => (activeTab.value === 'installed' ? loading.value : discoverLoading.value))
const showSkeleton = computed(() => contentLoading.value && visiblePlugins.value.length === 0)

const statusLine = computed(() => {
  if (activeTab.value === 'installed') {
    if (loading.value && pluginList.value.length > 0) return t('pages.plugin.working')
    if (pluginList.value.length > 0 && filteredInstalled.value.length !== pluginList.value.length) {
      return t('pages.plugin.filteredCount', { shown: filteredInstalled.value.length, total: pluginList.value.length })
    }
    return ''
  }
  if (discoverFailed.value) return ''
  if (discoverLoading.value) return searchText.value ? t('pages.plugin.searching') : t('pages.plugin.loadingPlugins')
  if (discoverPlugins.value.length === 0) return ''
  if (filteredDiscover.value.length !== discoverPlugins.value.length) {
    return t('pages.plugin.filteredCount', {
      shown: filteredDiscover.value.length,
      total: discoverPlugins.value.length,
    })
  }
  return searchText.value
    ? t('pages.plugin.searchResultCount', discoverPlugins.value.length)
    : t('pages.plugin.registryCount', discoverPlugins.value.length)
})

const emptyState = computed<{
  icon: Component
  title: string
  description: string
  action?: { icon: Component; text: string; run: () => void }
}>(() => {
  if (activeTab.value === 'discover') {
    if (discoverPlugins.value.length > 0) {
      return {
        icon: SearchXIcon,
        title: t('pages.plugin.noMatchFilters'),
        description: t('pages.plugin.noMatchFiltersHint'),
        action: { icon: XIcon, text: t('pages.plugin.clearFilters'), run: clearDiscoverFilters },
      }
    }
    return {
      icon: SearchXIcon,
      title: t('pages.plugin.noPluginsFound'),
      description: t('pages.plugin.tryDifferentSearch'),
    }
  }
  if (pluginList.value.length === 0) {
    return {
      icon: PackageSearchIcon,
      title: t('pages.plugin.NoPluginsInstalled'),
      description: t('pages.plugin.installPluginsToGetStarted'),
      action: { icon: CompassIcon, text: t('pages.plugin.discoverPlugins'), run: () => (activeTab.value = 'discover') },
    }
  }
  if (statusFilter.value === 'updates' && !installedQuery.value) {
    return { icon: SparklesIcon, title: t('pages.plugin.noUpdates'), description: t('pages.plugin.noUpdatesHint') }
  }
  return {
    icon: SearchXIcon,
    title: t('pages.plugin.noMatchInstalled'),
    description: t('pages.plugin.tryDifferentSearch'),
    action: { icon: XIcon, text: t('pages.plugin.clearFilters'), run: clearInstalledFilters },
  }
})

function clearInstalledFilters() {
  installedQuery.value = ''
  statusFilter.value = 'all'
}

function clearDiscoverFilters() {
  guiOnly.value = false
  hideInstalled.value = false
}

function clearQuery() {
  if (activeTab.value === 'installed') installedQuery.value = ''
  else searchText.value = ''
}

function showUpdates() {
  activeTab.value = 'installed'
  installedQuery.value = ''
  statusFilter.value = 'updates'
}

// The registry listing is fetched the first time Discover is opened.
watch(
  activeTab,
  tab => {
    if (tab === 'discover') void loadBrowsePlugins()
  },
  { immediate: true },
)
</script>
