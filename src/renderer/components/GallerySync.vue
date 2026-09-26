<template>
  <CustomButton type="secondary" :icon="RefreshCw" :text="syncText('preview')" :disabled="busy" @click="preview" />
  <CustomModal
    v-if="visible"
    :visible="visible"
    max-width="1000px"
    role="dialog"
    aria-modal="true"
    :aria-label="syncText('title')"
    @update:visible="close"
  >
    <template #titleBar>
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
          <RefreshCw :size="20" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-main">{{ syncText('title') }}</h2>
          <p class="text-sm text-secondary">{{ syncText('subtitle') }}</p>
        </div>
      </div>
    </template>

    <div class="space-y-5 p-5 text-main max-md:p-0" :aria-busy="busy">
      <ol class="grid grid-cols-3 gap-2 rounded-lg border border-border bg-bg-secondary p-3">
        <li
          v-for="(step, index) in steps"
          :key="step"
          class="flex items-center justify-center gap-2 text-sm max-sm:flex-col max-sm:text-center"
          :class="currentStep === index + 1 ? 'font-semibold text-accent' : 'text-secondary'"
          :aria-current="currentStep === index + 1 ? 'step' : undefined"
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            :class="currentStep >= index + 1 ? 'bg-accent text-white' : 'bg-border text-secondary'"
          >
            <Check v-if="currentStep > index + 1" :size="14" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          {{ syncText(step) }}
        </li>
      </ol>

      <div v-if="error" role="alert" class="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
        <CircleAlert :size="20" class="mt-0.5 shrink-0 text-danger" />
        <div class="min-w-0 space-y-1 text-sm">
          <p class="font-semibold text-danger">{{ syncText('errorTitle') }}</p>
          <p class="wrap-anywhere">{{ error }}</p>
        </div>
      </div>
      <div
        v-if="applied"
        role="status"
        class="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4"
      >
        <CircleCheck :size="22" class="shrink-0 text-success" />
        <div>
          <p class="font-semibold">{{ syncText('successTitle') }}</p>
          <p class="mt-1 text-sm text-secondary">{{ syncText('success') }}</p>
        </div>
      </div>

      <div
        v-if="operation === 'preview'"
        role="status"
        class="flex flex-col items-center gap-3 rounded-lg border border-border bg-bg-secondary px-4 py-10 text-center"
      >
        <LoaderCircle :size="28" class="animate-spin text-accent motion-reduce:animate-none" />
        <p class="font-semibold">{{ syncText('loadingTitle') }}</p>
        <p class="text-sm text-secondary">{{ syncText('loadingDescription') }}</p>
      </div>

      <template v-if="plan">
        <div
          v-if="plan.migration && !applied"
          class="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4"
        >
          <Info :size="18" class="mt-0.5 shrink-0 text-accent" />
          <div>
            <p class="text-sm font-semibold">{{ syncText('migrationTitle') }}</p>
            <p class="mt-1 text-sm leading-relaxed text-secondary">{{ syncText('migration') }}</p>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-3 max-sm:grid-cols-2" :aria-label="syncText('overview')">
          <button
            v-for="item in changeTypes"
            :key="item.kind"
            type="button"
            class="rounded-lg border bg-bg-secondary p-4 text-left shadow-sm transition-colors hover:border-accent focus-visible:focus-ring"
            :class="filter === item.kind ? 'border-accent ring-1 ring-accent' : 'border-border'"
            :aria-pressed="filter === item.kind"
            :aria-label="`${syncText(item.kind)}: ${plan.counts[item.kind]}`"
            @click="filter = filter === item.kind ? 'all' : item.kind"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-secondary">{{ syncText(item.kind) }}</span>
              <component :is="item.icon" :size="18" :class="item.color" />
            </div>
            <span class="text-2xl font-semibold tabular-nums">{{ plan.counts[item.kind] }}</span>
          </button>
        </div>

        <SettingSection
          :icon="ListChecks"
          :title="syncText('reviewTitle')"
          :description="syncText('description')"
          only-one-row
        >
          <template #description>
            <p class="text-sm text-secondary">{{ syncText('description') }}</p>
          </template>
          <div v-if="plan.counts.conflict" class="rounded-md border border-border bg-bg-tertiary p-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p class="flex items-center gap-2 font-semibold">
                <CircleCheck v-if="!unresolvedCount" :size="16" class="text-success" />
                <GitMerge v-else :size="16" class="text-warning" />
                {{ syncText('resolutionProgress', { resolved: resolvedCount, total: plan.counts.conflict }) }}
              </p>
              <button v-if="unresolvedCount" type="button" class="text-accent hover:underline" @click="showConflicts">
                {{ syncText('showConflicts') }}
              </button>
            </div>
            <details class="mt-2 text-sm text-secondary">
              <summary class="cursor-pointer hover:text-accent">{{ syncText('resolutionHelp') }}</summary>
              <p class="mt-2 leading-relaxed">{{ syncText('resolutions') }}</p>
            </details>
          </div>

          <div v-if="plan.changes.length" class="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/10"
              :class="filter === 'all' ? 'bg-accent/10 text-accent' : 'text-secondary'"
              :aria-pressed="filter === 'all'"
              @click="filter = 'all'"
            >
              {{ syncText('allChanges') }} <span class="ml-1 tabular-nums">{{ plan.changes.length }}</span>
            </button>
            <div class="relative min-w-0 flex-1 sm:max-w-72">
              <Search :size="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-secondary" />
              <input
                v-model="search"
                type="search"
                :aria-label="syncText('search')"
                :placeholder="syncText('search')"
                class="w-full rounded-md border border-border bg-bg-tertiary py-2 pr-3 pl-9 text-sm text-main focus:border-accent"
              />
            </div>
          </div>

          <div v-if="!plan.changes.length" class="flex flex-col items-center gap-2 py-8 text-center">
            <CircleCheck :size="32" class="mb-1 text-success" />
            <h3 class="font-semibold">{{ syncText('noChanges') }}</h3>
            <p class="text-sm text-secondary">{{ syncText(plan.migration ? 'migrationReady' : 'upToDate') }}</p>
          </div>
          <template v-else-if="filteredChanges.length">
            <p class="text-xs text-secondary" role="status">
              {{ syncText('showingChanges', { from: firstVisible, to: lastVisible, total: filteredChanges.length }) }}
              <span v-if="filter !== 'all'"> · {{ syncText(filter) }}</span>
            </p>
            <GallerySyncChangeCard
              v-for="change in visibleChanges"
              :key="`${plan.id}-${change.key}`"
              v-model="resolutions[change.key]"
              :change="change"
              :disabled="busy || !ready"
            />
            <div
              v-if="pageCount > 1"
              class="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
            >
              <p class="text-sm text-secondary">{{ syncText('page', { current: page, total: pageCount }) }}</p>
              <div class="flex gap-2">
                <CustomButton
                  type="secondary"
                  :icon="ChevronLeft"
                  :text="syncText('previous')"
                  :disabled="page === 1"
                  @click="page--"
                />
                <CustomButton
                  type="secondary"
                  :icon="ChevronRight"
                  :text="syncText('next')"
                  :disabled="page === pageCount"
                  @click="page++"
                />
              </div>
            </div>
          </template>
          <div v-else class="space-y-2 py-6 text-center">
            <Search :size="28" class="mx-auto text-tertiary" />
            <p class="font-semibold">{{ syncText('noMatches') }}</p>
            <button type="button" class="text-sm text-accent hover:underline" @click="resetFilters">
              {{ syncText('clearFilters') }}
            </button>
          </div>
        </SettingSection>
      </template>

      <details
        v-if="plan || snapshots.length || snapshotId"
        class="rounded-lg border border-border bg-bg-secondary p-4 shadow-sm"
      >
        <summary class="cursor-pointer text-sm font-semibold">
          <span class="ml-1 inline-flex items-center gap-2 align-middle"
            ><History :size="17" class="text-accent" />{{ syncText('exportsTitle') }}</span
          >
        </summary>
        <div class="mt-4 space-y-4">
          <p class="text-sm leading-relaxed text-secondary">{{ syncText('snapshot') }}</p>
          <CustomButton
            v-if="plan"
            type="secondary"
            :icon="Download"
            :text="syncText('exportSummary')"
            :disabled="busy"
            @click="exportFile('summary')"
          />
          <div v-if="snapshots.length || snapshotId" class="space-y-2 border-t border-border pt-4">
            <label for="gallery-rollback-snapshot" class="text-sm font-medium text-secondary">{{
              syncText('savedSnapshots')
            }}</label>
            <div class="flex flex-wrap items-center gap-3">
              <select
                id="gallery-rollback-snapshot"
                v-model="snapshotId"
                :disabled="busy"
                class="min-w-0 flex-1 rounded-md border border-border bg-bg-tertiary p-3 text-sm focus:border-accent"
              >
                <option v-if="snapshotId && !snapshots.some(item => item.id === snapshotId)" :value="snapshotId">
                  {{ syncText('latestSnapshot') }}
                </option>
                <option v-for="item in snapshots" :key="item.id" :value="item.id">
                  {{ formatDate(item.watermark) }} — {{ syncText(item.status) }}
                </option>
              </select>
              <CustomButton
                type="secondary"
                :icon="Download"
                :text="syncText('exportSnapshot')"
                :disabled="busy || !snapshotId"
                @click="exportFile('snapshot')"
              />
            </div>
          </div>
        </div>
      </details>
    </div>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <p class="flex min-w-0 items-center gap-2 text-sm text-secondary" role="status" aria-live="polite">
          <LoaderCircle v-if="busy" :size="16" class="shrink-0 animate-spin text-accent motion-reduce:animate-none" />
          <CircleCheck v-else-if="applied || canApply" :size="16" class="shrink-0 text-success" />
          <Info v-else :size="16" class="shrink-0" />
          {{ statusText }}
        </p>
        <div class="ml-auto flex flex-wrap justify-end gap-2">
          <CustomButton type="secondary" :text="syncText('close')" :disabled="busy" @click="close" />
          <CustomButton
            type="secondary"
            :icon="RefreshCw"
            :text="syncText('refresh')"
            :disabled="busy"
            @click="preview"
          />
          <CustomButton :icon="Check" :text="syncText('apply')" :disabled="!canApply" @click="apply" />
        </div>
      </div>
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Download,
  GitMerge,
  History,
  Info,
  ListChecks,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import SettingSection from '@/components/common/SettingSection.vue'
import GallerySyncChangeCard from '@/components/GallerySyncChangeCard.vue'
import { IRPCActionType } from '@/utils/enum'
import type {
  GallerySyncChange,
  GallerySyncPlan,
  GallerySyncRequest,
  GallerySyncResolution,
  GallerySyncResult,
  GallerySyncSnapshot,
} from '#/types/gallerySync'

const { t, locale } = useI18n()
const syncText = (key: string, params: Record<string, string | number> = {}) =>
  t(`pages.settings.sync.galleryPlan.${key}`, params)
const visible = ref(false)
const operation = ref<'preview' | 'apply' | 'export' | null>(null)
const busy = computed(() => operation.value !== null)
const ready = ref(false)
const applied = ref(false)
const error = ref('')
const plan = ref<GallerySyncPlan>()
const snapshotId = ref('')
const snapshots = ref<GallerySyncSnapshot[]>([])
const resolutions = ref<Record<string, GallerySyncResolution | ''>>({})
const filter = ref<GallerySyncChange['kind'] | 'all'>('all')
const search = ref('')
const page = ref(1)
const pageSize = 20
const steps = ['reviewStep', 'resolveStep', 'applyStep']
const changeTypes = [
  { kind: 'addition', icon: Plus, color: 'text-success' },
  { kind: 'update', icon: Pencil, color: 'text-accent' },
  { kind: 'conflict', icon: GitMerge, color: 'text-warning' },
  { kind: 'deletion', icon: Trash2, color: 'text-danger' },
] as const
const unresolvedCount = computed(
  () => plan.value?.changes.filter(change => change.kind === 'conflict' && !resolutions.value[change.key]).length ?? 0,
)
const resolvedCount = computed(() => (plan.value?.counts.conflict ?? 0) - unresolvedCount.value)
const canApply = computed(() => ready.value && !busy.value && !!plan.value && unresolvedCount.value === 0)
const currentStep = computed(() => (applied.value ? 4 : !plan.value ? 1 : unresolvedCount.value ? 2 : 3))
const statusText = computed(() => {
  if (operation.value) return syncText(`${operation.value}Working`)
  if (applied.value) return syncText('successTitle')
  if (!ready.value) return syncText('refreshRequired')
  if (unresolvedCount.value) return syncText('unresolved', { count: unresolvedCount.value })
  return syncText('readyToApply')
})
const filteredChanges = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return (plan.value?.changes ?? [])
    .filter(
      change =>
        (filter.value === 'all' || change.kind === filter.value) &&
        (!query || change.versions.some(version => version.name.toLocaleLowerCase().includes(query))),
    )
    .sort((a, b) => Number(b.kind === 'conflict') - Number(a.kind === 'conflict'))
})
const pageCount = computed(() => Math.ceil(filteredChanges.value.length / pageSize))
const firstVisible = computed(() => (page.value - 1) * pageSize + 1)
const lastVisible = computed(() => Math.min(page.value * pageSize, filteredChanges.value.length))
const visibleChanges = computed(() => filteredChanges.value.slice(firstVisible.value - 1, lastVisible.value))
watch([filter, search], () => {
  page.value = 1
})

function resetFilters() {
  filter.value = 'all'
  search.value = ''
  page.value = 1
}

function showConflicts() {
  resetFilters()
  filter.value = 'conflict'
}

function formatDate(value: number) {
  return new Date(value).toLocaleString(locale.value)
}

async function request<T>(request: GallerySyncRequest): Promise<T> {
  const response = await window.electron.triggerRPC<T | { error: string; snapshotId?: string }>(
    IRPCActionType.CONFIGURE_SYNC_GALLERY_DB,
    request,
  )
  if (response && typeof response === 'object' && 'error' in response) {
    if (response.snapshotId) snapshotId.value = response.snapshotId
    throw new Error(response.error)
  }
  if (response === undefined || response === null) throw new Error(syncText('failed'))
  return response as T
}

async function preview() {
  if (busy.value) return
  visible.value = true
  operation.value = 'preview'
  ready.value = false
  error.value = ''
  applied.value = false
  const previousPlan = plan.value
  plan.value = undefined
  resolutions.value = {}
  resetFilters()
  try {
    if (previousPlan)
      await window.electron.triggerRPC(IRPCActionType.CONFIGURE_SYNC_GALLERY_DB, {
        action: 'cancel',
        planId: previousPlan.id,
      })
    snapshots.value = await request<GallerySyncSnapshot[]>({ action: 'list-snapshots' })
    if (!snapshotId.value && snapshots.value.length) snapshotId.value = snapshots.value[0].id
    plan.value = await request<GallerySyncPlan>({ action: 'preview' })
    resolutions.value = Object.fromEntries(
      plan.value.changes.filter(item => item.kind === 'conflict').map(item => [item.key, '']),
    )
    ready.value = true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : syncText('failed')
  } finally {
    operation.value = null
  }
}

async function apply() {
  if (!canApply.value || !plan.value) return
  operation.value = 'apply'
  error.value = ''
  try {
    const result = await request<GallerySyncResult>({
      action: 'apply',
      planId: plan.value.id,
      resolutions: Object.fromEntries(
        Object.entries(resolutions.value).filter((entry): entry is [string, GallerySyncResolution] => !!entry[1]),
      ),
    })
    snapshotId.value = result.snapshotId
    snapshots.value = [
      { id: result.snapshotId, watermark: result.watermark, status: 'committed' },
      ...snapshots.value.filter(item => item.id !== result.snapshotId),
    ]
    applied.value = true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : syncText('failed')
  } finally {
    operation.value = null
    ready.value = false
  }
}

async function exportFile(kind: 'summary' | 'snapshot') {
  if (busy.value || (kind === 'summary' ? !plan.value : !snapshotId.value)) return
  operation.value = 'export'
  error.value = ''
  try {
    await request<boolean>(
      kind === 'summary'
        ? { action: 'export-summary', planId: plan.value!.id }
        : { action: 'export-rollback', snapshotId: snapshotId.value },
    )
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : syncText('failed')
  } finally {
    operation.value = null
  }
}

async function close() {
  if (busy.value) return
  visible.value = false
  if (plan.value && ready.value)
    await window.electron.triggerRPC(IRPCActionType.CONFIGURE_SYNC_GALLERY_DB, {
      action: 'cancel',
      planId: plan.value.id,
    })
  plan.value = undefined
  ready.value = false
}
</script>
