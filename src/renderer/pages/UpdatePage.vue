<template>
  <main class="flex h-screen flex-col overflow-hidden bg-bg-tertiary text-main" aria-labelledby="update-title">
    <div class="flex min-h-0 flex-1 flex-col gap-4 px-6 pt-6 pb-4">
      <header class="flex shrink-0 items-center gap-4">
        <img :src="logoUrl" alt="" width="56" height="56" class="shrink-0 rounded-full" />
        <div v-if="updateInfo" class="min-w-0 flex-1">
          <h1 id="update-title" class="m-0 text-[22px] leading-tight font-[650] tracking-[-0.3px]">
            {{ updateInfo.title }}
          </h1>
          <p v-if="updateInfo.version" class="m-0 mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span class="sr-only">
              {{ t('pages.update.versionChange', { current: `v${currentVersion}`, latest: `v${updateInfo.version}` }) }}
            </span>
            <span
              class="rounded-full border border-border px-2 py-0.5 text-secondary tabular-nums select-text"
              aria-hidden="true"
            >
              v{{ currentVersion }}
            </span>
            <ArrowRight :size="14" class="shrink-0 text-secondary" aria-hidden="true" />
            <span class="rounded-full bg-accent/10 px-2 py-0.5 text-accent tabular-nums select-text" aria-hidden="true">
              v{{ updateInfo.version }}
            </span>
          </p>
        </div>
        <div v-else class="flex flex-1 flex-col gap-2.5 motion-safe:animate-pulse" aria-hidden="true">
          <div class="h-6 w-56 rounded-sm bg-border" />
          <div class="h-4 w-36 rounded-sm bg-border-secondary" />
        </div>
      </header>

      <!-- Download progress, or the outcome when release notes take the main area -->
      <section
        v-if="updateInfo && statusView && (isDownloading || hasNotes)"
        class="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-bg-secondary p-4 shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div
          class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg"
          :class="statusView.iconClass"
          aria-hidden="true"
        >
          <component :is="statusView.icon" :size="18" />
        </div>
        <div v-if="isDownloading" class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3 text-sm font-semibold">
            <h2 class="m-0 text-sm font-semibold">
              {{ isPreparing ? t('pages.update.preparing') : t('pages.update.downloading') }}
            </h2>
            <span class="tabular-nums" aria-hidden="true">{{ progressPercent }}%</span>
          </div>
          <div
            class="mt-2 h-1.5 overflow-hidden rounded-full bg-accent/15"
            role="progressbar"
            :aria-label="t('pages.update.downloading')"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="progressPercent"
          >
            <div
              class="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              :class="{ 'motion-safe:animate-pulse': isPreparing }"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>
        <p v-else class="m-0 min-w-0 flex-1 text-sm leading-relaxed">{{ updateInfo.message }}</p>
      </section>

      <section
        v-if="hasNotes"
        class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border shadow-sm"
        aria-labelledby="notes-title"
      >
        <div class="flex shrink-0 items-center gap-3 border-b border-border bg-bg-secondary px-4 py-2.5">
          <span
            class="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-lg bg-accent text-white"
            aria-hidden="true"
          >
            <BookOpen :size="15" />
          </span>
          <h2 id="notes-title" class="m-0 text-[0.925rem] leading-[1.4] font-semibold text-secondary">
            {{ t('pages.update.releaseNotes') }}
          </h2>
        </div>
        <MarkdownContent
          :html="renderedNotes"
          class="min-h-0 flex-1 overscroll-contain scroll-fade-y"
          tabindex="0"
          aria-labelledby="notes-title"
        />
      </section>

      <div
        v-else-if="updateInfo && (!statusView || isDownloading)"
        class="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-6 text-center"
      >
        <div class="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
          <FileText :size="22" aria-hidden="true" />
        </div>
        <p class="m-0 max-w-sm text-sm leading-relaxed text-secondary">{{ t('pages.update.notesUnavailable') }}</p>
      </div>

      <!-- Without release notes the outcome fills the window -->
      <section
        v-else-if="updateInfo && statusView && !isDownloading"
        class="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-bg-secondary p-8 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div class="flex h-14 w-14 items-center justify-center rounded-full" :class="statusView.iconClass">
          <component :is="statusView.icon" :size="28" aria-hidden="true" />
        </div>
        <p class="m-0 max-w-md text-sm leading-relaxed text-secondary">{{ updateInfo.message }}</p>
      </section>

      <div
        v-else-if="!updateInfo"
        class="flex flex-1 flex-col gap-3 rounded-lg border border-border p-5 motion-safe:animate-pulse"
        aria-hidden="true"
      >
        <div class="h-5 w-2/5 rounded-sm bg-border" />
        <div class="h-3.5 w-11/12 rounded-sm bg-border-secondary" />
        <div class="h-3.5 w-4/5 rounded-sm bg-border-secondary" />
        <div class="h-3.5 w-3/5 rounded-sm bg-border-secondary" />
        <div class="mt-2 h-5 w-1/3 rounded-sm bg-border" />
        <div class="h-3.5 w-10/12 rounded-sm bg-border-secondary" />
      </div>

      <footer class="mt-auto flex shrink-0 flex-wrap items-center gap-3 border-t border-border pt-4">
        <label
          v-if="updateInfo?.type === 'update-available'"
          class="flex cursor-pointer items-center gap-2 text-sm text-secondary select-none hover:text-main"
        >
          <input v-model="dontShowAgain" type="checkbox" class="m-0 size-4 shrink-0 accent-accent" />
          {{ t('pages.update.noMoreNotice') }}
        </label>

        <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
          <template v-if="updateInfo?.type === 'update-available'">
            <CustomButton type="secondary" :text="t('pages.update.later')" @click="closeWindow" />
            <CustomButton
              type="secondary"
              :icon="ExternalLink"
              :text="t('pages.update.goToDownloadPage')"
              @click="goToDownloadPage"
            />
            <CustomButton :icon="Download" :text="t('pages.update.download')" @click="downloadUpdate" />
          </template>
          <CustomButton
            v-else-if="updateInfo?.type === 'downloading'"
            type="secondary"
            :text="t('pages.update.runInBackground')"
            @click="closeWindow"
          />
          <template v-else-if="updateInfo?.type === 'update-downloaded'">
            <CustomButton type="secondary" :text="t('pages.update.later')" @click="closeWindow" />
            <CustomButton :icon="RotateCw" :text="t('pages.update.restartToInstall')" @click="installUpdate" />
          </template>
          <template v-else-if="updateInfo?.type === 'update-error'">
            <CustomButton type="secondary" :text="t('common.close')" @click="closeWindow" />
            <CustomButton
              type="secondary"
              :icon="ExternalLink"
              :text="t('pages.update.goToDownloadPage')"
              @click="goToDownloadPage"
            />
            <CustomButton :icon="RotateCw" :text="t('pages.update.retry')" @click="downloadUpdate" />
          </template>
          <CustomButton v-else type="secondary" :text="t('pages.update.later')" @click="closeWindow" />
        </div>
      </footer>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ArrowRight, BookOpen, CircleAlert, CircleCheck, Download, ExternalLink, FileText, RotateCw } from '@lucide/vue'
import { useEventListener, useTitle } from '@vueuse/core'
import pkg from 'root/package.json'
import { type Component, computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import MarkdownContent from '@/components/common/MarkdownContent.vue'
import { invokeRPC, saveWithFeedback } from '@/services/rpcService'
import { renderMarkdown } from '@/utils/markdown'
import { SHOW_UPDATE_INFO, UPDATE_PROGRESS } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'

interface UpdateInfo {
  type: 'update-available' | 'downloading' | 'update-downloaded' | 'update-error'
  title: string
  version?: string
  message?: string
  releaseNotes?: string
}

const { t } = useI18n()
const currentVersion = pkg.version
const logoUrl = `${import.meta.env.BASE_URL}roundLogo.png`

// Null until the main process sends the first notification.
const updateInfo = ref<UpdateInfo | null>(null)
const dontShowAgain = ref(false)
const downloadProgress = ref<number | null>(null)

useTitle(computed(() => updateInfo.value?.title ?? 'PicList'))

const hasNotes = computed(() => !!updateInfo.value?.releaseNotes?.trim())
// Rendered once per notification, not on every progress tick.
const renderedNotes = computed(() => renderMarkdown(updateInfo.value?.releaseNotes ?? ''))

const isDownloading = computed(() => updateInfo.value?.type === 'downloading')
const progressPercent = computed(() => Math.min(100, Math.max(0, Math.floor(downloadProgress.value ?? 0))))
// After the last byte the update is still verified or extracted before anything else is reported.
const isPreparing = computed(() => isDownloading.value && progressPercent.value >= 100)

const statusView = computed<{ icon: Component; iconClass: string } | null>(() => {
  switch (updateInfo.value?.type) {
    case 'downloading':
      return { icon: Download, iconClass: 'bg-accent/10 text-accent' }
    case 'update-downloaded':
      return { icon: CircleCheck, iconClass: 'bg-success/15 text-success' }
    case 'update-error':
      return { icon: CircleAlert, iconClass: 'bg-danger/10 text-danger' }
    default:
      return null
  }
})

watch(dontShowAgain, async (newVal: boolean) => {
  await saveWithFeedback(() => invokeRPC(IRPCActionType.SET_SHOW_UPDATE_TIP, !newVal))
})

function handleUpdateInfo(info: UpdateInfo) {
  const previous = updateInfo.value
  // Later notifications for the same release carry no notes, so keep the ones already shown.
  const releaseNotes = info.releaseNotes ?? (info.version === previous?.version ? previous?.releaseNotes : undefined)
  updateInfo.value = { ...info, releaseNotes }
  if (info.type !== 'downloading') {
    downloadProgress.value = null
  }
}

function handleUpdateProgress(progress: { progress: number }) {
  downloadProgress.value = progress.progress
}

function downloadUpdate() {
  if (!updateInfo.value) return
  updateInfo.value.type = 'downloading'
  downloadProgress.value = 0
  window.electron.sendRPC(IRPCActionType.DOWNLOAD_UPDATE)
}

function goToDownloadPage() {
  window.electron.sendRPC(IRPCActionType.GO_TO_DOWNLOAD_PAGE)
  closeWindow()
}

function installUpdate() {
  window.electron.sendRPC(IRPCActionType.INSTALL_UPDATE)
}

// A running download continues in the main process after the window closes.
function closeWindow() {
  window.electron.sendRPC(IRPCActionType.CLOSE_CURRENT_WINDOW)
}

useEventListener('keydown', event => {
  if (event.key === 'Escape') closeWindow()
})

onMounted(() => {
  window.electron.ipcRendererOn(SHOW_UPDATE_INFO, handleUpdateInfo)
  window.electron.ipcRendererOn(UPDATE_PROGRESS, handleUpdateProgress)
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners(SHOW_UPDATE_INFO)
  window.electron.ipcRendererRemoveAllListeners(UPDATE_PROGRESS)
})
</script>
