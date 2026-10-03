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
    height="auto"
    width="700px"
    :title="t('pages.gallery.batchEditUrl')"
  >
    <div class="p-6">
      <p class="mb-4 text-sm text-secondary">{{ t('common.bulk.selectionHint') }}</p>
      <div class="mb-6 last:mb-0">
        <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
          {{ t('pages.gallery.regexPattern', { matched: matchedCount || 0 }) }}
        </label>
        <input
          v-model="batchRenameMatch"
          type="text"
          class="box-border w-full rounded-md border border-border bg-bg-secondary p-3 text-sm text-main transition-all duration-fast ease-apple focus:border-accent focus:shadow-md focus:outline-none"
          :placeholder="t('pages.gallery.regexPatternPlaceholder')"
          @focus="showMatchedUrls = true"
          @blur="showMatchedUrls = false"
        />
        <div
          v-if="showMatchedUrls && matchedUrls.length > 0"
          class="absolute z-1000 mt-2 max-h-[300px] max-w-[650px] overflow-hidden rounded-md border border-border-secondary bg-bg-tertiary p-0 shadow-md"
        >
          <div class="border-b border-b-border-secondary bg-bg-secondary px-4 py-3 text-sm font-semibold text-main">
            Matched URLs ({{ matchedUrls.length }}):
          </div>
          <div class="max-h-[240px] overflow-auto p-2">
            <div
              v-for="(url, index) in matchedUrls"
              :key="index"
              class="rounded-sm px-3 py-2 font-['SF_Mono',Monaco,'Cascadia_Code','Roboto_Mono',Consolas,'Courier_New',monospace] text-sm break-all text-secondary transition-all duration-fast ease-apple hover:bg-surface-elevated"
            >
              {{ url }}
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6 last:mb-0">
        <label class="mb-2 flex items-center gap-2 text-sm font-medium text-main">
          {{ t('pages.gallery.replacedWith') }}
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
          class="box-border w-full rounded-md border border-border bg-bg-secondary p-3 text-sm text-main transition-all duration-fast ease-apple focus:border-accent focus:shadow-md focus:outline-none"
          placeholder="Ex. {Y}-{m}-{uuid}"
        />
      </div>

      <!-- Format Info Panel -->
      <div v-if="showFormatInfo" class="mb-6 last:mb-0">
        <label>{{ t('pages.settings.upload.availablePlaceholders') }}</label>
        <PlaceholderTable :list="advancedRenameList" :title-list="advancedRenameTitleList" />
      </div>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.cancel')" @click="isShowBatchRenameDialog = false" />
      <CustomButton
        :text="t('common.bulk.preview')"
        :disabled="bulkChanges.building.value"
        @click="handleBatchRename"
      />
    </template>
  </CustomModal>

  <BulkChangePreview :workflow="bulkChanges" />
</template>

<script setup lang="ts">
import { InfoIcon } from '@lucide/vue'
import { computed, nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import BulkChangePreview from '@/components/BulkChangePreview.vue'
import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import PlaceholderTable from '@/components/common/PlaceholderTable.vue'
import { useBulkChanges } from '@/composables/useBulkChanges'
import useMessage from '@/composables/useMessage'
import { customStrReplace } from '@/manage/utils/fileName'
import $$db from '@/services/galleryDatabase'
import { IRPCActionType } from '#/constants/rpcActions'
import { customStrMatch } from '#/utils/strings'

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

const showMatchedUrls = ref(false)

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

const matchedCount = computed(() => {
  const matches = bulkGalleryCandidates.value.filter((item: any) => {
    return customStrMatch(item.imgUrl, batchRenameMatch.value)
  })
  return matches.length
})

const matchedUrls = computed(() => {
  const matches = bulkGalleryCandidates.value.filter((item: any) => {
    return customStrMatch(item.imgUrl, batchRenameMatch.value)
  })
  return matches.map((item: any) => item.imgUrl || '').filter(Boolean)
})

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
  if (!bulkChanges.reopen() && !bulkChanges.building.value) isShowBatchRenameDialog.value = true
}

async function handleBatchRename() {
  if (bulkChanges.building.value) return
  if (!batchRenameMatch.value) {
    message.warning(t('pages.gallery.inputRegexTip'))
    return
  }
  try {
    new RegExp(batchRenameMatch.value, 'ug')
  } catch {
    message.error(t('common.bulk.invalidPattern'))
    return
  }
  const items = bulkGalleryCandidates.value
    .filter(item => customStrMatch(item.imgUrl || '', batchRenameMatch.value))
    .map((item, index) => ({
      id: item.id!,
      source: item.imgUrl!,
      target: customStrReplace(item.imgUrl!, batchRenameMatch.value, batchRenameReplace.value).replaceAll(
        '{auto}',
        String(index + 1),
      ),
    }))
  if (!items.length) {
    message.warning(t('pages.gallery.noMatch'))
    return
  }
  if (await bulkChanges.preview(IRPCActionType.BULK_PREVIEW_GALLERY_URL, items)) {
    isShowBatchRenameDialog.value = false
  } else {
    message.error(bulkChanges.error.value)
  }
}
defineExpose({ open: openDialog, openBatch: openBatchRename })
</script>
