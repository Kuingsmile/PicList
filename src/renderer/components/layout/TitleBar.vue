<template>
  <div
    class="fixed inset-x-0 top-0 z-1000 h-[32px] border-b border-b-border/40 bg-bg-secondary drag-region"
    data-drag-region
  >
    <div class="flex h-full items-center justify-between px-4">
      <div v-if="!isMacOS" class="flex items-center text-accent no-drag-region">
        <img :src="defaultLogo" width="18" height="18" class="pointer-events-none select-none no-drag-region" />
      </div>

      <div v-if="isShowprogress" class="flex flex-1 items-center justify-center no-drag-region">
        <div class="flex w-full max-w-[600px] min-w-[100px] items-center gap-2">
          <div class="h-[14px] w-full flex-1 overflow-hidden rounded-sm bg-border">
            <div
              class="h-full rounded-sm bg-success transition-all duration-300 ease-in-out"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <span class="min-w-[35px] text-[11px] text-secondary">{{ Math.round(progress) }}%</span>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-2 no-drag-region">
        <button
          v-tooltip="t('titleBar.alwaysOnTop')"
          class="group flex h-[20px] w-[28px] cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-secondary transition-all duration-fast ease-standard hover:bg-warning/85 hover:text-white"
          :aria-label="t('titleBar.alwaysOnTop')"
          @click="setAlwaysOnTop"
        >
          <PinIcon
            :size="14"
            class="text-secondary group-hover:text-white! [.active]:rotate-90 [.active]:text-danger"
            :class="{ active: isAlwaysOnTop }"
          />
        </button>
        <template v-if="!isMacOS">
          <template v-for="button in nonMacOSButton" :key="button.title">
            <button
              v-tooltip="t(button.title)"
              class="flex h-[20px] w-[28px] cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-secondary transition-all duration-fast ease-standard"
              :class="button.class"
              :aria-label="t(button.title)"
              @click="handleNonMacOSButtonClick(button.action)"
            >
              <component :is="button.icon" :size="14" />
            </button>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinusIcon, PinIcon, ShrinkIcon, XIcon } from '@lucide/vue'
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { osGlobal } from '@/composables/useGlobal'
import { TITLE_BAR_UPDATE_PROGRESS } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'

const isShowprogress = ref(false)
const progress = ref(0)
const isAlwaysOnTop = ref(false)
const { t } = useI18n()

const nonMacOSButton = [
  {
    title: 'titleBar.minimize',
    action: IRPCActionType.MINIMIZE_WINDOW,
    icon: MinusIcon,
    class: 'hover:bg-accent/85 hover:text-white',
  },
  {
    title: 'titleBar.miniWindow',
    action: IRPCActionType.OPEN_MINI_WINDOW,
    icon: ShrinkIcon,
    class: 'hover:bg-success/85 hover:text-white',
  },
  {
    title: 'titleBar.close',
    action: IRPCActionType.CLOSE_WINDOW,
    icon: XIcon,
    class: 'hover:bg-danger/85 hover:text-white',
  },
]

const isMacOS = computed(() => osGlobal.value === 'darwin')
const defaultLogo = computed(() => `${import.meta.env.BASE_URL}roundLogo.png`)

function setAlwaysOnTop() {
  isAlwaysOnTop.value = !isAlwaysOnTop.value
  window.electron.sendRPC(IRPCActionType.MAIN_WINDOW_ON_TOP)
}

function handleNonMacOSButtonClick(
  action:
    typeof IRPCActionType.MINIMIZE_WINDOW | typeof IRPCActionType.OPEN_MINI_WINDOW | typeof IRPCActionType.CLOSE_WINDOW,
) {
  window.electron.sendRPC(action)
}

function uploadProcessHandler(data: { progress: number }) {
  isShowprogress.value = data.progress !== 100 && data.progress !== 0
  progress.value = data.progress
}

onBeforeMount(() => {
  window.electron.ipcRendererOn(TITLE_BAR_UPDATE_PROGRESS, uploadProcessHandler)
})

onBeforeUnmount(() => {
  window.electron.ipcRendererRemoveAllListeners(TITLE_BAR_UPDATE_PROGRESS)
})
</script>
