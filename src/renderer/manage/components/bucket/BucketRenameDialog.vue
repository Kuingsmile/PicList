<template>
  <CustomModal
    v-model:visible="isShowBatchRenameDialog"
    width="700px"
    height="auto"
    :title="t('pages.manage.bucket.renameFile')"
  >
    <div class="p-6">
      <p class="mb-4 text-sm text-secondary">{{ t('common.bulk.selectionHint') }}</p>
      <div class="mb-6 last:mb-0">
        <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
          {{ t('pages.manage.bucket.matchedPattern', { num: matchedFilesNumber.length }) }}
          <div class="group relative inline-block">
            <InfoIcon class="h-[16px] w-[16px]" />
            <span
              class="invisible absolute top-[125%] left-1/2 z-1000 w-max max-w-[200px] translate-x-[-50%] rounded-md border border-border bg-bg-tertiary p-2 text-center text-xs text-main opacity-0 shadow-md transition-opacity duration-300 group-hover:visible group-hover:opacity-100"
              >{{ t('pages.manage.bucket.regexPatternTips') }}</span
            >
          </div>
        </label>
        <input
          v-model="batchRenameMatch"
          type="text"
          class="w-full rounded-md border border-border bg-bg-tertiary p-3 text-sm text-main focus:border-accent focus:bg-white focus:outline-none"
          :placeholder="t('pages.manage.bucket.regexPlaceholder')"
          @focus="showMatchedUrls = true"
          @blur="showMatchedUrls = false"
        />
        <div
          v-if="showMatchedUrls && matchedFilesNumber.length > 0"
          class="absolute z-1000 mt-2 max-h-[300px] max-w-[650px] overflow-hidden rounded-md border border-border-secondary bg-bg-tertiary p-0 shadow-md"
        >
          <div class="border-b border-b-border-secondary bg-bg-secondary px-4 py-3 text-sm font-semibold text-main">
            Matched ({{ matchedFilesNumber.length }}):
          </div>
          <div class="max-h-[240px] overflow-auto p-2">
            <div
              v-for="(item, index) in matchedFilesNumber"
              :key="index"
              class="rounded-sm px-3 py-2 font-['SF_Mono',Monaco,'Cascadia_Code','Roboto_Mono',Consolas,'Courier_New',monospace] text-sm break-all text-secondary transition-all duration-fast ease-apple hover:bg-surface-elevated"
            >
              {{ item?.fileName || item?.key || item }}
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6 last:mb-0">
        <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
          {{ t('pages.manage.bucket.replaceInput') }}
          <button
            class="flex h-[20px] w-[20px] cursor-pointer items-center justify-around rounded-full border-none bg-accent text-white transition-all duration-fast ease-apple hover:bg-accent-hover"
            @click="showFormatInfo = !showFormatInfo"
          >
            <InfoIcon :size="16" />
          </button>
        </label>
        <input
          v-model="batchRenameReplace"
          type="text"
          class="w-full rounded-md border border-border bg-bg-tertiary p-3 text-sm text-main focus:border-accent focus:bg-white focus:outline-none"
          placeholder="Ex. {Y}-{m}-{uuid}"
        />
      </div>

      <div class="mb-6 last:mb-0">
        <CustomSwitch
          v-model="isRenameIncludeExt"
          small
          no-border
          :title="isRenameIncludeExt ? t('pages.manage.bucket.includeExt') : t('pages.manage.bucket.excludeExt')"
        />
      </div>
      <div v-if="showFormatInfo" class="mb-6 last:mb-0">
        <label>{{ t('pages.settings.upload.availablePlaceholders') }}</label>
        <PlaceholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
      </div>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="isShowBatchRenameDialog = false" />
      <CustomButton :text="t('common.bulk.preview')" :disabled="bulkChanges.building.value" @click="BatchRename" />
    </template>
  </CustomModal>
  <BulkChangePreview :workflow="bulkChanges" />
</template>

<script setup lang="ts">
import { InfoIcon } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BulkChangePreview from '@/components/BulkChangePreview.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import { useBulkChanges } from '@/composables/useBulkChanges'
import useMessage from '@/composables/useMessage'
import { fileCacheDbInstance } from '@/manage/services/bucketDatabase'
import type { BucketFile } from '@/manage/types/bucket'
import { matchFileName, replaceFileName, splitFileName } from '@/manage/utils/fileName'
import { IRPCActionType } from '#/constants/rpcActions'

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

const showMatchedUrls = ref(false)

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
  isShowBatchRenameDialog.value = true
}

const matchedFilesNumber = computed(() => {
  if (!batchRenameMatch.value) {
    return [] as any[]
  }
  return (selectedItems.length ? selectedItems : currentPageFilesInfo).filter(
    (item: any) => !item.isDir && matchFileName(item.fileName, batchRenameMatch.value, isRenameIncludeExt.value),
  )
})

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
    const name = replaceFileName(item.fileName, pattern, batchRenameReplace.value, isRenameIncludeExt.value).replaceAll(
      '{auto}',
      String(index + 1),
    )
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
  isShowBatchRenameDialog.value = true
  itemToBeRenamed.value = item
}
onBeforeUnmount(() => {
  disposed = true
})
defineExpose({ openBatch: handleBatchRenameFile, openFile: handleRenameFile })
</script>
