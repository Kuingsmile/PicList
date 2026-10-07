<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <SettingSection :icon="RefreshCw" :title="t('pages.settings.update.applicationUpdates')">
      <CustomNavCard :clickable="false" :icon="RotateCcw" :title="t('pages.settings.update.currentVersion')">
        <template #description>
          <div class="flex items-center gap-2">
            <span class="rounded-md bg-accent/30 px-2 py-1 text-sm font-semibold text-secondary">v{{ version }}</span>
          </div>
        </template>
        <template #extra>
          <CustomButton
            :icon="RefreshCw"
            :text="t('pages.settings.update.clickToCheck')"
            type="secondary"
            @click="checkUpdate"
          />
        </template>
      </CustomNavCard>

      <SettingCard p1>
        <CustomSwitch
          v-model="settings.showUpdateTip"
          small
          no-border
          :title="t('pages.settings.update.openUpdateHelper')"
          :description="t('pages.settings.update.openUpdateHelperDesc')"
        />
      </SettingCard>
    </SettingSection>

    <!-- Release Notes Section -->
    <SettingSection
      :only-one-row="true"
      :icon="BookOpen"
      :title="t('pages.settings.update.latestReleaseNotes')"
      class="relative"
    >
      <div class="absolute top-4 right-4 flex items-center gap-2">
        <CustomButton
          :icon="RefreshCw"
          :text="t('pages.settings.update.refresh')"
          type="secondary"
          :disabled="fetchingReleaseNotes"
          @click="fetchReleaseNotesManually"
        />
      </div>
      <div class="relative w-full rounded-lg border border-border bg-bg-secondary shadow-sm">
        <div class="max-h-[400px] overflow-y-auto bg-bg-secondary">
          <div
            v-if="fetchingReleaseNotes"
            class="flex flex-col items-center justify-center gap-2 p-4 text-center text-sm font-semibold text-secondary"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
              <RefreshCw :size="24" class="animate-ping" />
            </div>
            <span>{{ t('pages.settings.update.loadingReleaseNotes') }}</span>
          </div>
          <MarkdownContent v-else-if="releaseNotes" :html="renderedReleaseNotes" class="max-h-[200px] rounded-lg" />
          <div
            v-else-if="releaseNotesError"
            class="flex flex-col items-center justify-center gap-6 bg-error/10 p-4 text-sm text-danger"
          >
            <div class="text-[4rem]">⚠️</div>
            <span>{{ releaseNotesError }}</span>
            <CustomButton
              :icon="RefreshCw"
              :text="t('pages.settings.update.retry')"
              type="secondary"
              @click="fetchReleaseNotesManually"
            />
          </div>
        </div>

        <div v-if="releaseNotesLastFetch" class="border-t border-border-secondary bg-bg-secondary p-3 text-right">
          <small class="flex flex-row justify-end gap-1 text-xs text-secondary">
            <RefreshCw :size="12" />
            <div>{{ t('pages.settings.update.lastUpdated') }}: {{ formatLastFetchTime(releaseNotesLastFetch) }}</div>
          </small>
        </div>
      </div>
    </SettingSection>
  </div>

  <CustomModal
    v-model:visible="checkUpdateVisible"
    height="auto"
    width="500px"
    :title="t('pages.settings.update.checkUpdate')"
  >
    <div class="mb-4 no-scrollbar overflow-y-auto p-1">
      <div class="mt-5 flex items-center justify-center gap-4">
        <div class="min-w-[120px] flex-1 rounded-lg border border-border bg-bg-tertiary px-5 py-4 text-center">
          <div class="mb-1.5 text-sm font-semibold text-secondary">
            {{ t('pages.settings.update.currentVersionLabel') }}
          </div>
          <div class="text-lg font-bold text-main">v{{ version }}</div>
        </div>
        <div class="shrink-0 text-tertiary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <div
          class="group latest min-w-[120px] flex-1 rounded-lg border border-border bg-bg-tertiary px-5 py-4 text-center"
          :class="{ 'has-update': needUpdate }"
        >
          <div class="mb-1.5 text-sm font-semibold text-secondary group-[.has-update]:text-success">
            {{ t('pages.settings.update.newestVersion') }}
          </div>
          <div class="text-lg font-bold text-main group-[.has-update]:text-success">
            {{
              latestVersionError
                ? t('pages.settings.update.networkError')
                : latestVersion || t('pages.settings.update.getting')
            }}
          </div>
        </div>
      </div>
      <div
        v-if="needUpdate"
        class="flex items-center justify-center gap-2 rounded-lg p-4 text-sm font-semibold text-success"
      >
        <RefreshCw :size="18" />
        <span>{{ t('pages.settings.update.hasNewVersion') }}</span>
      </div>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="cancelCheckVersion" />
      <CustomButton
        :text="needUpdate ? t('pages.settings.update.updateNow') : t('common.confirm')"
        @click="confirmCheckVersion"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { BookOpen, RefreshCw, RotateCcw } from '@lucide/vue'
import { compare } from 'compare-versions'
import pkg from 'root/package.json'
import { computed, onBeforeUnmount, onWatcherCleanup, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MarkdownContent from '@/components/common/MarkdownContent.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import { getLatestVersion, isValidVersion } from '@/services/updateService'
import { renderMarkdown } from '@/utils/markdown'
import { IRPCActionType } from '#/constants/rpcActions'

defineProps<{ active: boolean }>()
const { t } = useI18n()
const { settings, ready } = useSettingsContext()
const checkUpdateVisible = ref(false)

const latestVersion = ref('')

const latestVersionError = ref(false)

let updateCheckController: AbortController | undefined

const releaseNotes = ref('')

const releaseNotesError = ref('')

const releaseNotesLastFetch = ref<Date | null>(null)

const fetchingReleaseNotes = ref(false)

let releaseNotesController: AbortController | undefined

const needUpdate = computed(() => compareVersion2Update(version, latestVersion.value))

const renderedReleaseNotes = computed(() => {
  return renderMarkdown(releaseNotes.value)
})

const version = pkg.version

const RELEASE_NOTES_CACHE_DURATION = 30 * 60 * 1000

function compareVersion2Update(current: string, latest: string): boolean {
  return isValidVersion(current) && isValidVersion(latest) && compare(current, latest, '<')
}

function formatLastFetchTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return t('pages.settings.update.justNow')
  } else if (diffInMinutes < 60) {
    return t('pages.settings.update.minutesAgo', { minutes: diffInMinutes })
  } else {
    const hours = Math.floor(diffInMinutes / 60)
    if (hours < 24) {
      return t('pages.settings.update.hoursAgo', { hours })
    } else {
      const days = Math.floor(hours / 24)
      return t('pages.settings.update.daysAgo', { days })
    }
  }
}

async function fetchReleaseNotes(forceRefresh = false): Promise<void> {
  if (disposed) return
  if (!forceRefresh && releaseNotesLastFetch.value) {
    const timeSinceLastFetch = Date.now() - releaseNotesLastFetch.value.getTime()
    if (timeSinceLastFetch < RELEASE_NOTES_CACHE_DURATION) {
      return
    }
  }

  releaseNotesController?.abort()
  const controller = new AbortController()
  releaseNotesController = controller
  onWatcherCleanup(() => controller.abort(), true)
  const language = settings.value.language
  const isCurrent = () =>
    !disposed &&
    releaseNotesController === controller &&
    !controller.signal.aborted &&
    settings.value.language === language
  fetchingReleaseNotes.value = true
  releaseNotesError.value = ''

  try {
    const isEnglish = language === 'en'
    const fileName = isEnglish ? 'currentVersion_en.md' : 'currentVersion.md'
    const url = `https://raw.githubusercontent.com/Kuingsmile/piclist/dev/${fileName}`

    const response = await fetch(url, { signal: controller.signal })
    if (response.ok) {
      const content = await response.text()
      if (!isCurrent()) return
      releaseNotes.value = content
      releaseNotesLastFetch.value = new Date()
      releaseNotesError.value = ''
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch {
    if (isCurrent()) releaseNotesError.value = t('pages.settings.update.releaseNotesError')
  } finally {
    if (!disposed && releaseNotesController === controller) {
      fetchingReleaseNotes.value = false
      releaseNotesController = undefined
    }
  }
}

async function fetchReleaseNotesManually(): Promise<void> {
  await fetchReleaseNotes(true)
}

async function checkUpdate() {
  updateCheckController?.abort()
  const controller = new AbortController()
  updateCheckController = controller
  latestVersion.value = ''
  latestVersionError.value = false
  checkUpdateVisible.value = true
  const version = await getLatestVersion(controller.signal)
  if (updateCheckController !== controller || controller.signal.aborted) return
  latestVersion.value = version
  latestVersionError.value = !version
  updateCheckController = undefined
}

function confirmCheckVersion() {
  if (needUpdate.value) {
    window.electron.sendRPC(IRPCActionType.RELOAD_APP)
  }
  checkUpdateVisible.value = false
}

function cancelCheckVersion() {
  checkUpdateVisible.value = false
}
let disposed = false
watch(
  checkUpdateVisible,
  visible => {
    if (!visible) updateCheckController?.abort()
  },
  { flush: 'sync' },
)
watch(
  [ready, () => settings.value.language],
  ([initialized]) => {
    if (initialized) void fetchReleaseNotes(true)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  disposed = true
  updateCheckController?.abort()
  releaseNotesController?.abort()
})
</script>
