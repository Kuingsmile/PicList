<template>
  <div v-show="active" class="no-scrollbar flex h-full w-full flex-1 flex-col gap-6 overflow-auto p-4">
    <SettingSection :icon="RefreshCw" :title="t('pages.settings.update.applicationUpdates')">
      <CustomNavCard
        class="col-span-full"
        :clickable="false"
        :icon="Package"
        :title="t('pages.settings.update.currentVersion')"
      >
        <template #description>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span class="rounded-md bg-accent/15 px-2 py-0.5 text-sm font-semibold text-main tabular-nums"
              >v{{ version }}</span
            >
            <span role="status" aria-live="polite" class="inline-flex items-center gap-1.5 text-xs font-medium">
              <template v-if="checkStatus">
                <component
                  :is="checkStatus.icon"
                  :size="14"
                  class="shrink-0"
                  :class="[
                    checkStatus.iconClass,
                    { 'animate-spin motion-reduce:animate-none': checkState === 'checking' },
                  ]"
                  aria-hidden="true"
                />
                <span :class="checkStatus.textClass">{{ checkStatus.text }}</span>
              </template>
            </span>
          </div>
        </template>
        <template #extra>
          <CustomButton
            v-if="checkState === 'available'"
            :icon="updateHelperOn ? RotateCw : Download"
            :text="
              updateHelperOn ? t('pages.settings.update.restartToUpdate') : t('pages.settings.update.downloadUpdate')
            "
            @click="installUpdate"
          />
          <CustomButton
            v-else
            :icon="RefreshCw"
            :text="t('pages.settings.update.checkUpdate')"
            type="secondary"
            :loading="checkState === 'checking'"
            @click="checkUpdate"
          />
        </template>
      </CustomNavCard>

      <SettingCard p1 class="col-span-full">
        <CustomSwitch
          v-model="settings.showUpdateTip"
          small
          no-border
          :title="t('pages.settings.update.openUpdateHelper')"
          :description="t('pages.settings.update.openUpdateHelperDesc')"
        />
      </SettingCard>
    </SettingSection>

    <SettingSection only-one-row :icon="BookOpen" :title="t('pages.settings.update.latestReleaseNotes')">
      <div class="overflow-hidden rounded-lg border border-border">
        <div class="max-h-[420px] overflow-y-auto bg-bg-tertiary" :aria-busy="fetchingReleaseNotes || undefined">
          <MarkdownContent v-if="releaseNotes.trim()" :html="renderedReleaseNotes" />
          <div
            v-else-if="releaseNotesError && !fetchingReleaseNotes"
            class="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center"
          >
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
              <CircleAlert :size="22" aria-hidden="true" />
            </div>
            <p class="max-w-sm text-sm text-secondary">{{ releaseNotesError }}</p>
            <CustomButton
              :icon="RefreshCw"
              :text="t('pages.settings.update.retry')"
              type="secondary"
              @click="fetchReleaseNotesManually"
            />
          </div>
          <div
            v-else-if="releaseNotesLastFetch && !fetchingReleaseNotes"
            class="px-5 py-10 text-center text-sm text-secondary"
          >
            {{ t('pages.settings.update.noReleaseNotes') }}
          </div>
          <div v-else class="flex flex-col gap-3 p-5 motion-safe:animate-pulse" aria-hidden="true">
            <div class="h-5 w-2/5 rounded-sm bg-border" />
            <div class="h-3.5 w-11/12 rounded-sm bg-border-secondary" />
            <div class="h-3.5 w-4/5 rounded-sm bg-border-secondary" />
            <div class="h-3.5 w-3/5 rounded-sm bg-border-secondary" />
            <div class="mt-2 h-5 w-1/3 rounded-sm bg-border" />
            <div class="h-3.5 w-10/12 rounded-sm bg-border-secondary" />
            <div class="h-3.5 w-2/3 rounded-sm bg-border-secondary" />
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-bg-secondary px-3 py-2">
          <p role="status" aria-live="polite" class="flex min-w-0 items-center gap-1.5 text-xs text-secondary">
            <template v-if="fetchingReleaseNotes">{{ t('pages.settings.update.loadingReleaseNotes') }}</template>
            <template v-else-if="releaseNotesError && releaseNotes.trim()">
              <CircleAlert :size="12" class="shrink-0 text-danger" aria-hidden="true" />
              <span class="text-danger">{{ releaseNotesError }}</span>
            </template>
            <template v-else-if="releaseNotesLastFetch">
              {{ t('pages.settings.update.lastUpdated') }}: {{ formatLastFetchTime(releaseNotesLastFetch) }}
            </template>
          </p>
          <div class="flex shrink-0 items-center gap-2">
            <CustomButton
              :icon="RefreshCw"
              :icon-size="14"
              :text="t('pages.settings.update.refresh')"
              type="secondary"
              :loading="fetchingReleaseNotes"
              @click="fetchReleaseNotesManually"
            />
            <CustomButton
              :icon="ExternalLink"
              :icon-size="14"
              :text="t('pages.settings.update.viewOnGitHub')"
              type="secondary"
              @click="openReleasesPage"
            />
          </div>
        </div>
      </div>
    </SettingSection>
  </div>
</template>

<script setup lang="ts">
import {
  BookOpen,
  CircleAlert,
  CircleArrowUp,
  CircleCheck,
  Download,
  ExternalLink,
  LoaderCircle,
  Package,
  RefreshCw,
  RotateCw,
} from '@lucide/vue'
import { compare } from 'compare-versions'
import pkg from 'root/package.json'
import { type Component, computed, onBeforeUnmount, onWatcherCleanup, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import MarkdownContent from '@/components/common/MarkdownContent.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import { useSettingsContext } from '@/composables/settings/useSettingsContext'
import { getLatestVersion, isValidVersion } from '@/services/updateService'
import { renderMarkdown } from '@/utils/markdown'
import { GITHUB_URL } from '@/utils/static'
import { IRPCActionType } from '#/constants/rpcActions'

type CheckState = 'idle' | 'checking' | 'latest' | 'available' | 'error'

defineProps<{ active: boolean }>()
const { t, locale } = useI18n()
const { settings, ready } = useSettingsContext()

const version = pkg.version

const RELEASE_NOTES_CACHE_DURATION = 30 * 60 * 1000

const RELEASES_PAGE_URL = `${GITHUB_URL}/releases/latest`

const checkState = ref<CheckState>('idle')

const latestVersion = ref('')

let updateCheckController: AbortController | undefined

const releaseNotes = ref('')

const releaseNotesError = ref('')

const releaseNotesLastFetch = ref<Date | null>(null)

const fetchingReleaseNotes = ref(false)

let releaseNotesController: AbortController | undefined

// Restarting only installs the update when the startup update check is enabled.
const updateHelperOn = computed(() => settings.value.showUpdateTip !== false)

const checkStatus = computed<{ icon: Component; text: string; iconClass: string; textClass: string } | null>(() => {
  switch (checkState.value) {
    case 'checking':
      return {
        icon: LoaderCircle,
        text: t('pages.settings.update.checking'),
        iconClass: 'text-secondary',
        textClass: 'text-secondary',
      }
    case 'latest':
      return {
        icon: CircleCheck,
        text: t('pages.settings.update.upToDate'),
        iconClass: 'text-success',
        textClass: 'text-secondary',
      }
    case 'available':
      return {
        icon: CircleArrowUp,
        text: t('pages.settings.update.newVersionAvailable', { version: `v${latestVersion.value.replace(/^v/, '')}` }),
        iconClass: 'text-accent',
        textClass: 'font-semibold text-main',
      }
    case 'error':
      return {
        icon: CircleAlert,
        text: t('pages.settings.update.networkError'),
        iconClass: 'text-danger',
        textClass: 'text-danger',
      }
    default:
      return null
  }
})

const renderedReleaseNotes = computed(() => {
  return renderMarkdown(releaseNotes.value)
})

// Keeps the "last updated" label fresh while the page stays open.
const now = ref(Date.now())
const clock = window.setInterval(() => {
  now.value = Date.now()
}, 30_000)

const relativeTimeFormat = computed(() => new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }))

function compareVersion2Update(current: string, latest: string): boolean {
  return isValidVersion(current) && isValidVersion(latest) && compare(current, latest, '<')
}

function formatLastFetchTime(date: Date): string {
  const diffInMinutes = Math.floor((now.value - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return t('pages.settings.update.justNow')
  } else if (diffInMinutes < 60) {
    return relativeTimeFormat.value.format(-diffInMinutes, 'minute')
  }
  const hours = Math.floor(diffInMinutes / 60)
  if (hours < 24) {
    return relativeTimeFormat.value.format(-hours, 'hour')
  }
  return relativeTimeFormat.value.format(-Math.floor(hours / 24), 'day')
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
      now.value = Date.now()
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
  checkState.value = 'checking'
  const latest = await getLatestVersion(controller.signal)
  if (disposed || updateCheckController !== controller || controller.signal.aborted) return
  updateCheckController = undefined
  latestVersion.value = latest
  if (!latest) {
    checkState.value = 'error'
  } else {
    checkState.value = compareVersion2Update(version, latest) ? 'available' : 'latest'
  }
}

function installUpdate() {
  if (updateHelperOn.value) {
    window.electron.sendRPC(IRPCActionType.RELOAD_APP)
  } else {
    window.electron.sendRPC(IRPCActionType.OPEN_URL, RELEASES_PAGE_URL)
  }
}

function openReleasesPage() {
  window.electron.sendRPC(IRPCActionType.OPEN_URL, RELEASES_PAGE_URL)
}

let disposed = false
watch(
  [ready, () => settings.value.language],
  ([initialized]) => {
    if (initialized) void fetchReleaseNotes(true)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  disposed = true
  window.clearInterval(clock)
  updateCheckController?.abort()
  releaseNotesController?.abort()
})
</script>
