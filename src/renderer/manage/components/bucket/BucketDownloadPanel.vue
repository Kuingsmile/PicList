<template>
  <CustomModal
    v-model:visible="isShowDownloadPanel"
    :title="t('pages.manage.bucket.downloadPage')"
    width="760px"
    height="80vh"
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

      <TransferTaskList
        v-model:tab="activeDownLoadTab"
        :tabs="taskTabs"
        :items="visibleTasks"
        :label="t('pages.manage.bucket.downloadPage')"
        :reason="taskReason"
      >
        <template #actions>
          <button
            v-tooltip="t('pages.manage.bucket.copyDownloadTask')"
            type="button"
            :class="taskActionClass"
            :aria-label="t('pages.manage.bucket.copyDownloadTask')"
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
      </TransferTaskList>
    </div>
    <template #footer>
      <CustomButton
        type="secondary"
        :icon="FolderOpenIcon"
        :text="t('pages.manage.bucket.openDownloadFolder')"
        @click="emit('open-folder')"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { CopyIcon, FolderOpenIcon, ListChecksIcon, RotateCcwIcon, Trash2Icon, TriangleAlertIcon } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import TransferTaskList from '@/manage/components/bucket/TransferTaskList.vue'

const isShowDownloadPanel = defineModel<boolean>('visible', { required: true })
const { tasks: downloadTaskList } = defineProps<{ tasks: IDownloadTask[]; failed: boolean }>()
const emit = defineEmits<{ refresh: []; copy: []; 'clear-finished': []; 'clear-all': []; 'open-folder': [] }>()
const { t } = useI18n()
const activeDownLoadTab = ref('downloading')

const taskActionClass =
  'flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors duration-fast hover:bg-accent/10 hover:text-accent focus-visible:focus-ring'

const downloadingTaskList = computed(() =>
  downloadTaskList.filter(item => ['downloading', 'queuing', 'paused'].includes(item.status)),
)
const succeededTaskList = computed(() => downloadTaskList.filter(item => item.status === 'downloaded'))
const failedTaskList = computed(() => downloadTaskList.filter(item => ['failed', 'canceled'].includes(item.status)))

const taskTabs = computed(() => [
  { id: 'downloading', label: t('pages.manage.bucket.downloading'), count: downloadingTaskList.value.length },
  { id: 'finished', label: t('pages.manage.bucket.success'), count: succeededTaskList.value.length },
  { id: 'failed', label: t('pages.manage.bucket.failed'), count: failedTaskList.value.length },
])

const visibleTasks = computed(() =>
  activeDownLoadTab.value === 'downloading'
    ? downloadingTaskList.value
    : activeDownLoadTab.value === 'finished'
      ? succeededTaskList.value
      : failedTaskList.value,
)

function taskReason(item: IDownloadTask) {
  return item.response?.reason === 'interrupted' ? t('pages.manage.bucket.downloadInterrupted') : undefined
}
</script>
