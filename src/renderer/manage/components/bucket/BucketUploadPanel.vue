<template>
  <CustomModal
    v-model:visible="isShowUploadPanel"
    :title="t('pages.manage.bucket.uploadFile')"
    :description="destination ? t('pages.manage.bucket.uploadTo', { path: destination }) : ''"
    width="860px"
    height="85vh"
  >
    <div class="flex h-full min-h-0 flex-col gap-4 p-5">
      <div
        v-if="failed"
        role="status"
        class="flex shrink-0 items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-main"
      >
        <span class="flex items-center gap-2">
          <TriangleAlertIcon :size="16" class="shrink-0 text-warning" aria-hidden="true" />
          {{ t('pages.manage.bucket.loadingFailed') }}
        </span>
        <CustomButton
          type="secondary"
          :icon="RotateCcwIcon"
          :text="t('common.bulk.retry')"
          class="h-[30px] px-3! py-0!"
          @click="emit('refresh')"
        />
      </div>

      <!-- Drop zone -->
      <div
        ref="uploadDialog"
        role="button"
        tabindex="0"
        class="flex shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-6 transition-all duration-fast ease-apple focus-visible:focus-ring"
        :class="[
          hasStaged ? 'gap-4 py-4' : 'flex-col gap-3 py-10 text-center',
          isDragover ? 'border-accent bg-accent/10' : 'border-border hover:border-accent hover:bg-accent/5',
        ]"
        :aria-label="t('pages.manage.bucket.clickUpload')"
        @drop.prevent="onDrop"
        @dragover.prevent="isDragover = true"
        @dragleave.prevent="isDragover = false"
        @click="openFileSelectDialog"
        @keydown.enter.prevent="openFileSelectDialog"
        @keydown.space.prevent="openFileSelectDialog"
      >
        <span
          class="flex shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-fast ease-apple"
          :class="[hasStaged ? 'h-[40px] w-[40px]' : 'h-[56px] w-[56px]', { 'scale-110': isDragover }]"
          aria-hidden="true"
        >
          <CloudUploadIcon :size="hasStaged ? 20 : 28" />
        </span>
        <div class="min-w-0">
          <p class="m-0 font-semibold text-main" :class="hasStaged ? 'text-sm' : 'text-base'">
            {{ t('pages.manage.bucket.dragUpload') }}
          </p>
          <p class="m-0 mt-0.5 text-sm text-secondary">{{ t('pages.manage.bucket.clickUpload') }}</p>
        </div>
      </div>

      <!-- Staged files -->
      <section
        v-if="hasStaged"
        class="flex shrink-0 flex-col overflow-hidden rounded-xl border border-border-secondary bg-bg-secondary"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-secondary px-3 py-2">
          <span class="text-sm font-semibold text-main tabular-nums">
            {{ t('pages.manage.bucket.readyCount', { num: uploadPanelFilesList.length }) }}
          </span>
          <span class="text-xs text-secondary tabular-nums">{{ formatFileSize(stagedSize) || '0 B' }}</span>
          <CustomSwitch
            v-model="isUploadKeepDirStructure"
            :title="t('pages.manage.bucket.keepDirStructure')"
            small
            tighter
            no-border
            no-hover
          />
          <div class="ml-auto flex items-center gap-2">
            <CustomButton
              type="secondary"
              :icon="XIcon"
              :text="t('pages.manage.bucket.clear')"
              :disabled="isLoadingUploadPanelFiles"
              class="h-[32px] px-3! py-0!"
              @click="clearTableData"
            />
            <CustomButton
              :icon="UploadIcon"
              :loading="isLoadingUploadPanelFiles"
              :text="
                isLoadingUploadPanelFiles
                  ? t('pages.manage.bucket.readingDir')
                  : t('pages.manage.bucket.uploadNum', { num: uploadPanelFilesList.length })
              "
              :disabled="!uploadPanelFilesList.length"
              class="h-[32px] px-3! py-0!"
              @click="uploadFiles"
            />
          </div>
        </div>
        <VirtualScroller
          :items="sortedFiles"
          :item-height="48"
          class="w-full px-2 pt-2"
          :style="{ height: `${Math.min(200, sortedFiles.length * 48 + 8)}px` }"
          view-mode="list"
        >
          <template #default="{ item }">
            <div class="flex h-[42px] w-full items-center gap-3 rounded-lg px-2 hover:bg-accent/5">
              <span
                class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md"
                :class="item.isFolder ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-secondary'"
                aria-hidden="true"
              >
                <FolderIcon v-if="item.isFolder" :size="16" />
                <FileIcon v-else :size="16" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="m-0 truncate text-sm font-medium text-main" :title="item.name">{{ item.name }}</p>
                <p
                  class="m-0 truncate text-xs text-tertiary"
                  :class="{ 'font-mono text-[11px]': !item.isFolder }"
                  :title="item.fullPath"
                >
                  {{
                    item.isFolder
                      ? t('pages.manage.bucket.filesInFolder', { num: item.filesList.length })
                      : item.fullPath
                  }}
                </p>
              </div>
              <span class="shrink-0 text-xs text-secondary tabular-nums">{{ formatFileSize(item.fileSize) }}</span>
            </div>
          </template>
        </VirtualScroller>
      </section>

      <!-- Tasks -->
      <TransferTaskList
        v-model:tab="activeUpLoadTab"
        :tabs="taskTabs"
        :items="visibleTasks"
        :label="t('pages.manage.bucket.uploadFile')"
        :reason="taskReason"
      >
        <template #actions>
          <button
            v-tooltip="t('pages.manage.bucket.copyUploadTask')"
            type="button"
            :class="taskActionClass"
            :aria-label="t('pages.manage.bucket.copyUploadTask')"
            @click="emit('copy')"
          >
            <CopyIcon :size="16" aria-hidden="true" />
          </button>
          <button
            v-tooltip="t('pages.manage.bucket.clearFinishedTasks')"
            type="button"
            :class="taskActionClass"
            :aria-label="t('pages.manage.bucket.clearFinishedTasks')"
            @click="emit('clear-finished')"
          >
            <ListChecksIcon :size="16" aria-hidden="true" />
          </button>
          <button
            v-tooltip="t('pages.manage.bucket.clearAll')"
            type="button"
            :class="[taskActionClass, 'hover:bg-danger/10! hover:text-danger!']"
            :aria-label="t('pages.manage.bucket.clearAll')"
            @click="emit('clear-all')"
          >
            <Trash2Icon :size="16" aria-hidden="true" />
          </button>
        </template>
        <template #item-action="{ item, active }">
          <button
            v-if="active"
            v-tooltip="item.cancelRequested ? t('pages.manage.bucket.cancelingUpload') : t('common.cancel')"
            type="button"
            :class="[taskActionClass, 'hover:bg-danger/10! hover:text-danger!']"
            :disabled="item.cancelRequested"
            :aria-label="item.cancelRequested ? t('pages.manage.bucket.cancelingUpload') : t('common.cancel')"
            @click="emit('cancel-task', item.id)"
          >
            <LoaderCircleIcon
              v-if="item.cancelRequested"
              :size="16"
              class="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <XIcon v-else :size="16" aria-hidden="true" />
          </button>
        </template>
      </TransferTaskList>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import {
  CloudUploadIcon,
  CopyIcon,
  FileIcon,
  FolderIcon,
  ListChecksIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from '@lucide/vue'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import VirtualScroller from '@/components/VirtualScroller.vue'
import { useDragEventListeners } from '@/composables/useDragEventListeners'
import TransferTaskList from '@/manage/components/bucket/TransferTaskList.vue'
import { useBucketUploadSelection } from '@/manage/composables/useBucketUploadSelection'
import { formatFileSize } from '@/manage/utils/filePresentation'

const isShowUploadPanel = defineModel<boolean>('visible', { required: true })
const isUploadKeepDirStructure = defineModel<boolean>('keepDirectory', { required: true })
const { tasks: uploadTaskList, destination = '' } = defineProps<{
  tasks: IUploadTask[]
  failed: boolean
  /** Human readable upload target, shown under the title. */
  destination?: string
}>()
const emit = defineEmits<{
  upload: [files: any[]]
  refresh: []
  copy: []
  'clear-finished': []
  'clear-all': []
  'cancel-task': [id: string]
}>()
const { t } = useI18n()
const {
  isDragover,
  tableData,
  uploadPanelFilesList,
  isLoadingUploadPanelFiles,
  openFileSelectDialog,
  onDrop,
  clearTableData,
} = useBucketUploadSelection()
const uploadDialog = useTemplateRef<HTMLDivElement>('uploadDialog')
useDragEventListeners(uploadDialog)
const activeUpLoadTab = ref('uploading')

const taskActionClass =
  'flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast hover:bg-accent/10 hover:text-accent focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50'

const hasStaged = computed(() => tableData.length > 0 || isLoadingUploadPanelFiles.value)

const stagedSize = computed(() =>
  uploadPanelFilesList.value.reduce((total: number, item: any) => total + (Number(item.size) || 0), 0),
)

const uploadingTaskList = computed(() =>
  uploadTaskList.filter(item => ['uploading', 'queuing', 'paused'].includes(item.status)),
)
const succeededTaskList = computed(() => uploadTaskList.filter(item => item.status === 'uploaded'))
const failedTaskList = computed(() => uploadTaskList.filter(item => ['failed', 'canceled'].includes(item.status)))

const taskTabs = computed(() => [
  { id: 'uploading', label: t('pages.manage.bucket.uploading'), count: uploadingTaskList.value.length },
  { id: 'finished', label: t('pages.manage.bucket.success'), count: succeededTaskList.value.length },
  { id: 'failed', label: t('pages.manage.bucket.failed'), count: failedTaskList.value.length },
])

const visibleTasks = computed(() =>
  activeUpLoadTab.value === 'uploading'
    ? uploadingTaskList.value
    : activeUpLoadTab.value === 'finished'
      ? succeededTaskList.value
      : failedTaskList.value,
)

function taskReason(item: IUploadTask) {
  const reason = item.response?.reason
  return reason ? t(`pages.manage.bucket.uploadFailure.${reason}`) : undefined
}

const sortedFiles = computed(() =>
  [...tableData].sort((a, b) => b.isFolder - a.isFolder || b.filesList.length - a.filesList.length),
)
function uploadFiles() {
  emit('upload', uploadPanelFilesList.value)
  clearTableData()
  activeUpLoadTab.value = 'uploading'
}
</script>
