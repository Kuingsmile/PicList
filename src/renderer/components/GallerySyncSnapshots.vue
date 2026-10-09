<template>
  <CustomNavCard
    :icon="History"
    :title="syncText('manageSnapshots')"
    :description="syncText('manageSnapshotsDescription')"
    :disabled="busy"
    @click="open"
  />
  <CustomModal
    :visible
    max-width="800px"
    :title="syncText('manageSnapshots')"
    :close-disabled="busy"
    @update:visible="visible = $event"
  >
    <div class="space-y-5 p-5 text-main max-md:p-0" :aria-busy="busy">
      <p v-if="error" role="alert" class="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
        {{ error }}
      </p>
      <div class="flex flex-wrap items-end gap-3">
        <CustomInput
          v-model.number="retentionLimit"
          class="min-w-0 flex-1"
          type="number"
          :min="1"
          :max="MAX_GALLERY_SNAPSHOT_LIMIT"
          :step="1"
          :title="syncText('snapshotRetention')"
          :placeholder="String(DEFAULT_GALLERY_SNAPSHOT_LIMIT)"
          :disabled="busy || !loaded"
        />
        <CustomButton
          :text="t('common.save')"
          :disabled="busy || !loaded || !validLimit || retentionLimit === savedLimit"
          @click="saveRetention"
        />
      </div>
      <p class="text-sm text-secondary">
        {{ syncText('snapshotRetentionDescription', { max: MAX_GALLERY_SNAPSHOT_LIMIT }) }}
      </p>
      <p class="text-sm font-semibold" role="status">
        {{ syncText('snapshotStorage', { count: snapshots.length, size: formatSize(totalBytes) }) }}
      </p>
      <p v-if="!loaded && busy" class="text-sm text-secondary">{{ syncText('snapshotLoading') }}</p>
      <p v-else-if="!snapshots.length" class="py-6 text-center text-sm text-secondary">
        {{ syncText('noSnapshots') }}
      </p>
      <ul v-else class="space-y-3">
        <li
          v-for="snapshot in snapshots"
          :key="snapshot.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-secondary p-3"
        >
          <div class="min-w-0 space-y-1">
            <p class="text-sm font-semibold">{{ formatDate(snapshot.watermark) }}</p>
            <p class="text-xs text-secondary">{{ syncText(snapshot.status) }} · {{ formatSize(snapshot.sizeBytes) }}</p>
            <p v-if="!snapshot.deletable" class="text-xs text-warning">{{ syncText('snapshotProtected') }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <CustomButton
              type="secondary"
              :icon="Download"
              :text="syncText('exportSnapshot')"
              :disabled="busy"
              @click="exportSnapshot(snapshot)"
            />
            <CustomButton
              type="danger"
              :icon="Trash2"
              :text="syncText('deleteSnapshot')"
              :aria-label="syncText('deleteSnapshotAt', { date: formatDate(snapshot.watermark) })"
              :disabled="busy || !snapshot.deletable"
              @click="deleteSnapshot(snapshot)"
            />
          </div>
        </li>
      </ul>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.close')" :disabled="busy" @click="visible = false" />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { Download, History, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomNavCard from '@/components/common/CustomNavCard.vue'
import useConfirm from '@/composables/useConfirm'
import useMessage from '@/composables/useMessage'
import { IRPCActionType } from '#/constants/rpcActions'
import {
  DEFAULT_GALLERY_SNAPSHOT_LIMIT,
  type GallerySyncRequest,
  type GallerySyncSnapshotDetails,
  type GallerySyncSnapshotSettings,
  MAX_GALLERY_SNAPSHOT_LIMIT,
} from '#/types/gallerySync'

const { t, locale } = useI18n()
const { confirm } = useConfirm()
const message = useMessage()
const syncText = (key: string, params: Record<string, string | number> = {}) =>
  t(`pages.settings.sync.galleryPlan.${key}`, params)
const visible = ref(false)
const busy = ref(false)
const loaded = ref(false)
const error = ref('')
const retentionLimit = ref<number | string>(DEFAULT_GALLERY_SNAPSHOT_LIMIT)
const savedLimit = ref(DEFAULT_GALLERY_SNAPSHOT_LIMIT)
const snapshots = ref<GallerySyncSnapshotDetails[]>([])
const validLimit = computed(
  () =>
    typeof retentionLimit.value === 'number' &&
    Number.isSafeInteger(retentionLimit.value) &&
    retentionLimit.value >= 1 &&
    retentionLimit.value <= MAX_GALLERY_SNAPSHOT_LIMIT,
)
const totalBytes = computed(() => snapshots.value.reduce((sum, snapshot) => sum + snapshot.sizeBytes, 0))

function formatDate(value: number) {
  return new Date(value).toLocaleString(locale.value)
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MiB` : `${(bytes / 1024).toFixed(1)} KiB`
}

async function request<T>(request: GallerySyncRequest): Promise<T> {
  const response = await window.electron.triggerRPC<T | { error: string }>(
    IRPCActionType.CONFIGURE_SYNC_GALLERY_DB,
    request,
  )
  if (response && typeof response === 'object' && 'error' in response) throw new Error(response.error)
  if (response === undefined || response === null) throw new Error(syncText('failed'))
  return response as T
}

function updateSettings(settings: GallerySyncSnapshotSettings) {
  savedLimit.value = settings.retentionLimit
  retentionLimit.value = settings.retentionLimit
  snapshots.value = settings.snapshots
  loaded.value = true
}

async function run(operation: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await operation()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : syncText('failed')
  } finally {
    busy.value = false
  }
}

async function open() {
  visible.value = true
  loaded.value = false
  await run(async () => updateSettings(await request<GallerySyncSnapshotSettings>({ action: 'snapshot-settings' })))
}

async function saveRetention() {
  if (!validLimit.value || !loaded.value) return
  const limit = Number(retentionLimit.value)
  await run(async () => {
    const count = Math.max(0, snapshots.value.filter(snapshot => snapshot.deletable).length - limit)
    if (
      count &&
      !(await confirm({
        title: syncText('snapshotRetention'),
        message: syncText('snapshotRetentionConfirm', { count }),
        type: 'warning',
        confirmButtonText: t('common.save'),
        cancelButtonText: t('common.cancel'),
      }))
    )
      return
    updateSettings(await request<GallerySyncSnapshotSettings>({ action: 'set-snapshot-retention', limit }))
    message.success(syncText('snapshotRetentionSaved'))
  })
}

async function exportSnapshot(snapshot: GallerySyncSnapshotDetails) {
  await run(async () => {
    await request<boolean>({ action: 'export-rollback', snapshotId: snapshot.id })
  })
}

async function deleteSnapshot(snapshot: GallerySyncSnapshotDetails) {
  if (!snapshot.deletable) return
  await run(async () => {
    if (
      !(await confirm({
        title: syncText('deleteSnapshot'),
        message: syncText('deleteSnapshotConfirm', { date: formatDate(snapshot.watermark) }),
        type: 'warning',
        confirmButtonText: syncText('deleteSnapshot'),
        cancelButtonText: t('common.cancel'),
      }))
    )
      return
    updateSettings(await request<GallerySyncSnapshotSettings>({ action: 'delete-snapshot', snapshotId: snapshot.id }))
    message.success(syncText('snapshotDeleted'))
  })
}
</script>
