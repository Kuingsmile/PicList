<template>
  <CustomModal v-model:visible="showBrowseDialog" :title="t('pages.plugin.browseAllPlugins')">
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
        <div class="h-12 w-12 animate-spin rounded-full border-[3px] border-t-[3px] border-border border-t-accent" />
        <span class="text-sm font-semibold text-accent">{{ t('pages.plugin.loadingPlugins') }}</span>
      </div>
      <div v-else class="flex-1 overflow-hidden rounded-md border border-border shadow-md">
        <div class="grid h-full grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 overflow-auto p-4">
          <PluginCard
            v-for="item in filteredBrowsePlugins"
            :key="item.fullName"
            :item="item"
            install-mode
            :updated-at="item.date"
            @install="emit('install', $event)"
          />
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
</template>

<script setup lang="ts">
import { PackageIcon, SearchIcon, XIcon } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import CustomModal from '@/components/common/CustomModal.vue'

import PluginCard from './PluginCard.vue'

const showBrowseDialog = defineModel<boolean>('visible', { required: true })
const browseSearchText = defineModel<string>('searchText', { required: true })
defineProps<{ filteredBrowsePlugins: IPicGoPlugin[]; loadingBrowse: boolean }>()
const emit = defineEmits<{ install: [plugin: IPicGoPlugin] }>()
const { t } = useI18n()
</script>
