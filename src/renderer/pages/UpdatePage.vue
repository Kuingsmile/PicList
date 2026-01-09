<template>
  <div class="update-page">
    <div class="update-dialog">
      <!-- Header -->
      <header class="dialog-header">
        <h1 class="dialog-title">{{ updateInfo.title }}</h1>
        <p v-if="updateInfo.version" class="dialog-version">
          <span class="version-label">Version</span>
          <span class="version-number">v{{ updateInfo.version }}</span>
        </p>
      </header>

      <div v-if="updateInfo.type !== 'downloading' && downloadProgress !== null" class="progress-section">
        <div class="progress-info">
          <span class="progress-label">{{ $t('pages.update.downloading') }}</span>
          <span class="progress-percentage">{{ Math.round(downloadProgress) }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${downloadProgress}%` }"></div>
        </div>
      </div>

      <div class="dialog-content">
        <div v-if="updateInfo.releaseNotes" class="release-notes">
          <h2 class="content-title">{{ $t('pages.update.releaseNotes') }}</h2>
          <div class="notes-body" v-html="renderMarkdown(updateInfo.releaseNotes)"></div>
        </div>

        <div v-else-if="updateInfo.message" class="update-message">
          <p>{{ updateInfo.message }}</p>
        </div>

        <!-- Checkbox (only for update-available) -->
        <div v-if="updateInfo.type === 'update-available'" class="settings-section">
          <label class="checkbox-wrapper">
            <input v-model="dontShowAgain" type="checkbox" class="checkbox-input" />
            <span class="checkbox-box">
              <svg
                class="checkbox-icon"
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
            <span class="checkbox-label">{{ $t('pages.update.noMoreNotice') }}</span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <footer class="dialog-footer">
        <template v-if="updateInfo.type === 'update-available'">
          <button class="btn btn-ghost" @click="goToDownloadPage">
            <Link2Icon class="btn-icon" />
            {{ $t('pages.update.goToDownloadPage') }}
          </button>
          <button class="btn btn-primary" @click="downloadUpdate">
            <DownloadIcon class="btn-icon" />
            {{ $t('pages.update.download') }}
          </button>
        </template>
        <template v-else-if="updateInfo.type === 'downloading'">
          <button class="btn btn-ghost" @click="closeWindow">
            <XIcon class="btn-icon" />
            {{ $t('common.cancel') }}
          </button>
        </template>
        <template v-else-if="updateInfo.type === 'update-downloaded'">
          <button class="btn btn-ghost" @click="closeWindow">
            {{ $t('pages.update.later') }}
          </button>
          <button class="btn btn-primary" @click="installUpdate">
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

const handleUpdateInfo = (info: UpdateInfo) => {
  updateInfo.value = info
  if (info.type !== 'downloading') {
    downloadProgress.value = null
  }
}

const handleUpdateProgress = (progress: { progress: number }) => {
  downloadProgress.value = progress.progress
}

const renderMarkdown = (content: string) => {
  return marked(content, { breaks: true, gfm: true })
}

const downloadUpdate = () => {
  updateInfo.value.type = 'downloading'
  downloadProgress.value = 0
  window.electron.sendRPC(IRPCActionType.DOWNLOAD_UPDATE)
  if (dontShowAgain.value) {
    window.electron.sendRPC(IRPCActionType.SET_SHOW_UPDATE_TIP, false)
  }
}

const goToDownloadPage = () => {
  window.electron.sendRPC(IRPCActionType.GO_TO_DOWNLOAD_PAGE)
  if (dontShowAgain.value) {
    window.electron.sendRPC(IRPCActionType.SET_SHOW_UPDATE_TIP, false)
  }
  closeWindow()
}

const installUpdate = () => {
  window.electron.sendRPC(IRPCActionType.INSTALL_UPDATE)
}

const closeWindow = () => {
  if (dontShowAgain.value && updateInfo.value.type === 'update-available') {
    window.electron.sendRPC(IRPCActionType.SET_SHOW_UPDATE_TIP, false)
  }
  window.electron.sendRPC(IRPCActionType.CLOSE_CURRENT_WINDOW)
}

onMounted(() => {
  window.electron.ipcRendererOn(SHOW_UPDATE_INFO, handleUpdateInfo)
  window.electron.ipcRendererOn(UPDATE_PROGRESS, handleUpdateProgress)
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners(SHOW_UPDATE_INFO)
  window.electron.ipcRendererRemoveAllListeners(UPDATE_PROGRESS)
})
</script>

<style scoped src="./css/UpdatePage.css"></style>
