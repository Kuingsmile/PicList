<template>
  <CustomModal
    v-model:visible="isShowBatchRenameDialog"
    width="720px"
    height="auto"
    max-height="88vh"
    :title="isSingleRename ? t('pages.manage.bucket.renameFile') : t('pages.manage.bucket.batchRename')"
    :description="scopeText"
  >
    <div class="flex flex-col gap-4 p-5">
      <div class="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <CustomInput
          v-model="batchRenameMatch"
          :title="t('pages.manage.bucket.rename.find')"
          :tips="t('pages.manage.bucket.regexPatternTips')"
          :placeholder="t('pages.manage.bucket.regexPlaceholder')"
          spellcheck="false"
        />
        <CustomInput
          v-model="batchRenameReplace"
          :title="t('pages.manage.bucket.rename.replace')"
          :tips="t('pages.manage.bucket.rename.replaceTips', { auto: '{auto}' })"
          placeholder="{Y}-{m}-{uuid}"
          spellcheck="false"
        >
          <template #title-extra>
            <button
              type="button"
              class="cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring"
              :aria-expanded="showFormatInfo"
              @click="showFormatInfo = !showFormatInfo"
            >
              {{ t('pages.manage.bucket.rename.placeholders') }}
            </button>
          </template>
        </CustomInput>
      </div>

      <CustomSwitch
        v-if="!isSingleRename"
        v-model="isRenameIncludeExt"
        small
        tighter
        no-border
        no-hover
        :title="t('pages.manage.bucket.includeExt')"
      />

      <PlaceholderTable v-if="showFormatInfo" :list="advancedRenameList" :title-list="advancedRenameTitleList" />

      <!-- Live preview -->
      <section class="flex flex-col overflow-hidden rounded-xl border border-border-secondary bg-bg-secondary">
        <div class="flex items-center gap-2 border-b border-border-secondary px-3 py-2">
          <span class="text-sm font-semibold text-main">{{ t('pages.manage.bucket.rename.preview') }}</span>
          <span
            class="rounded-full px-2 text-[11px] leading-[20px] font-semibold tabular-nums"
            :class="previewRows.length ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-secondary'"
          >
            {{ t('pages.manage.bucket.rename.matched', { num: renameTargets.length }) }}
          </span>
        </div>
        <p v-if="!isValidPattern" class="m-0 px-3 py-6 text-center text-sm text-danger" role="status">
          {{ t('common.bulk.invalidPattern') }}
        </p>
        <p v-else-if="!previewRows.length" class="m-0 px-3 py-6 text-center text-sm text-secondary" role="status">
          {{ batchRenameMatch ? t('pages.manage.bucket.noMatchedFile') : t('pages.manage.bucket.rename.emptyHint') }}
        </p>
        <ul v-else class="m-0 max-h-[220px] list-none overflow-auto p-1">
          <li
            v-for="row in previewRows"
            :key="row.key"
            class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-md px-2 py-1.5 font-mono text-xs hover:bg-accent/5"
          >
            <span class="truncate text-secondary" :title="row.from">{{ row.from }}</span>
            <ArrowRightIcon :size="13" class="text-tertiary" aria-hidden="true" />
            <span class="truncate" :class="row.changed ? 'font-semibold text-main' : 'text-tertiary'" :title="row.to">
              {{ row.to }}
            </span>
          </li>
          <li v-if="renameTargets.length > previewRows.length" class="px-2 py-1.5 text-xs text-tertiary">
            {{ t('pages.manage.bucket.rename.more', { num: renameTargets.length - previewRows.length }) }}
          </li>
        </ul>
        <p class="m-0 border-t border-border-secondary px-3 py-2 text-xs text-tertiary">
          {{ t('pages.manage.bucket.rename.sampleNote') }}
        </p>
      </section>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="isShowBatchRenameDialog = false" />
      <CustomButton
        :icon="ListChecksIcon"
        :text="t('common.bulk.preview')"
        :loading="bulkChanges.building.value"
        :disabled="!renameTargets.length"
        @click="BatchRename"
      />
    </template>
  </CustomModal>
  <BulkChangePreview :workflow="bulkChanges" />
</template>

<script setup lang="ts">
import { ArrowRightIcon, ListChecksIcon } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BulkChangePreview from '@/components/BulkChangePreview.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import { useBulkChanges } from '@/composables/useBulkChanges'
import useMessage from '@/composables/useMessage'
import { fileCacheDbInstance } from '@/manage/services/bucketDatabase'
import type { BucketFile } from '@/manage/types/bucket'
import { matchFileName, replaceFileName, splitFileName } from '@/manage/utils/fileName'
import { IRPCActionType } from '#/constants/rpcActions'

const PREVIEW_LIMIT = 50

const { configMap, provider, selectedItems, currentPageFilesInfo } = defineProps<{
  configMap: Record<string, any>
  provider: string
  selectedItems: BucketFile[]
  currentPageFilesInfo: BucketFile[]
}>()
const emit = defineEmits<{ renamed: [] }>()
const { t } = useI18n()
const message = useMessage()
let disposed = false
const isShowBatchRenameDialog = ref(false)

const bulkChanges = useBulkChanges(async snapshot => {
  if (!snapshot.outcomes.some(item => item.attempts > 0)) return
  const context = snapshot.plan.items[0].context
  await fileCacheDbInstance
    .table(context.provider)
    .where('key')
    .startsWith(context.accountId + '@' + context.bucketName + '@')
    .delete()
  if (!disposed && configMap.alias === context.accountId && configMap.bucketName === context.bucketName) {
    emit('renamed')
  }
})

const batchRenameMatch = ref('')

const batchRenameReplace = ref('')

const isRenameIncludeExt = ref(false)

const isSingleRename = ref(false)

const itemToBeRenamed = ref({} as any)

const showFormatInfo = ref(false)

const advancedRenameList = computed(() => ({
  categoryTime: [
    { label: t('pages.settings.upload.placeholder.year4'), value: '{Y}' },
    { label: t('pages.settings.upload.placeholder.year2'), value: '{y}' },
    { label: t('pages.settings.upload.placeholder.month'), value: '{m}' },
    { label: t('pages.settings.upload.placeholder.date'), value: '{d}' },
    { label: t('pages.settings.upload.placeholder.hour'), value: '{h}' },
    { label: t('pages.settings.upload.placeholder.minute'), value: '{i}' },
    { label: t('pages.settings.upload.placeholder.second'), value: '{s}' },
    { label: t('pages.settings.upload.placeholder.millisecond'), value: '{ms}' },
    { label: t('pages.settings.upload.placeholder.timestamp'), value: '{timestamp}' },
    { label: t('pages.settings.upload.placeholder.timestampS'), value: '{timestampS}' },
  ],
  categoryHash: [
    { label: t('pages.settings.upload.placeholder.md5'), value: '{md5}' },
    { label: t('pages.settings.upload.placeholder.md5-16'), value: '{md5-16}' },
    { label: t('pages.settings.upload.placeholder.uuid'), value: '{uuid}' },
    { label: t('pages.settings.upload.placeholder.ulid'), value: '{ulid}' },
    { label: t('pages.settings.upload.placeholder.sha1'), value: '{sha1}' },
    { label: t('pages.settings.upload.placeholder.sha1-n'), value: '{sha1-n}' },
    { label: t('pages.settings.upload.placeholder.sha256'), value: '{sha256}' },
    { label: t('pages.settings.upload.placeholder.sha256-n'), value: '{sha256-n}' },
  ],
  categoryFile: [
    { label: t('pages.settings.upload.placeholder.filename'), value: '{filename}' },
    { label: t('pages.settings.upload.placeholder.randomString'), value: '{str-number}' },
  ],
}))

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

function handleBatchRenameFile() {
  if (bulkChanges.reopen() || bulkChanges.building.value) return
  batchRenameMatch.value = ''
  isSingleRename.value = false
  showFormatInfo.value = false
  isShowBatchRenameDialog.value = true
}

const renamePool = computed(() =>
  (selectedItems.length ? selectedItems : currentPageFilesInfo).filter(item => !item.isDir),
)

const scopeText = computed(() => {
  if (isSingleRename.value) return itemToBeRenamed.value?.fileName ?? ''
  return selectedItems.length
    ? t('pages.manage.bucket.rename.scopeSelected', { num: renamePool.value.length })
    : t('pages.manage.bucket.rename.scopeAll', { num: renamePool.value.length })
})

const isValidPattern = computed(() => {
  try {
    new RegExp(batchRenameMatch.value || '.+', 'ug')
    return true
  } catch {
    return false
  }
})

const matchedFilesNumber = computed(() => {
  if (!batchRenameMatch.value || !isValidPattern.value) {
    return [] as any[]
  }
  return renamePool.value.filter((item: any) =>
    matchFileName(item.fileName, batchRenameMatch.value, isRenameIncludeExt.value),
  )
})

const renameTargets = computed(() => {
  if (!isValidPattern.value) return [] as any[]
  return isSingleRename.value ? [itemToBeRenamed.value] : matchedFilesNumber.value
})

const previewRows = computed(() => {
  const pattern = batchRenameMatch.value || (isSingleRename.value ? '.+' : '')
  if (!pattern) return []
  return renameTargets.value.slice(0, PREVIEW_LIMIT).map((item, index) => {
    const to = renameTo(item.fileName, pattern, index)
    return { key: item.key, from: item.fileName, to, changed: to !== item.fileName }
  })
})

function renameTo(fileName: string, pattern: string, index: number) {
  return replaceFileName(fileName, pattern, batchRenameReplace.value, isRenameIncludeExt.value).replaceAll(
    '{auto}',
    String(index + 1),
  )
}

async function BatchRename() {
  if (bulkChanges.building.value) return
  const pattern = batchRenameMatch.value || (isSingleRename.value ? '.+' : '')
  if (!pattern) {
    message.error(t('pages.manage.bucket.inputPatternMsg'))
    return
  }
  try {
    new RegExp(pattern, 'ug')
  } catch {
    message.error(t('common.bulk.invalidPattern'))
    return
  }
  const matched = isSingleRename.value ? [itemToBeRenamed.value] : matchedFilesNumber.value
  if (!matched.length) {
    message.error(t('pages.manage.bucket.noMatchedFile'))
    return
  }
  // Expand random/time/sequence placeholders once; the reviewed targets never change on retry.
  const items = matched.map((item, index) => {
    const name = renameTo(item.fileName, pattern, index)
    return { id: item.key, source: item.key, target: item.key.slice(0, item.key.lastIndexOf('/') + 1) + name }
  })
  const context = {
    accountId: configMap.alias,
    provider,
    bucketName: configMap.bucketName || '',
    region: configMap.bucketConfig?.Location || '',
  }
  if (await bulkChanges.preview(IRPCActionType.BULK_PREVIEW_REMOTE_RENAME, context, items)) {
    isShowBatchRenameDialog.value = false
  } else {
    message.error(bulkChanges.error.value)
  }
}

function handleRenameFile(item: any) {
  if (bulkChanges.reopen() || bulkChanges.building.value) return
  batchRenameMatch.value = splitFileName(item.fileName).baseName
  isSingleRename.value = true
  isRenameIncludeExt.value = false
  showFormatInfo.value = false
  itemToBeRenamed.value = item
  isShowBatchRenameDialog.value = true
}
onBeforeUnmount(() => {
  disposed = true
})
defineExpose({ openBatch: handleBatchRenameFile, openFile: handleRenameFile })
</script>
