<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div class="relative z-1 flex h-full w-full flex-col items-center justify-start gap-4 rounded-xl border-none p-4">
      <!-- Header -->
      <div
        class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex flex-1 flex-wrap items-center gap-4 p-2">
          <Settings :size="24" class="text-accent" />

          <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">
            {{ t('pages.settings.title') }}
          </h1>
        </div>

        <div class="flex gap-3">
          <CustomButton :text="t('pages.settings.docs')" type="secondary" :icon="BookOpen" @click="goConfigPage" />
        </div>
      </div>

      <!-- Tab Navigation -->
      <div
        class="flex w-full items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:items-stretch max-md:p-5"
      >
        <CustomButton
          v-for="tab in tabs"
          :key="tab.id"
          :text="tab.label"
          :icon="tab.icon"
          :active="currentTab === tab.id"
          :icon-size="18"
          type="tab"
          @click="tabClick(tab.id)"
        />
      </div>

      <!-- Settings Content -->
      <div
        class="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border-secondary p-1 shadow-md"
      >
        <SystemSettings :active="currentTab === 'system'" />
        <SyncSettings :active="currentTab === 'sync'" />
        <UploadSettings :active="currentTab === 'upload'" />
        <AdvancedSettings :active="currentTab === 'advanced'" />
        <UpdateSettings :active="currentTab === 'update'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BookOpen, CloudUpload, RefreshCw, RotateCcw, Server, Settings } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import AdvancedSettings from '@/components/settings/AdvancedSettings.vue'
import SyncSettings from '@/components/settings/SyncSettings.vue'
import SystemSettings from '@/components/settings/SystemSettings.vue'
import UpdateSettings from '@/components/settings/UpdateSettings.vue'
import UploadSettings from '@/components/settings/UploadSettings.vue'
import { provideSettings } from '@/composables/settings/useSettingsContext'
import { useSettingsState } from '@/composables/settings/useSettingsState'
import { getConfig } from '@/services/configService'
import { configPaths } from '@/utils/configPaths'
import { II18nLanguage } from '#/constants/app'
import { IRPCActionType } from '#/constants/rpcActions'

defineOptions({
  name: 'SettingPage',
})

const { t } = useI18n()

provideSettings(useSettingsState())

const tabDefinitions = [
  {
    id: 'system',
    labelKey: 'pages.settings.system.title',
    icon: Settings,
  },
  {
    id: 'sync',
    labelKey: 'pages.settings.sync.title',
    icon: RotateCcw,
  },
  {
    id: 'upload',
    labelKey: 'pages.settings.upload.title',
    icon: CloudUpload,
  },
  {
    id: 'advanced',
    labelKey: 'pages.settings.advanced.title',
    icon: Server,
  },
  {
    id: 'update',
    labelKey: 'pages.settings.update.title',
    icon: RefreshCw,
  },
] as const

type TabId = (typeof tabDefinitions)[number]['id']

const currentTab = useStorage<TabId>('settings-current-tab', tabDefinitions[0].id)

const tabs = computed(() =>
  tabDefinitions.map(({ id, labelKey, icon }) => ({
    id,
    icon,
    label: t(labelKey),
  })),
)

function tabClick(tabId: TabId) {
  currentTab.value = tabId
}

async function goConfigPage() {
  const lang = (await getConfig(configPaths.settings.language)) ?? II18nLanguage.ZH_CN
  const localePath = lang === II18nLanguage.EN ? 'en/' : ''
  const url = `https://piclist.cn/${localePath}configure.html`

  window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
}
</script>
