<template>
  <article
    class="group/plugin flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-bg-secondary p-4 shadow-sm transition-all duration-fast ease-apple hover:border-accent hover:shadow-md"
    :aria-busy="item.ing || undefined"
    @contextmenu.prevent="!installMode && emit('manage', item)"
  >
    <!-- Identity -->
    <div class="flex min-w-0 items-start gap-3">
      <img
        class="h-[40px] w-[40px] shrink-0 rounded-lg bg-bg-tertiary object-cover transition-all duration-fast ease-apple"
        :class="{ 'opacity-60 grayscale': isDisabled }"
        :src="item.logo"
        alt=""
        loading="lazy"
        @error="setFallbackLogo"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <div class="flex min-w-0 items-center gap-1.5">
          <button
            v-if="item.homepage"
            v-tooltip="t('pages.plugin.openHomepage')"
            type="button"
            class="min-w-0 cursor-pointer truncate text-left text-sm font-semibold text-main hover:text-accent hover:underline focus-visible:focus-ring"
            @click="openHomepage"
          >
            {{ item.name }}
          </button>
          <h3 v-else class="m-0 min-w-0 truncate text-sm font-semibold text-main">{{ item.name }}</h3>
          <span class="shrink-0 rounded-sm bg-bg-tertiary px-1.5 py-px text-xs text-secondary tabular-nums">
            v{{ item.version }}
          </span>
        </div>
        <p class="m-0 flex min-w-0 items-center gap-1.5 text-xs text-secondary">
          <span class="truncate">{{ author }}</span>
          <template v-if="updatedAt">
            <span aria-hidden="true">·</span>
            <span v-tooltip="t('pages.plugin.lastUpdated')" class="shrink-0 tabular-nums">{{ updatedAt }}</span>
          </template>
        </p>
      </div>
      <span
        v-if="!item.gui"
        v-tooltip="t('pages.plugin.cliOnlyTooltip')"
        class="shrink-0 rounded-sm border border-border px-1.5 py-px text-[11px] font-semibold text-secondary"
      >
        CLI
      </span>
    </div>

    <p
      class="m-0 line-clamp-2 min-h-[2.5rem] text-xs leading-[1.25rem] text-secondary"
      :class="{ 'opacity-70': isDisabled }"
      :title="item.description"
    >
      {{ item.description || t('pages.plugin.noDescription') }}
    </p>

    <!-- Status & actions -->
    <div class="mt-auto flex min-h-[32px] items-center gap-2 border-t border-border-secondary pt-3">
      <template v-if="installMode">
        <span
          v-if="weeklyDownloads"
          v-tooltip="t('pages.plugin.weeklyDownloads')"
          class="inline-flex items-center gap-1 text-xs text-secondary tabular-nums"
        >
          <TrendingUpIcon :size="13" aria-hidden="true" />{{ t('pages.plugin.perWeek', { n: weeklyDownloads }) }}
        </span>
        <span
          v-if="item.hasInstall"
          class="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-success"
          role="status"
        >
          <CircleCheck :size="14" aria-hidden="true" />{{ t('pages.plugin.installed') }}
        </span>
        <CustomButton
          v-else
          type="secondary"
          class="ml-auto h-[32px] py-0!"
          :icon="DownloadIcon"
          :loading="item.ing"
          :text="item.ing ? t('pages.plugin.installing') : t('pages.plugin.install')"
          @click="emit('install', item)"
        />
      </template>
      <template v-else>
        <span v-if="item.ing" class="inline-flex items-center gap-1.5 text-xs font-medium text-secondary" role="status">
          <LoaderCircle :size="14" class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ t('pages.plugin.working') }}
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 text-xs font-medium"
          :class="isDisabled ? 'text-secondary' : 'text-success'"
        >
          <span
            class="h-[7px] w-[7px] rounded-full"
            :class="isDisabled ? 'bg-gray-400' : 'bg-success'"
            aria-hidden="true"
          />
          {{ isDisabled ? t('pages.plugin.disabled') : t('pages.plugin.enabled') }}
        </span>
        <div class="ml-auto flex items-center gap-1.5">
          <CustomButton
            v-if="hasUpdate"
            v-tooltip="t('pages.plugin.updateTo', { version: latestVersion })"
            class="h-[32px] px-3! py-0!"
            :icon="ArrowUpCircle"
            :disabled="item.ing"
            :text="t('pages.plugin.update')"
            @click="emit('update', item)"
          />
          <CustomButton
            type="secondary"
            class="h-[32px] px-3! py-0!"
            :icon="SlidersHorizontal"
            :disabled="item.ing"
            :text="t('pages.plugin.manage')"
            :aria-label="t('pages.plugin.manageThing', { name: item.name })"
            aria-haspopup="menu"
            @click="emit('manage', item)"
          />
        </div>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ArrowUpCircle, CircleCheck, DownloadIcon, LoaderCircle, SlidersHorizontal, TrendingUpIcon } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import { IRPCActionType } from '#/constants/rpcActions'

const {
  item,
  installMode = false,
  latestVersion = '',
  updatedAt = '',
} = defineProps<{ item: IPicGoPlugin; installMode?: boolean; latestVersion?: string; updatedAt?: string }>()
const emit = defineEmits<{
  install: [plugin: IPicGoPlugin]
  manage: [plugin: IPicGoPlugin]
  update: [plugin: IPicGoPlugin]
}>()
const { t, locale } = useI18n()

const isDisabled = computed(() => !installMode && !item.enabled)
const hasUpdate = computed(() => !!latestVersion && latestVersion !== String(item.version))
const author = computed(() => item.author?.replace(/<.*>/, '').trim() || 'unknown')
const weeklyDownloads = computed(() =>
  item.downloads
    ? new Intl.NumberFormat(locale.value, { notation: 'compact', maximumFractionDigits: 1 }).format(item.downloads)
    : '',
)

function setFallbackLogo(e: Event) {
  const target = e.target as HTMLImageElement
  // Guard against a loop if the fallback itself fails to load.
  if (!target.src.endsWith('roundLogo.png')) target.src = import.meta.env.BASE_URL + 'roundLogo.png'
}

function openHomepage() {
  if (item.homepage) window.electron.sendRPC(IRPCActionType.OPEN_URL, item.homepage)
}
</script>
