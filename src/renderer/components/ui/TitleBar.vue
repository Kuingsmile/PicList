<template>
  <div class="title-bar" data-drag-region>
    <div class="title-bar-content">
      <div v-if="osGlobal !== 'darwin'" class="title-left">
        <div class="app-icon">
          <img :src="defaultLogo" alt="App Icon" width="20" height="20" />
        </div>
      </div>

      <div class="title-center">
        <!-- Progress bar in title bar -->
        <div v-if="isShowprogress" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }" />
          </div>
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>

      <div class="title-right">
        <div class="window-controls">
          <button
            class="control-button pin-button"
            :class="{ active: isAlwaysOnTop }"
            :title="$t('titleBar.alwaysOnTop')"
            @click="setAlwaysOnTop"
          >
            <PinIcon :color="isAlwaysOnTop ? '#CE6769' : '#6B7280'" :size="14" />
          </button>
          <button class="control-button minimize-button" :title="$t('titleBar.minimize')" @click="minimizeWindow">
            <MinusIcon :size="14" />
          </button>
          <button class="control-button mini-button" :title="$t('titleBar.miniWindow')" @click="openMiniWindow">
            <ShrinkIcon :size="14" />
          </button>
          <button class="control-button close-button" :title="$t('titleBar.close')" @click="closeWindow">
            <XIcon :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinusIcon, PinIcon, ShrinkIcon, XIcon } from 'lucide-vue-next'
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'

import { IRPCActionType } from '@/utils/enum'
import { osGlobal } from '@/utils/global'

const isShowprogress = ref(false)
const progress = ref(0)
const isAlwaysOnTop = ref(false)
const defaultLogo = computed(() => `${import.meta.env.BASE_URL}roundLogo.png`)

function setAlwaysOnTop() {
  isAlwaysOnTop.value = !isAlwaysOnTop.value
  window.electron.sendRPC(IRPCActionType.MAIN_WINDOW_ON_TOP)
}

function minimizeWindow() {
  window.electron.sendRPC(IRPCActionType.MINIMIZE_WINDOW)
}

function openMiniWindow() {
  window.electron.sendRPC(IRPCActionType.OPEN_MINI_WINDOW)
}

function closeWindow() {
  window.electron.sendRPC(IRPCActionType.CLOSE_WINDOW)
}

const uploadProcessHandler = (data: { progress: number }) => {
  isShowprogress.value = data.progress !== 100 && data.progress !== 0
  progress.value = data.progress
}

onBeforeMount(() => {
  window.electron.ipcRendererOn('updateProgress', uploadProcessHandler)
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners('updateProgress')
})
</script>

<style scoped>
.title-bar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--color-border);
  height: 32px;
  background: var(--color-background-secondary);
  -webkit-app-region: drag;
}

.title-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 100%;
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

.app-icon img {
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
}

.app-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.app-version {
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-border);
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
  overflow: hidden;
  border-radius: 2px;
  height: 4px;
  background: var(--color-border);
  flex: 1;
}

.progress-fill {
  border-radius: 2px;
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s ease;
}

.progress-text {
  min-width: 35px;
  font-size: 11px;
  color: var(--color-text-secondary);
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
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 20px;
  color: var(--color-text-secondary);
  background: transparent;
  transition: var(--transition);
  cursor: pointer;
}

.control-button:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
}

.pin-button.active {
  color: var(--color-accent);
  background: var(--color-accent) 20;
}

.close-button:hover {
  color: white;
  background: var(--color-danger);
}
</style>
