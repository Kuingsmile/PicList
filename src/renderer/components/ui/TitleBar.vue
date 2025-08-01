<template>
  <div
    class="title-bar"
    data-drag-region
  >
    <div class="title-bar-content">
      <div class="title-left">
        <div class="app-icon">
          <img
            src="/roundLogo.png"
            alt="App Icon"
            width="20"
            height="20"
          >
        </div>
      </div>

      <div class="title-center">
        <!-- Progress bar in title bar -->
        <div
          v-if="isShowprogress"
          class="progress-container"
        >
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>

      <div
        class="title-right"
      >
        <div class="window-controls">
          <button
            class="control-button pin-button"
            :class="{ active: isAlwaysOnTop }"
            :title="$t('titleBar.alwaysOnTop')"
            @click="setAlwaysOnTop"
          >
            <PinIcon
              :color="isAlwaysOnTop ? '#CE6769' : '#000'"
              :size="14"
            />
          </button>
          <button
            class="control-button minimize-button"
            :title="$t('titleBar.minimize')"
            @click="minimizeWindow"
          >
            <MinusIcon :size="14" />
          </button>
          <button
            class="control-button mini-button"
            :title="$t('titleBar.miniWindow')"
            @click="openMiniWindow"
          >
            <ShrinkIcon :size="14" />
          </button>
          <button
            class="control-button close-button"
            :title="$t('titleBar.close')"
            @click="closeWindow"
          >
            <XIcon :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IpcRendererEvent } from 'electron'
import { MinusIcon, PinIcon, ShrinkIcon, XIcon } from 'lucide-vue-next'
import { onBeforeMount, onBeforeUnmount, ref } from 'vue'

import { IRPCActionType } from '#/types/enum'

const isShowprogress = ref(false)
const progress = ref(0)
const isAlwaysOnTop = ref(false)

function setAlwaysOnTop () {
  isAlwaysOnTop.value = !isAlwaysOnTop.value
  window.electron.sendRPC(IRPCActionType.MAIN_WINDOW_ON_TOP)
}

function minimizeWindow () {
  window.electron.sendRPC(IRPCActionType.MINIMIZE_WINDOW)
}

function openMiniWindow () {
  window.electron.sendRPC(IRPCActionType.OPEN_MINI_WINDOW)
}

function closeWindow () {
  window.electron.sendRPC(IRPCActionType.CLOSE_WINDOW)
}
const uploadProcessHandler = (_event: IpcRendererEvent, data: { progress: number }) => {
  isShowprogress.value = data.progress !== 100 && data.progress !== 0
  progress.value = data.progress
}

onBeforeMount(() => {
  window.electron.ipcRendererOn('updateProgress', uploadProcessHandler)
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveListener('updateProgress', uploadProcessHandler)
})
</script>

<style scoped>
.title-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
  -webkit-app-region: drag;
}

.title-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.app-icon {
  display: flex;
  align-items: center;
  color: var(--color-accent);
}

.app-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.app-version {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-border);
  padding: 2px 6px;
  border-radius: 4px;
}

.title-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: no-drag;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 200px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 35px;
}

.title-right {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.control-button:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.pin-button.active {
  color: var(--color-accent);
  background: var(--color-accent)20;
}

.close-button:hover {
  background: var(--color-danger);
  color: white;
}
</style>
