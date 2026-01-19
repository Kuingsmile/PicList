<template>
  <div
    class="fixed top-0 right-0 left-0 z-1000 h-[32px] border-b border-b-border bg-bg-secondary drag-region"
    data-drag-region
  >
    <div class="flex h-full items-center justify-between px-4 py-0">
      <div v-if="osGlobal !== 'darwin'" class="flex items-center gap-2 no-drag-region">
        <div class="flex items-center text-accent">
          <img :src="defaultLogo" width="18" height="18" class="pointer-events-none select-none no-drag-region" />
        </div>
      </div>

      <div class="flex flex-1 items-center justify-center no-drag-region">
        <div v-if="isShowprogress" class="flex w-full max-w-[600px] min-w-[100px] items-center gap-2">
          <div class="h-[14px] w-full max-w-[600px] min-w-[100px] flex-1 overflow-hidden rounded-[2px] bg-border">
            <div
              class="h-full rounded-[2px] bg-success transition-all duration-300 ease-in-out"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <span class="min-w-[35px] text-[11px] text-secondary">{{ progress }}%</span>
        </div>
      </div>

      <div class="flex items-center no-drag-region">
        <div class="flex items-center gap-[8px]">
          <button class="control-button" :title="$t('titleBar.alwaysOnTop')" @click="setAlwaysOnTop">
            <PinIcon
              :size="14"
              class="text-[#6b7280] [.active]:rotate-90 [.active]:text-[#ce6769]"
              :class="{ active: isAlwaysOnTop }"
            />
          </button>
          <template v-if="osGlobal !== 'darwin'">
            <button class="control-button minimize" :title="$t('titleBar.minimize')" @click="minimizeWindow">
              <MinusIcon :size="14" />
            </button>
            <button class="control-button mini" :title="$t('titleBar.miniWindow')" @click="openMiniWindow">
              <ShrinkIcon :size="14" />
            </button>
            <button class="control-button close" :title="$t('titleBar.close')" @click="closeWindow">
              <XIcon :size="14" />
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinusIcon, PinIcon, ShrinkIcon, XIcon } from 'lucide-vue-next'
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'

import { osGlobal } from '@/hooks/useGlobal'
import { IRPCActionType } from '@/utils/enum'

const isShowprogress = ref(false)
const progress = ref(0)
const isAlwaysOnTop = ref(false)
const defaultLogo = computed(() => `${import.meta.env.BASE_URL}roundLogo.png`)

function setAlwaysOnTop() {
  isAlwaysOnTop.value = !isAlwaysOnTop.value
  window.electron.sendRPC(IRPCActionType.MAIN_WINDOW_ON_TOP)
}

const minimizeWindow = () => window.electron.sendRPC(IRPCActionType.MINIMIZE_WINDOW)
const openMiniWindow = () => window.electron.sendRPC(IRPCActionType.OPEN_MINI_WINDOW)
const closeWindow = () => window.electron.sendRPC(IRPCActionType.CLOSE_WINDOW)

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
@import 'tailwindcss' reference;
@import '../../assets/css/theme.css' reference;
@import '../../assets/css/utilities.css' reference;

.control-button {
  @apply flex h-[20px] w-[28px] cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-secondary transition-all duration-fast ease-standard hover:bg-surface-elevated hover:text-main [.close:hover]:bg-danger [.close:hover]:text-white [.mini:hover]:bg-success/85 [.mini:hover]:text-white [.minimize:hover]:bg-accent/85 [.minimize:hover]:text-white;
}
</style>
