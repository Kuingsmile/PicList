<template>
  <CustomButton
    type="secondary"
    :text="t('pages.settings.sync.galleryPlan.preview')"
    :disabled="busy"
    @click="preview"
  />
  <CustomModal
    v-if="visible"
    :visible="visible"
    :title="t('pages.settings.sync.galleryPlan.title')"
    max-width="1000px"
    @update:visible="close"
  >
    <div class="space-y-4 p-5 text-main" aria-live="polite">
      <p>{{ t('pages.settings.sync.galleryPlan.description') }}</p>
      <p v-if="plan?.migration" class="rounded-md border border-border p-3">
        {{ t('pages.settings.sync.galleryPlan.migration') }}
      </p>
      <p v-if="busy" role="status">{{ t('pages.settings.sync.galleryPlan.working') }}</p>
      <p v-if="error" role="alert" class="text-danger">{{ error }}</p>
      <p v-if="applied" role="status">{{ t('pages.settings.sync.galleryPlan.success') }}</p>
      <template v-if="plan">
        <div class="flex flex-wrap gap-4">
          <span v-for="(count, kind) in plan.counts" :key="kind">{{ t(kind) }}: {{ count }}</span>
        </div>
        <p v-if="!plan.changes.length">{{ t('pages.settings.sync.galleryPlan.noChanges') }}</p>
        <p v-if="plan.counts.conflict">{{ t('pages.settings.sync.galleryPlan.resolutions') }}</p>
        <article
          v-for="(change, index) in plan.changes"
          :key="change.key"
          class="space-y-3 rounded-md border border-border p-3"
        >
          <h4 class="font-semibold">{{ index + 1 }}. {{ t(change.kind) }}</h4>
          <div class="grid gap-3 md:grid-cols-2">
            <div
              v-for="version in change.versions"
              :key="version.source"
              class="rounded-md bg-bg-secondary p-3 wrap-break-word"
            >
              <p class="font-semibold">
                {{ t(version.source) }} —
                {{
                  version.deleted
                    ? t('pages.settings.sync.galleryPlan.deleted')
                    : version.name || t('pages.settings.sync.galleryPlan.record')
                }}
              </p>
              <dl v-if="!version.deleted" class="text-sm">
                <template v-for="(value, field) in version.details" :key="field">
                  <dt class="mt-1 font-semibold">{{ field }}</dt>
                  <dd>{{ value }}</dd>
                </template>
              </dl>
            </div>
          </div>
          <template v-if="change.kind === 'conflict'">
            <p v-if="change.legacySuggestion" class="text-sm">
              {{ t('pages.settings.sync.galleryPlan.legacy') }} {{ t(change.legacySuggestion) }}
            </p>
            <label :for="`resolution-${change.key}`">{{ t('pages.settings.sync.galleryPlan.choose') }}</label>
            <select
              :id="`resolution-${change.key}`"
              v-model="resolutions[change.key]"
              :disabled="busy || !ready"
              class="w-full rounded-md border border-border bg-bg-tertiary p-3"
            >
              <option disabled value="">{{ t('pages.settings.sync.galleryPlan.choose') }}</option>
              <option
                v-for="choice in choices"
                :key="choice"
                :value="choice"
                :disabled="
                  choice !== 'preserve-both' &&
                  !change.versions.some(version =>
                    version.source.startsWith(choice === 'keep-local' ? 'local' : 'remote'),
                  )
                "
              >
                {{ t(choice) }}
              </option>
            </select>
          </template>
        </article>
      </template>
      <template v-if="snapshots.length || snapshotId">
        <label for="gallery-rollback-snapshot">{{ t('pages.settings.sync.galleryPlan.savedSnapshots') }}</label>
        <select
          id="gallery-rollback-snapshot"
          v-model="snapshotId"
          :disabled="busy"
          class="w-full rounded-md border border-border bg-bg-tertiary p-3"
        >
          <option v-if="snapshotId && !snapshots.some(item => item.id === snapshotId)" :value="snapshotId">
            {{ t('pages.settings.sync.galleryPlan.latestSnapshot') }}
          </option>
          <option v-for="item in snapshots" :key="item.id" :value="item.id">
            {{ new Date(item.watermark).toLocaleString() }} — {{ t(item.status) }}
          </option>
        </select>
        <p class="text-sm">{{ t('pages.settings.sync.galleryPlan.snapshot') }}</p>
      </template>
    </div>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <CustomButton
          type="secondary"
          :text="t('pages.settings.sync.galleryPlan.close')"
          :disabled="busy"
          @click="close"
        />
        <CustomButton
          v-if="plan"
          type="secondary"
          :text="t('pages.settings.sync.galleryPlan.exportSummary')"
          :disabled="busy"
          @click="exportFile('summary')"
        />
        <CustomButton
          v-if="snapshotId"
          type="secondary"
          :text="t('pages.settings.sync.galleryPlan.exportSnapshot')"
          :disabled="busy"
          @click="exportFile('snapshot')"
        />
        <CustomButton
          type="secondary"
          :text="t('pages.settings.sync.galleryPlan.preview')"
          :disabled="busy"
          @click="preview"
        />
        <CustomButton :text="t('pages.settings.sync.galleryPlan.apply')" :disabled="!canApply" @click="apply" />
      </div>
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import { IRPCActionType } from '@/utils/enum'
import type {
  GallerySyncPlan,
  GallerySyncRequest,
  GallerySyncResolution,
  GallerySyncResult,
  GallerySyncSnapshot,
} from '#/types/gallerySync'

const { t } = useI18n()
const visible = ref(false)
const busy = ref(false)
const ready = ref(false)
const applied = ref(false)
const error = ref('')
const plan = ref<GallerySyncPlan>()
const snapshotId = ref('')
const snapshots = ref<GallerySyncSnapshot[]>([])
const resolutions = ref<Record<string, GallerySyncResolution | ''>>({})
const choices: GallerySyncResolution[] = ['keep-local', 'keep-remote', 'preserve-both']
const canApply = computed(
  () =>
    ready.value &&
    !busy.value &&
    !!plan.value &&
    plan.value.changes.every(change => change.kind !== 'conflict' || !!resolutions.value[change.key]),
)

async function request<T>(request: GallerySyncRequest): Promise<T> {
  const response = await window.electron.triggerRPC<T | { error: string; snapshotId?: string }>(
    IRPCActionType.CONFIGURE_SYNC_GALLERY_DB,
    request,
  )
  if (response && typeof response === 'object' && 'error' in response) {
    if (response.snapshotId) snapshotId.value = response.snapshotId
    throw new Error(response.error)
  }
  if (response === undefined || response === null) throw new Error(t('pages.settings.sync.galleryPlan.failed'))
  return response as T
}

async function preview() {
  if (busy.value) return
  visible.value = true
  busy.value = true
  ready.value = false
  error.value = ''
  applied.value = false
  try {
    snapshots.value = await request<GallerySyncSnapshot[]>({ action: 'list-snapshots' })
    if (!snapshotId.value && snapshots.value.length) snapshotId.value = snapshots.value[0].id
    if (plan.value)
      await window.electron.triggerRPC(IRPCActionType.CONFIGURE_SYNC_GALLERY_DB, {
        action: 'cancel',
        planId: plan.value.id,
      })
    plan.value = undefined
    plan.value = await request<GallerySyncPlan>({ action: 'preview' })
    resolutions.value = Object.fromEntries(
      plan.value.changes.filter(item => item.kind === 'conflict').map(item => [item.key, '']),
    )
    ready.value = true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('pages.settings.sync.galleryPlan.failed')
  } finally {
    busy.value = false
  }
}

async function apply() {
  if (!canApply.value || !plan.value) return
  busy.value = true
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
    snapshots.value.unshift({ id: result.snapshotId, watermark: result.watermark, status: 'committed' })
    applied.value = true
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('pages.settings.sync.galleryPlan.failed')
  } finally {
    busy.value = false
    ready.value = false
  }
}

async function exportFile(kind: 'summary' | 'snapshot') {
  busy.value = true
  try {
    await request<boolean>(
      kind === 'summary'
        ? { action: 'export-summary', planId: plan.value!.id }
        : { action: 'export-rollback', snapshotId: snapshotId.value },
    )
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('pages.settings.sync.galleryPlan.failed')
  } finally {
    busy.value = false
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
