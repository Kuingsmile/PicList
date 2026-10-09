<template>
  <CustomModal v-model:visible="dialogVisible" height="auto" width="40%" :title="t('pages.gallery.changeImageUrl')">
    <div class="p-2">
      <input
        v-model="imgInfo.imgUrl"
        type="text"
        class="box-border w-full rounded-md border border-border bg-bg-secondary p-3 text-sm text-main transition-all duration-fast ease-apple focus:border-accent focus:shadow-md focus:outline-none"
        :aria-label="t('pages.gallery.changeImageUrl')"
      />
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="dialogVisible = false" />
      <CustomButton :text="t('common.confirm')" @click="confirmModify" />
    </template>
  </CustomModal>

  <CustomModal
    v-model:visible="isShowBatchRenameDialog"
    width="720px"
    height="auto"
    max-height="88vh"
    :title="t('pages.gallery.batchEditUrl')"
    :description="scopeText"
  >
    <div class="flex flex-col gap-4 p-5">
      <div class="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <CustomInput
          v-model="batchRenameMatch"
          :title="t('pages.gallery.urlEditor.find')"
          :tips="t('pages.gallery.urlEditor.findTips')"
          :placeholder="t('pages.gallery.urlEditor.findPlaceholder')"
          spellcheck="false"
          @keydown.enter="submitOnEnter"
        />
        <CustomInput
          v-model="batchRenameReplace"
          :title="t('pages.gallery.urlEditor.replace')"
          :tips="t('pages.gallery.urlEditor.replaceTips', { auto: '{auto}' })"
          placeholder="https://cdn.example.com/"
          spellcheck="false"
          @keydown.enter="submitOnEnter"
        >
          <template #title-extra>
            <button
              type="button"
              class="cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring"
              :aria-expanded="showFormatInfo"
              @click="showFormatInfo = !showFormatInfo"
            >
              {{ t('pages.gallery.urlEditor.placeholders') }}
            </button>
          </template>
        </CustomInput>
      </div>

      <PlaceholderTable v-if="showFormatInfo" :list="advancedRenameList" :title-list="advancedRenameTitleList" />

      <!-- Live preview -->
      <section class="flex flex-col overflow-hidden rounded-xl border border-border-secondary bg-bg-secondary">
        <div class="flex items-center gap-2 border-b border-border-secondary px-3 py-2">
          <span class="text-sm font-semibold text-main">{{ t('pages.gallery.urlEditor.preview') }}</span>
          <span
            class="rounded-full px-2 text-[11px] leading-[20px] font-semibold tabular-nums"
            :class="previewRows.length ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-secondary'"
          >
            {{ t('pages.gallery.urlEditor.matched', { num: matchedItems.length }) }}
          </span>
        </div>
        <p v-if="!isValidPattern" class="m-0 px-3 py-6 text-center text-sm text-danger" role="status">
          {{ t('common.bulk.invalidPattern') }}
        </p>
        <p v-else-if="!previewRows.length" class="m-0 px-3 py-6 text-center text-sm text-secondary" role="status">
          {{ batchRenameMatch ? t('pages.gallery.urlEditor.noMatch') : t('pages.gallery.urlEditor.emptyHint') }}
        </p>
        <ul v-else class="m-0 max-h-[260px] list-none divide-y divide-border-secondary overflow-auto px-1">
          <li
            v-for="row in previewRows"
            :key="row.id"
            class="flex flex-col gap-1 px-2 py-2 font-mono text-xs leading-relaxed break-all hover:bg-accent/5"
          >
            <span class="flex gap-1.5">
              <span class="w-[13px] shrink-0" aria-hidden="true"></span>
              <span class="min-w-0 text-secondary">
                <span>{{ row.prefix }}</span>
                <del v-if="row.removed" class="rounded-xs bg-danger/15 text-main decoration-danger/70">{{
                  row.removed
                }}</del>
                <span>{{ row.suffix }}</span>
              </span>
            </span>
            <span class="flex gap-1.5">
              <CornerDownRightIcon :size="13" class="mt-0.5 shrink-0 text-tertiary" aria-hidden="true" />
              <span v-if="!row.changed" class="text-tertiary italic">{{ t('common.bulk.issue.unchanged') }}</span>
              <span v-else class="min-w-0 text-main">
                <span>{{ row.prefix }}</span>
                <ins v-if="row.added" class="rounded-xs bg-success/20 font-semibold no-underline">{{ row.added }}</ins>
                <span>{{ row.suffix }}</span>
              </span>
            </span>
          </li>
          <li v-if="matchedItems.length > previewRows.length" class="px-2 py-1.5 text-xs text-tertiary">
            {{ t('pages.gallery.urlEditor.more', { num: matchedItems.length - previewRows.length }) }}
          </li>
        </ul>
        <p class="m-0 border-t border-border-secondary px-3 py-2 text-xs text-tertiary">
          {{ t('pages.gallery.urlEditor.sampleNote') }}
        </p>
      </section>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="isShowBatchRenameDialog = false" />
      <CustomButton
        :icon="ListChecksIcon"
        :text="t('common.bulk.preview')"
        :loading="bulkChanges.building.value"
        :disabled="!matchedItems.length"
        @click="handleBatchRename"
      />
    </template>
  </CustomModal>

  <BulkChangePreview :workflow="bulkChanges" />
</template>

<script setup lang="ts">
import { CornerDownRightIcon, ListChecksIcon } from '@lucide/vue'
import { computed, nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BulkChangePreview from '@/components/BulkChangePreview.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import { useBulkChanges } from '@/composables/useBulkChanges'
import useMessage from '@/composables/useMessage'
import { customStrReplace } from '@/manage/utils/fileName'
import $$db from '@/services/galleryDatabase'
import { IRPCActionType } from '#/constants/rpcActions'
import { customStrMatch } from '#/utils/strings'

const PREVIEW_LIMIT = 50

const { filterList, choosedList, updateGallery } = defineProps<{
  filterList: IGalleryItem[]
  choosedList: IObjT<boolean>
  updateGallery: () => Promise<boolean>
}>()
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()
const message = useMessage()
const dialogVisible = ref(false)

const imgInfo = reactive({
  id: '',
  imgUrl: '',
})

const isShowBatchRenameDialog = ref(false)

const bulkChanges = useBulkChanges(async () => {
  if (!(await updateGallery())) throw new Error('Gallery refresh failed')
})

const batchRenameMatch = ref('')

const batchRenameReplace = ref('')

const showFormatInfo = ref(false)

const advancedRenameTitleList = computed(() => ({
  categoryTime: t('pages.settings.upload.placeholder.categoryTime'),
  categoryHash: t('pages.settings.upload.placeholder.categoryHash'),
  categoryFile: t('pages.settings.upload.placeholder.categoryFile'),
}))

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
    { label: t('pages.settings.upload.placeholder.randomString'), value: '{str-n}' },
  ],
}))

const bulkGalleryCandidates = computed(() => {
  const selected = filterList.filter(item => choosedList[item.id!])
  return selected.length ? selected : filterList
})

const scopeText = computed(() => {
  const num = bulkGalleryCandidates.value.length
  return num !== filterList.length
    ? t('pages.gallery.urlEditor.scopeSelected', { num })
    : t('pages.gallery.urlEditor.scopeAll', { num })
})

const isValidPattern = computed(() => {
  try {
    new RegExp(batchRenameMatch.value || '.+', 'ug')
    return true
  } catch {
    return false
  }
})

const matchedItems = computed(() => {
  if (!batchRenameMatch.value || !isValidPattern.value) return [] as IGalleryItem[]
  return bulkGalleryCandidates.value.filter(item => customStrMatch(item.imgUrl || '', batchRenameMatch.value))
})

const previewRows = computed(() =>
  matchedItems.value.slice(0, PREVIEW_LIMIT).map((item, index) => {
    const from = item.imgUrl!
    const to = replaceUrl(from, index)
    return { id: item.id!, changed: to !== from, ...diffUrl(from, to) }
  }),
)

function replaceUrl(url: string, index: number) {
  return customStrReplace(url, batchRenameMatch.value, batchRenameReplace.value).replaceAll('{auto}', String(index + 1))
}

// Split both URLs around their shared prefix and suffix so the preview highlights only the edited part.
function diffUrl(from: string, to: string) {
  let start = 0
  while (start < from.length && start < to.length && from[start] === to[start]) start++
  let end = 0
  while (
    end < from.length - start &&
    end < to.length - start &&
    from[from.length - 1 - end] === to[to.length - 1 - end]
  ) {
    end++
  }
  return {
    prefix: from.slice(0, start),
    removed: from.slice(start, from.length - end),
    added: to.slice(start, to.length - end),
    suffix: from.slice(from.length - end),
  }
}

function openDialog(item: ImgInfo) {
  imgInfo.id = item.id!
  imgInfo.imgUrl = item.imgUrl as string
  dialogVisible.value = true
}

async function confirmModify() {
  try {
    if (!(await $$db.updateById(imgInfo.id, { imgUrl: imgInfo.imgUrl }))) {
      message.error(t('pages.gallery.operationFailed'))
      return
    }
  } catch {
    message.error(t('pages.gallery.operationFailed'))
    return
  }
  message.success(t('pages.gallery.operationSucceed'))
  dialogVisible.value = false
  await updateGallery()
  nextTick(() => {
    emit('changed')
  })
}

function openBatchRename() {
  if (bulkChanges.reopen() || bulkChanges.building.value) return
  batchRenameMatch.value = ''
  showFormatInfo.value = false
  isShowBatchRenameDialog.value = true
}

function submitOnEnter(event: KeyboardEvent) {
  if (!event.isComposing) handleBatchRename()
}

async function handleBatchRename() {
  if (bulkChanges.building.value) return
  if (!batchRenameMatch.value) {
    message.warning(t('pages.gallery.urlEditor.findRequired'))
    return
  }
  if (!isValidPattern.value) {
    message.error(t('common.bulk.invalidPattern'))
    return
  }
  if (!matchedItems.value.length) {
    message.warning(t('pages.gallery.urlEditor.noMatch'))
    return
  }
  // Expand random/time/sequence placeholders once; the reviewed targets never change on retry.
  const items = matchedItems.value.map((item, index) => ({
    id: item.id!,
    source: item.imgUrl!,
    target: replaceUrl(item.imgUrl!, index),
  }))
  if (await bulkChanges.preview(IRPCActionType.BULK_PREVIEW_GALLERY_URL, items)) {
    isShowBatchRenameDialog.value = false
  } else {
    message.error(bulkChanges.error.value)
  }
}
defineExpose({ open: openDialog, openBatch: openBatchRename })
</script>
