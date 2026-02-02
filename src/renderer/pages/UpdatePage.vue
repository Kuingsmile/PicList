<template>
  <div class="flex h-full w-full items-center justify-center bg-bg-tertiary">
    <div
      class="relative h-11/12 w-11/12 shrink-0 overflow-auto rounded-md border border-border bg-surface-elevated shadow-lg"
    >
      <!-- Header -->
      <header class="p-5">
        <h1 class="mb-3 text-3xl leading-tight font-bold tracking-wide text-main">{{ updateInfo.title }}</h1>
        <p v-if="updateInfo.version" class="flex items-center gap-2 text-sm">
          <span class="font-semibold text-secondary">Version</span>
          <span class="rounded-sm bg-accent/30 px-2 py-0.5 font-bold text-main">v{{ updateInfo.version }}</span>
        </p>
      </header>

      <div v-if="updateInfo.type === 'downloading' && downloadProgress !== null" class="bg-accent-hover/5 p-6">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-semibold text-main">{{ $t('pages.update.downloading') }}</span>
          <span class="text-sm font-semibold text-main tabular-nums">{{ Math.round(downloadProgress) }}%</span>
        </div>
        <div class="relative h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            class="absolute top-0 left-0 h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-primary)_50%)] transition-all duration-300 ease-in-out"
            :style="{ width: `${downloadProgress}%` }"
          ></div>
        </div>
      </div>

      <div class="p-6">
        <div v-if="updateInfo.releaseNotes" class="mb-5">
          <h2 class="mb-2 text-base font-bold tracking-wide text-main">{{ $t('pages.update.releaseNotes') }}</h2>
          <div class="notes-body" v-html="renderMarkdown(updateInfo.releaseNotes)"></div>
        </div>

        <div v-else-if="updateInfo.message" class="mb-6">
          <p class="text-base leading-[1.7] text-main">{{ updateInfo.message }}</p>
        </div>

        <!-- Checkbox (only for update-available) -->
        <div v-if="updateInfo.type === 'update-available'" class="pt-4">
          <label class="group flex cursor-pointer items-center gap-3 select-none">
            <input v-model="dontShowAgain" type="checkbox" class="peer sr-only" />
            <span
              class="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border-2 border-border bg-white transition-all duration-fast ease-apple group-hover:border-accent peer-checked:border-accent-hover"
            >
              <svg
                class="scale-75 text-accent opacity-0 group-has-checked:scale-100 group-has-checked:opacity-100"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span class="text-sm font-normal text-main">{{ $t('pages.update.noMoreNotice') }}</span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <footer class="flex justify-end gap-3 border-t border-border bg-surface p-5">
        <template v-if="updateInfo.type === 'update-available'">
          <button class="btn-ghost" @click="goToDownloadPage">
            <Link2Icon class="btn-icon" />
            {{ $t('pages.update.goToDownloadPage') }}
          </button>
          <button class="btn-primary" @click="downloadUpdate">
            <DownloadIcon class="btn-icon" />
            {{ $t('pages.update.download') }}
          </button>
        </template>
        <template v-else-if="updateInfo.type === 'downloading'">
          <button class="btn-ghost" @click="closeWindow">
            <XIcon class="btn-icon" />
            {{ $t('common.cancel') }}
          </button>
        </template>
        <template v-else-if="updateInfo.type === 'update-downloaded'">
          <button class="btn-ghost" @click="closeWindow">
            {{ $t('pages.update.later') }}
          </button>
          <button class="btn-primary" @click="installUpdate">
            <DownloadIcon class="btn-icon" />
            {{ $t('pages.update.installNow') }}
          </button>
        </template>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DownloadIcon, Link2Icon, XIcon } from 'lucide-vue-next'
import { marked } from 'marked'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { SHOW_UPDATE_INFO, UPDATE_PROGRESS } from '@/utils/constant'
import { IRPCActionType } from '@/utils/enum'

interface UpdateInfo {
  type: 'update-available' | 'downloading' | 'update-downloaded'
  title: string
  version?: string
  message?: string
  releaseNotes?: string
}

const updateInfo = ref<UpdateInfo>({
  type: 'update-available',
  title: 'New Update Available',
})

const dontShowAgain = ref(false)
const downloadProgress = ref<number | null>(null)

function handleUpdateInfo(info: UpdateInfo) {
  updateInfo.value = info
  if (info.type !== 'downloading') {
    downloadProgress.value = null
  }
}

function handleUpdateProgress(progress: { progress: number }) {
  downloadProgress.value = progress.progress
}

function renderMarkdown(content: string) {
  return marked(content, { breaks: true, gfm: true })
}

function downloadUpdate() {
  updateInfo.value.type = 'downloading'
  downloadProgress.value = 0
  window.electron.sendRPC(IRPCActionType.DOWNLOAD_UPDATE)
  if (dontShowAgain.value) {
    window.electron.sendRPC(IRPCActionType.SET_SHOW_UPDATE_TIP, false)
  }
}

function goToDownloadPage() {
  window.electron.sendRPC(IRPCActionType.GO_TO_DOWNLOAD_PAGE)
  if (dontShowAgain.value) {
    window.electron.sendRPC(IRPCActionType.SET_SHOW_UPDATE_TIP, false)
  }
  closeWindow()
}

function installUpdate() {
  window.electron.sendRPC(IRPCActionType.INSTALL_UPDATE)
}

function closeWindow() {
  if (dontShowAgain.value && updateInfo.value.type === 'update-available') {
    window.electron.sendRPC(IRPCActionType.SET_SHOW_UPDATE_TIP, false)
  }
  window.electron.sendRPC(IRPCActionType.CLOSE_CURRENT_WINDOW)
}

let unbindThemeListener: (() => void) | null = null

onMounted(() => {
  window.electron.ipcRendererOn(SHOW_UPDATE_INFO, handleUpdateInfo)
  window.electron.ipcRendererOn(UPDATE_PROGRESS, handleUpdateProgress)
  unbindThemeListener = window.electron.onThemeUpdate(_ => {
    console.log('UpdatePage received THEME_UPDATE')
  })
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners(SHOW_UPDATE_INFO)
  window.electron.ipcRendererRemoveAllListeners(UPDATE_PROGRESS)
  unbindThemeListener?.()
})
</script>

<style scoped src="./css/UpdatePage.css"></style>
