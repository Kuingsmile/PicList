<template>
  <CustomModal
    v-model:visible="isShowUploadPanel"
    :title="t('pages.manage.bucket.uploadFile')"
    width="900px"
    height="90vh"
  >
    <div class="flex h-full w-full flex-col gap-2">
      <div
        v-if="failed"
        role="status"
        class="flex items-center justify-between gap-3 rounded-md bg-warning/10 p-3 text-sm text-main"
      >
        <span>{{ t('pages.manage.bucket.loadingFailed') }}</span>
        <CustomButton type="secondary" :text="t('common.bulk.retry')" @click="emit('refresh')" />
      </div>
      <div class="flex justify-end">
        <CustomSwitch
          v-model="isUploadKeepDirStructure"
          :title="
            isUploadKeepDirStructure
              ? t('pages.manage.bucket.keepDirStructure')
              : t('pages.manage.bucket.noKeepDirStructure')
          "
          small
          no-border
          @change="emit('keep-directory-change', $event)"
        />
      </div>

      <div class="no-scrollbar w-full flex-1 overflow-hidden rounded-md border border-border p-4 shadow-md">
        <div class="flex h-full w-full flex-col">
          <div
            v-if="!tableData.length"
            ref="uploadDialog"
            class="h-[200px] w-full cursor-pointer rounded-lg border-2 border-dashed border-border bg-surface p-4 text-center transition-all duration-fast ease-apple hover:border-accent hover:bg-accent/10 [.dragover]:border-accent [.dragover]:bg-accent/10"
            :class="{ dragover: isDragover }"
            @drop.prevent="onDrop"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @click="openFileSelectDialog"
          >
            <div class="flex h-full flex-col items-center justify-center gap-2">
              <div class="mb-2 text-lg font-semibold text-secondary">
                {{ t('pages.manage.bucket.dragUpload') }}
              </div>
              <div class="text-sm font-medium text-secondary">
                {{ t('pages.manage.bucket.clickUpload') }}
              </div>
            </div>
          </div>

          <!-- Upload File List -->
          <div
            v-if="tableData.length"
            class="flex h-[200px] w-full cursor-pointer rounded-lg border-2 border-dashed border-border bg-surface p-4 text-center transition-all duration-fast ease-apple"
          >
            <VirtualScroller :items="sortedFiles" :item-height="90" class="min-h-0 w-full flex-1 p-3" view-mode="list">
              <template #default="{ item }">
                <div
                  class="m-0 flex w-full cursor-pointer items-center gap-2 rounded-md border border-border-secondary bg-bg-secondary px-4 py-3 hover:bg-accent/10"
                >
                  <div class="flex h-[25px] w-[25px] shrink-0 items-center justify-center">
                    <FolderIcon v-if="item.isFolder" class="h-[48px] w-[48px] text-tertiary" />
                    <FileIcon v-else class="h-[48px] w-[48px] text-tertiary" />
                  </div>
                  <div class="min-w-0 flex-1 flex-col">
                    <div class="flex flex-row justify-between gap-3">
                      <div
                        class="mb-1 cursor-pointer overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap text-secondary"
                      >
                        {{ item.name }}
                      </div>
                      <div
                        v-if="item.fullPath"
                        class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-secondary"
                      >
                        {{ item.fullPath }}
                      </div>
                    </div>
                    <div class="flex text-xs text-secondary">
                      <span>{{ formatFileSize(item.fileSize) }}</span>
                      <span v-if="item.isFolder"> {{ item.filesList.length }} files </span>
                    </div>
                  </div>
                </div>
              </template>
            </VirtualScroller>
          </div>

          <!-- Upload Actions -->
          <div v-if="tableData.length" class="mt-4 flex justify-center gap-4">
            <CustomButton
              :disabled="isLoadingUploadPanelFiles"
              :text="isLoadingUploadPanelFiles ? t('pages.manage.bucket.readingDir') : t('pages.manage.bucket.upload')"
              :icon="UploadIcon"
              @click="uploadFiles"
            />
            <CustomButton
              type="secondary"
              :icon="Trash2Icon"
              :text="t('pages.manage.bucket.clear')"
              :disabled="isLoadingUploadPanelFiles"
              @click="clearTableData"
            />
          </div>

          <!-- Upload Tasks Tabs -->
          <div class="flex flex-1 flex-col gap-2 overflow-hidden border-t border-border-secondary">
            <div class="flex shrink-0 border-b border-b-border">
              <button
                class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                :class="{ active: activeUpLoadTab === 'uploading' }"
                @click="activeUpLoadTab = 'uploading'"
              >
                {{ t('pages.manage.bucket.uploading') }}
                <span
                  v-if="uploadingTaskList.length"
                  class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                >
                  {{ uploadingTaskList.length }}
                </span>
              </button>
              <button
                class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                :class="{ active: activeUpLoadTab === 'finished' }"
                @click="activeUpLoadTab = 'finished'"
              >
                {{ t('pages.manage.bucket.success') }}
                <span
                  v-if="uploadedTaskList.filter(item => item.status === 'uploaded').length"
                  class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                >
                  {{ uploadedTaskList.filter(item => item.status === 'uploaded').length }}
                </span>
              </button>
              <button
                class="relative flex-1 rounded-md border-b-2 border-b-transparent bg-none px-6 py-3 text-sm font-semibold text-secondary shadow-sm transition-all duration-fast ease-apple hover:border-b-accent hover:text-main [.active]:border-b-accent [.active]:bg-accent [.active]:text-white"
                :class="{ active: activeUpLoadTab === 'failed' }"
                @click="activeUpLoadTab = 'failed'"
              >
                {{ t('pages.manage.bucket.failed') }}
                <span
                  v-if="uploadedTaskList.filter(item => item.status !== 'uploaded').length"
                  class="absolute top-1 right-1 min-w-[16px] rounded-full bg-accent px-1.5 py-0.5 text-center text-xs text-white"
                >
                  {{ uploadedTaskList.filter(item => item.status !== 'uploaded').length }}
                </span>
              </button>
            </div>

            <div class="flex flex-row justify-center gap-3 rounded-md border border-border shadow-sm">
              <CustomButton
                type="secondary"
                :text="t('pages.manage.bucket.copyUploadTask')"
                :icon="CopyIcon"
                @click="emit('copy')"
              />
              <CustomButton
                type="secondary"
                :text="t('pages.manage.bucket.clearFinishedTasks')"
                :icon="Trash2Icon"
                @click="emit('clear-finished')"
              />
              <CustomButton
                type="secondary"
                :text="t('pages.manage.bucket.clearAll')"
                :icon="Trash2Icon"
                @click="emit('clear-all')"
              />
            </div>

            <div
              class="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-border-secondary p-2"
            >
              <!-- Uploading Tab -->
              <VirtualScroller
                :items="
                  activeUpLoadTab === 'uploading'
                    ? uploadingTaskList
                    : activeUpLoadTab === 'finished'
                      ? uploadedTaskList.filter(item => item.status === 'uploaded')
                      : uploadedTaskList.filter(item => item.status !== 'uploaded')
                "
                :item-height="70"
                class="min-h-0 w-full flex-1 p-3"
                view-mode="list"
              >
                <template #default="{ item }">
                  <div
                    class="m-0 flex w-full cursor-pointer items-center gap-3 rounded-md border border-border bg-bg-secondary px-4 py-3 hover:border-accent hover:shadow-md"
                  >
                    <div class="flex flex-1 flex-col gap-1">
                      <div class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-secondary">
                        {{ item.sourceFileName }}
                      </div>
                      <div
                        v-if="activeUpLoadTab === 'uploading'"
                        class="h-[8px] w-full overflow-hidden rounded-[4px] bg-surface-elevated"
                      >
                        <div
                          class="h-full rounded-[4px] bg-accent transition-all duration-300 ease-apple"
                          :style="{ width: `${item.progress}%` }"
                        />
                      </div>
                      <div v-else class="flex gap-4 text-xs text-secondary">
                        <span>{{ item.finishTime }}</span>
                        <span class="text-xs font-semibold text-success">
                          {{
                            item.status === 'canceled'
                              ? t('pages.manage.bucket.uploadCanceled')
                              : activeUpLoadTab === 'finished'
                                ? t('pages.manage.bucket.success')
                                : t('pages.manage.bucket.failed')
                          }}
                        </span>
                        <span v-if="item.response?.reason">{{
                          t(`pages.manage.bucket.uploadFailure.${item.response.reason}`)
                        }}</span>
                      </div>
                    </div>
                    <CustomButton
                      v-if="activeUpLoadTab === 'uploading'"
                      type="secondary"
                      :disabled="item.cancelRequested"
                      :text="item.cancelRequested ? t('pages.manage.bucket.cancelingUpload') : t('common.cancel')"
                      @click="emit('cancel-task', item.id)"
                    />
                  </div>
                </template>
              </VirtualScroller>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CustomModal>
</template>

<script setup lang="ts">
import { CopyIcon, FileIcon, FolderIcon, Trash2Icon, UploadIcon } from '@lucide/vue'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import VirtualScroller from '@/components/VirtualScroller.vue'
import { useDragEventListeners } from '@/composables/useDragEventListeners'
import { useBucketUploadSelection } from '@/manage/composables/useBucketUploadSelection'
import { formatFileSize } from '@/manage/utils/filePresentation'

const isShowUploadPanel = defineModel<boolean>('visible', { required: true })
const isUploadKeepDirStructure = defineModel<boolean>('keepDirectory', { required: true })
const { tasks: uploadTaskList } = defineProps<{ tasks: IUploadTask[]; failed: boolean }>()
const emit = defineEmits<{
  upload: [files: any[]]
  refresh: []
  copy: []
  'clear-finished': []
  'clear-all': []
  'cancel-task': [id: string]
  'keep-directory-change': [value: boolean]
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

const uploadingTaskList = computed(() =>
  uploadTaskList.filter(item => ['uploading', 'queuing', 'paused'].includes(item.status)),
)

const uploadedTaskList = computed(() =>
  uploadTaskList.filter(item => ['uploaded', 'failed', 'canceled'].includes(item.status)),
)
const sortedFiles = computed(() =>
  [...tableData].sort((a, b) => b.isFolder - a.isFolder || b.filesList.length - a.filesList.length),
)
function uploadFiles() {
  emit('upload', uploadPanelFilesList.value)
  clearTableData()
}
</script>
