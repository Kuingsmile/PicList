<template>
  <div
    class="relative flex h-auto flex-col rounded-xl border-2 border-border-secondary p-6 shadow-md transition-all duration-200 ease-apple hover:border-accent hover:shadow-xl [.disabled]:opacity-70"
    :class="{ disabled: !item.enabled && !installMode }"
  >
    <!-- Plugin Badge -->
    <div
      v-if="!item.gui"
      class="absolute top-4 right-4 z-1 rounded-sm bg-accent/20 px-2 py-1 text-sm font-semibold text-secondary"
    >
      CLI
    </div>

    <!-- Update Badge -->
    <div
      v-if="latestVersion && latestVersion !== item.version"
      class="absolute top-4 right-4 z-1 rounded-sm bg-success px-2 py-1 text-sm font-semibold text-white"
    >
      NEW
    </div>

    <!-- Plugin Header -->
    <div class="mb-4 flex items-start gap-2">
      <img class="h-[48px] w-[48px] shrink-0 rounded-lg object-cover" :src="item.logo" :onerror="setSrc" alt="" />
      <div class="relative min-w-0 flex-1">
        <div class="flex flex-row gap-3">
          <h3
            class="mb-1 flex cursor-pointer items-center overflow-hidden text-base font-semibold text-ellipsis whitespace-nowrap text-main hover:text-accent"
            @click="openHomepage(item.homepage)"
          >
            {{ item.name }}
            <span class="ml-1 rounded-sm bg-bg-tertiary px-1 py-0.5 text-xs font-normal text-secondary opacity-80"
              >v{{ item.version }}</span
            >
          </h3>
        </div>
        <div class="flex items-center gap-2">
          <p class="m-0 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-secondary">
            {{ item.author.replace(/<.*>/, '') }}
          </p>
          <span
            v-if="updatedAt"
            v-tooltip="t('pages.plugin.lastUpdated')"
            class="flex shrink-0 items-center gap-1 text-xs text-secondary/70"
          >
            <CalendarIcon :size="11" />
            {{ updatedAt }}
          </span>
        </div>
      </div>
    </div>

    <!-- Plugin Description -->
    <div class="mb-6 flex flex-1 items-start">
      <p class="m-0 min-h-10 overflow-hidden text-sm leading-[1.5] font-semibold text-secondary">
        {{ item.description }}
      </p>
    </div>

    <!-- Plugin Actions -->
    <div class="mt-auto pt-4">
      <template v-if="installMode">
        <template v-if="!item.hasInstall">
          <button
            v-if="!item.ing"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md border-none bg-success/90 px-4 py-3 font-[inherit] text-sm font-semibold text-white not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
            @click="emit('install', item)"
          >
            <DownloadIcon :size="16" />
            {{ t('pages.plugin.install') }}
          </button>
          <button
            v-else
            class="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-surface-elevated px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
            disabled
          >
            <div
              class="h-[16px] w-[16px] animate-spin rounded-full border-2 border-t-2 border-transparent border-t-current"
            />
            {{ t('pages.plugin.installing') }}
          </button>
        </template>
        <button
          v-else
          class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-success bg-success/30 px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          disabled
        >
          <CheckIcon :size="16" />
          {{ t('pages.plugin.installed') }}
        </button>
      </template>
      <template v-else>
        <button
          v-if="item.ing"
          class="flex w-full cursor-pointer items-center gap-2 rounded-md border bg-surface-elevated px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          disabled
        >
          <div
            class="h-[16px] w-[16px] animate-spin rounded-full border-2 border-t-2 border-transparent border-t-current"
          />
          {{ t('pages.plugin.doingSomething') }}
        </button>
        <template v-else>
          <button
            v-if="item.enabled"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-secondary px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
            @click="emit('settings', item)"
          >
            <SettingsIcon :size="16" />
            {{ t('pages.plugin.settings') }}
          </button>
          <button
            v-else
            class="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-secondary px-4 py-3 font-[inherit] text-sm font-semibold text-secondary not-disabled:hover:-translate-y-px not-disabled:hover:border-warning not-disabled:hover:bg-surface-elevated not-disabled:hover:text-warning disabled:cursor-not-allowed disabled:opacity-70"
            @click="emit('settings', item)"
          >
            <XCircleIcon :size="16" />
            {{ t('pages.plugin.disabled') }}
          </button>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarIcon, CheckIcon, DownloadIcon, SettingsIcon, XCircleIcon } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import { IRPCActionType } from '#/constants/rpcActions'

defineProps<{ item: IPicGoPlugin; installMode?: boolean; latestVersion?: string; updatedAt?: string }>()
const emit = defineEmits<{ install: [plugin: IPicGoPlugin]; settings: [plugin: IPicGoPlugin] }>()
const { t } = useI18n()
function setSrc(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = import.meta.env.BASE_URL + 'roundLogo.png'
}

function openHomepage(url: string) {
  if (url) {
    window.electron.sendRPC(IRPCActionType.OPEN_URL, url)
  }
}
</script>
