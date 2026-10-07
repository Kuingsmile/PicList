<template>
  <section
    class="flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-xl border border-border-secondary bg-bg-secondary"
  >
    <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-secondary px-3 py-2">
      <div
        class="flex h-[32px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5"
        role="tablist"
        :aria-label="label"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          class="flex h-full cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors duration-fast focus-visible:focus-ring"
          :class="
            activeTab === tab.id
              ? 'bg-accent text-white shadow-sm'
              : 'text-secondary hover:bg-accent/10 hover:text-main'
          "
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span
            class="min-w-[18px] rounded-full px-1.5 text-center text-[11px] leading-[18px] font-semibold tabular-nums"
            :class="activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-bg-tertiary text-secondary'"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
      <div class="ml-auto flex items-center gap-1">
        <slot name="actions" />
      </div>
    </div>

    <div
      v-if="!items.length"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center"
      role="status"
    >
      <InboxIcon :size="32" class="text-tertiary" aria-hidden="true" />
      <p class="m-0 text-sm text-secondary">{{ t('pages.manage.bucket.noTasks') }}</p>
    </div>
    <VirtualScroller v-else :items :item-height="62" class="min-h-0 w-full flex-1 px-2 pt-2" view-mode="list">
      <template #default="{ item }">
        <div
          class="flex h-[56px] w-full items-center gap-3 rounded-lg border border-border-secondary bg-bg px-3 transition-colors duration-fast hover:border-accent/50"
        >
          <span
            class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg"
            :class="phaseStyle[phaseOf(item)].tile"
            aria-hidden="true"
          >
            <component
              :is="phaseStyle[phaseOf(item)].icon"
              :size="16"
              :class="{ 'animate-spin motion-reduce:animate-none': phaseOf(item) === 'running' }"
            />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-2">
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-main" :title="item.sourceFileName">
                {{ item.sourceFileName || item.targetFilePath || item.id }}
              </span>
              <span class="shrink-0 text-xs font-medium tabular-nums" :class="phaseStyle[phaseOf(item)].text">
                {{ statusText(item) }}
              </span>
            </div>
            <div
              v-if="isActive(item)"
              class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="Math.round(item.progress || 0)"
              :aria-label="item.sourceFileName"
            >
              <div
                class="h-full rounded-full bg-accent transition-[width] duration-300 ease-apple"
                :style="{ width: `${Math.min(100, Math.max(0, item.progress || 0))}%` }"
              />
            </div>
            <p v-else class="m-0 mt-0.5 truncate text-xs text-secondary" :title="reasonOf(item)">
              <span v-if="item.finishTime" class="tabular-nums">{{ item.finishTime }}</span>
              <template v-if="reasonOf(item)">
                <span v-if="item.finishTime" aria-hidden="true"> · </span>{{ reasonOf(item) }}
              </template>
            </p>
          </div>
          <slot name="item-action" :item :active="isActive(item)" />
        </div>
      </template>
    </VirtualScroller>
  </section>
</template>

<script setup lang="ts" generic="T extends IUploadTask | IDownloadTask">
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleSlashIcon,
  ClockIcon,
  InboxIcon,
  LoaderCircleIcon,
  PauseIcon,
} from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import VirtualScroller from '@/components/VirtualScroller.vue'

export type TransferPhase = 'running' | 'queued' | 'paused' | 'done' | 'failed' | 'canceled'

const {
  tabs,
  items,
  label,
  reason = undefined,
} = defineProps<{
  tabs: { id: string; label: string; count: number }[]
  items: T[]
  label: string
  /** Human readable failure reason, if any. */
  reason?: (item: T) => string | undefined
}>()

defineSlots<{
  actions?: () => unknown
  'item-action'?: (props: { item: T; active: boolean }) => unknown
}>()

const activeTab = defineModel<string>('tab', { required: true })

const { t } = useI18n()

const phaseStyle = {
  running: { icon: LoaderCircleIcon, tile: 'bg-accent/10 text-accent', text: 'text-accent' },
  queued: { icon: ClockIcon, tile: 'bg-bg-tertiary text-secondary', text: 'text-secondary' },
  paused: { icon: PauseIcon, tile: 'bg-warning/15 text-warning', text: 'text-warning' },
  done: { icon: CircleCheckIcon, tile: 'bg-success/15 text-success', text: 'text-success' },
  failed: { icon: CircleAlertIcon, tile: 'bg-danger/10 text-danger', text: 'text-danger' },
  canceled: { icon: CircleSlashIcon, tile: 'bg-bg-tertiary text-secondary', text: 'text-secondary' },
} as const

function phaseOf(item: T): TransferPhase {
  switch (item.status) {
    case 'uploading':
    case 'downloading':
      return 'running'
    case 'queuing':
      return 'queued'
    case 'paused':
      return 'paused'
    case 'uploaded':
    case 'downloaded':
      return 'done'
    case 'canceled':
      return 'canceled'
    default:
      return 'failed'
  }
}

function isActive(item: T) {
  return ['running', 'queued', 'paused'].includes(phaseOf(item))
}

function statusText(item: T) {
  const phase = phaseOf(item)
  if (phase === 'running') return `${Math.round(item.progress || 0)}%`
  return t(`pages.manage.bucket.taskStatus.${phase}`)
}

function reasonOf(item: T) {
  return reason?.(item)
}
</script>
