<template>
  <div class="contents">
    <button
      v-tooltip="statusError ? t('pages.upload.taskQueue.unavailable') : queueStateLabel"
      type="button"
      class="queue-entry group"
      aria-haspopup="dialog"
      @click="openTaskDialog"
    >
      <ListTodoIcon :size="15" class="shrink-0 text-accent group-hover:text-white" aria-hidden="true" />
      <span class="text-sm font-medium whitespace-nowrap text-secondary group-hover:text-white">{{
        t('pages.upload.taskUpload')
      }}</span>
      <span class="min-w-0 flex-1 truncate text-right text-xs text-secondary group-hover:text-white">{{
        statusError ? t('pages.upload.taskQueue.unavailable') : queueStateLabel
      }}</span>
      <span
        v-if="activeCount || taskQueueStatus.stats.failed"
        class="queue-count"
        :class="{ 'is-danger': !activeCount }"
        >{{ activeCount || taskQueueStatus.stats.failed }}</span
      >
      <span
        v-if="taskQueueStatus.config.isRunning"
        class="queue-entry-progress"
        :style="{ width: `${taskQueueStatus.stats.progress}%` }"
      />
    </button>

    <CustomModal
      v-model:visible="taskDialogVisible"
      :title="t('pages.upload.taskQueue.title')"
      width="1000px"
      max-width="96vw"
      height="min(820px, 92vh)"
      :scrollable="false"
    >
      <template #header>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 class="m-0 text-lg font-semibold text-main">{{ t('pages.upload.taskQueue.title') }}</h3>
          <span class="queue-state" :data-state="queueState" role="status">
            <span class="queue-state-dot" aria-hidden="true" />{{ queueStateLabel }}
          </span>
        </div>
      </template>

      <section
        class="queue-panel"
        @dragenter.prevent.stop="onDragEnter"
        @dragover.prevent.stop="onDragOver"
        @dragleave.prevent.stop="dragDepth = Math.max(0, dragDepth - 1)"
        @drop.prevent.stop="onDrop"
      >
        <div v-if="dragDepth" class="queue-drop-overlay" aria-hidden="true">
          <UploadCloudIcon :size="32" />
          <span>{{ t('pages.upload.taskQueue.dropFiles') }}</span>
        </div>

        <div class="queue-toolbar">
          <div class="flex flex-wrap items-center gap-2">
            <CustomButton
              v-if="taskQueueStatus.config.isPaused"
              :icon="PlayIcon"
              :disabled="actionsDisabled"
              :text="t('pages.upload.taskQueue.resume')"
              @click="resumeTaskQueue"
            />
            <CustomButton
              v-else-if="taskQueueStatus.config.isRunning"
              v-tooltip="t('pages.upload.taskQueue.pauseHint')"
              type="secondary"
              :icon="PauseIcon"
              :disabled="actionsDisabled"
              :text="t('pages.upload.taskQueue.pause')"
              @click="pauseTaskQueue"
            />
            <CustomButton
              v-else
              :icon="PlayIcon"
              :disabled="actionsDisabled || !taskQueueStatus.stats.pending || savingSettings"
              :text="t('pages.upload.taskQueue.start')"
              @click="startTaskQueue"
            />
            <CustomButton
              type="secondary"
              :icon="PlusIcon"
              :disabled="actionsDisabled"
              :loading="pendingAction === IRPCActionType.UPLOAD_TASK_ADD"
              :text="t('pages.upload.taskQueue.addFiles')"
              @click="addFilesToTask"
            />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <CustomButton
              v-if="retryableCount"
              type="secondary"
              :icon="RefreshCwIcon"
              :disabled="actionsDisabled"
              :text="t('pages.upload.taskQueue.retryAllFailed')"
              @click="retryAllFailedTasks"
            />
            <CustomButton
              v-if="finishedCount"
              v-tooltip="t('pages.upload.taskQueue.clearFinishedHint')"
              type="secondary"
              :icon="ListXIcon"
              :disabled="actionsDisabled"
              :text="t('pages.upload.taskQueue.clearFinished')"
              @click="clearFinishedTasks"
            />
            <CustomButton
              v-if="activeCount"
              type="secondary"
              :icon="CircleStopIcon"
              icon-class="text-danger"
              :disabled="actionsDisabled"
              :text="t('pages.upload.taskQueue.cancelAll')"
              @click="cancelAllTasks"
            />
            <button
              v-tooltip="t('pages.upload.taskQueue.settings')"
              type="button"
              class="queue-icon-button"
              :aria-label="t('pages.upload.taskQueue.settings')"
              :aria-expanded="showTaskSettings"
              aria-controls="upload-queue-settings"
              @click="showTaskSettings = !showTaskSettings"
            >
              <SlidersHorizontalIcon :size="18" aria-hidden="true" />
            </button>
          </div>
        </div>

        <fieldset
          v-if="showTaskSettings"
          id="upload-queue-settings"
          class="queue-settings"
          :disabled="savingSettings || actionsDisabled"
        >
          <legend class="sr-only">{{ t('pages.upload.taskQueue.settings') }}</legend>
          <SettingCard>
            <CustomInput
              id="queue-interval"
              v-model.number="settings.intervalS"
              type="number"
              min="0.1"
              max="99999"
              step="0.1"
              :title="t('pages.upload.taskQueue.interval')"
              :tips="t('pages.upload.taskQueue.intervalHint')"
              placeholder="1"
              :disabled="savingSettings || actionsDisabled"
              class="pr-8"
              @change="updateSettings('intervalS')"
            >
              <template #input-extra>
                <span class="queue-input-unit" aria-hidden="true">s</span>
              </template>
            </CustomInput>
          </SettingCard>
          <SettingCard>
            <CustomInput
              id="queue-retries"
              v-model.number="settings.maxRetryCount"
              type="number"
              min="0"
              max="10"
              step="1"
              :title="t('pages.upload.taskQueue.maxRetry')"
              :tips="t('pages.upload.taskQueue.maxRetryHint')"
              placeholder="3"
              :disabled="savingSettings || actionsDisabled"
              @change="updateSettings('maxRetryCount')"
            />
          </SettingCard>
          <SettingCard p1 class="flex flex-col justify-center">
            <CustomSwitch
              :model-value="settings.autoStart"
              small
              no-border
              :disabled="savingSettings || actionsDisabled"
              :title="t('pages.upload.taskQueue.autoStart')"
              :tips="t('pages.upload.taskQueue.autoStartHint')"
              @update:model-value="setSwitch('autoStart', $event)"
            />
          </SettingCard>
          <SettingCard p1 class="flex flex-col justify-center">
            <CustomSwitch
              :model-value="settings.pauseOnError"
              small
              no-border
              :disabled="savingSettings || actionsDisabled"
              :title="t('pages.upload.taskQueue.pauseOnError')"
              :tips="t('pages.upload.taskQueue.pauseOnErrorHint')"
              @update:model-value="setSwitch('pauseOnError', $event)"
            />
          </SettingCard>
        </fieldset>

        <div v-if="taskQueueStatus.stats.total" class="queue-overview">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span class="text-sm font-medium text-main tabular-nums"
              >{{ t('pages.upload.taskQueue.completedSummary', { completed: stats.completed, total: queuedTotal })
              }}<span v-if="stats.failed" class="text-danger">
                · {{ t('pages.upload.taskQueue.failedSummary', { count: stats.failed }) }}</span
              ></span
            >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary tabular-nums">
              <span v-if="showSpeed">{{ formatSize(stats.avgSpeed) }}/s</span>
              <span v-if="stats.estimatedTimeMs > 0">{{
                t('pages.upload.taskQueue.timeRemaining', { time: formatTime(stats.estimatedTimeMs) })
              }}</span>
              <span>{{ formatSize(stats.transferredSize) }} / {{ formatSize(stats.totalSize) }}</span>
            </div>
          </div>
          <div
            class="queue-progress flex"
            role="progressbar"
            :aria-label="t('pages.upload.taskQueue.overallProgress')"
            :aria-valuenow="stats.progress"
            :aria-valuemin="0"
            :aria-valuemax="100"
          >
            <div
              v-for="segment in progressSegments"
              :key="segment.key"
              :class="segment.class"
              :style="{ width: `${segment.width}%` }"
            />
          </div>
          <p v-if="queueHint" class="m-0 text-xs text-secondary">{{ queueHint }}</p>
        </div>

        <div v-if="taskQueueStatus.stats.total" class="queue-filters">
          <div class="flex min-w-0 flex-wrap gap-1" role="group" :aria-label="t('pages.upload.taskQueue.filterLabel')">
            <button
              v-for="filter in shownFilters"
              :key="filter.value"
              type="button"
              class="queue-filter"
              :data-filter="filter.value"
              :aria-pressed="taskFilter === filter.value"
              @click="taskFilter = filter.value"
            >
              {{ filter.label }} <span class="tabular-nums">{{ filter.count }}</span>
            </button>
          </div>
          <label class="queue-search">
            <SearchIcon :size="15" class="shrink-0 text-secondary" aria-hidden="true" />
            <input
              v-model="taskSearchQuery"
              type="search"
              :aria-label="t('pages.upload.taskQueue.searchPlaceholder')"
              :placeholder="t('pages.upload.taskQueue.searchPlaceholder')"
            />
          </label>
        </div>

        <div v-if="statusError" class="queue-load-error" role="alert">
          <span>{{ t('pages.upload.taskQueue.loadFailed') }}</span>
          <CustomButton type="secondary" :text="t('pages.upload.taskQueue.reload')" @click="refreshTaskStatus" />
        </div>
        <div
          ref="taskList"
          class="queue-list"
          :aria-busy="isLoading"
          tabindex="0"
          :aria-label="t('pages.upload.taskQueue.title')"
        >
          <div v-if="isLoading" class="queue-empty" role="status">
            <LoaderCircleIcon :size="26" class="animate-spin motion-reduce:animate-none" />{{
              t('pages.upload.taskQueue.loading')
            }}
          </div>
          <div v-else-if="!taskQueueStatus.stats.total && !statusError" class="queue-empty">
            <div class="queue-empty-icon" aria-hidden="true"><UploadCloudIcon :size="28" /></div>
            <h4>{{ t('pages.upload.taskQueue.empty') }}</h4>
            <p>{{ t('pages.upload.taskQueue.emptyHint') }}</p>
            <CustomButton
              :icon="PlusIcon"
              :disabled="actionsDisabled"
              :text="t('pages.upload.taskQueue.selectFiles')"
              @click="addFilesToTask"
            />
          </div>
          <div v-else-if="!filteredTasks.length && !statusError" class="queue-empty" role="status">
            <SearchIcon :size="28" aria-hidden="true" />
            <h4>{{ t('pages.upload.taskQueue.noMatchingTasks') }}</h4>
            <CustomButton type="secondary" :text="t('pages.upload.taskQueue.resetFilters')" @click="resetFilters" />
          </div>
          <ul v-else class="m-0 list-none p-0">
            <li v-for="task in visibleTasks" :key="task.id" class="queue-row" :data-status="task.status">
              <div class="queue-file-icon" aria-hidden="true">
                <CheckIcon v-if="task.status === 'completed'" :size="18" />
                <CircleAlertIcon v-else-if="task.status === 'failed'" :size="18" />
                <BanIcon v-else-if="task.status === 'cancelled'" :size="18" />
                <LoaderCircleIcon
                  v-else-if="task.status === 'uploading'"
                  :size="18"
                  class="animate-spin motion-reduce:animate-none"
                />
                <span v-else-if="pendingPositions.get(task.id)" class="text-xs font-semibold tabular-nums">{{
                  pendingPositions.get(task.id)?.position
                }}</span>
                <FileIcon v-else :size="18" />
              </div>
              <div class="min-w-0 flex-1">
                <span v-tooltip="task.filePath" class="block truncate text-sm font-medium text-main">{{
                  task.fileName
                }}</span>
                <div class="queue-row-details">
                  <span class="queue-task-status">{{ getTaskStatusText(task) }}</span>
                  <span v-if="task.priority === 2" class="queue-priority">
                    <StarIcon :size="11" class="fill-current" aria-hidden="true" />{{
                      t('pages.upload.taskQueue.highPriority')
                    }}
                  </span>
                  <span v-if="task.fileSize > 0">{{ formatSize(task.fileSize) }}</span>
                  <span v-if="task.status === 'uploading' && task.uploadSpeed"
                    >{{ formatSize(task.uploadSpeed) }}/s</span
                  >
                  <span v-if="task.retryCount > 0">{{
                    t('pages.upload.taskQueue.retryCount', { count: task.retryCount })
                  }}</span>
                </div>
                <div v-if="task.status === 'uploading'" class="mt-2 flex items-center gap-3">
                  <div
                    class="queue-progress flex-1"
                    role="progressbar"
                    :aria-label="task.fileName"
                    :aria-valuenow="task.indeterminate ? undefined : task.progress"
                    :aria-valuemin="0"
                    :aria-valuemax="100"
                    :aria-valuetext="task.indeterminate ? getTaskStatusText(task) : undefined"
                  >
                    <div
                      class="bg-accent"
                      :class="{ 'animate-upload-progress motion-reduce:animate-none': task.indeterminate }"
                      :style="{ width: task.indeterminate ? '35%' : `${task.progress}%` }"
                    />
                  </div>
                  <span v-if="!task.indeterminate" class="text-xs text-secondary tabular-nums"
                    >{{ task.progress }}%</span
                  >
                </div>
                <p v-if="task.status === 'failed'" v-tooltip="task.error" class="queue-task-error">
                  {{ getTaskFailureText(task) }}
                </p>
              </div>
              <div class="queue-row-actions">
                <div v-if="task.status === 'pending'" class="queue-row-reorder">
                  <button
                    v-tooltip="t('pages.upload.taskQueue.moveUp')"
                    type="button"
                    class="queue-icon-button"
                    :disabled="actionsDisabled || !pendingPositions.get(task.id)?.up"
                    :aria-label="t('pages.upload.taskQueue.moveUp')"
                    @click="moveTaskUp(task.id)"
                  >
                    <ChevronUpIcon :size="16" />
                  </button>
                  <button
                    v-tooltip="t('pages.upload.taskQueue.moveDown')"
                    type="button"
                    class="queue-icon-button"
                    :disabled="actionsDisabled || !pendingPositions.get(task.id)?.down"
                    :aria-label="t('pages.upload.taskQueue.moveDown')"
                    @click="moveTaskDown(task.id)"
                  >
                    <ChevronDownIcon :size="16" />
                  </button>
                </div>
                <button
                  v-if="task.status === 'pending'"
                  v-tooltip="t('pages.upload.taskQueue.togglePriority')"
                  type="button"
                  class="queue-icon-button queue-priority-toggle"
                  :disabled="actionsDisabled"
                  :aria-pressed="task.priority === 2"
                  :aria-label="t('pages.upload.taskQueue.togglePriority')"
                  @click="toggleTaskPriority(task.id, task.priority)"
                >
                  <StarIcon :size="16" :class="{ 'fill-current': task.priority === 2 }" />
                </button>
                <button
                  v-if="canRetryTask(task)"
                  v-tooltip="t('pages.upload.taskQueue.retryTask')"
                  type="button"
                  class="queue-icon-button"
                  :disabled="actionsDisabled"
                  :aria-label="t('pages.upload.taskQueue.retryTask')"
                  @click="retryTask(task.id)"
                >
                  <RefreshCwIcon :size="16" />
                </button>
                <button
                  v-if="task.status === 'pending' || task.status === 'uploading'"
                  v-tooltip="t('pages.upload.taskQueue.cancelTask')"
                  type="button"
                  class="queue-icon-button is-danger"
                  :disabled="actionsDisabled"
                  :aria-label="t('pages.upload.taskQueue.cancelTask')"
                  @click="cancelTask(task.id)"
                >
                  <XIcon :size="16" />
                </button>
                <button
                  v-else
                  v-tooltip="t('pages.upload.taskQueue.removeTask')"
                  type="button"
                  class="queue-icon-button is-danger"
                  :disabled="actionsDisabled"
                  :aria-label="t('pages.upload.taskQueue.removeTask')"
                  @click="removeTask(task.id)"
                >
                  <Trash2Icon :size="16" />
                </button>
              </div>
            </li>
          </ul>
        </div>
        <footer v-if="pageCount > 1" class="queue-footer">
          <span class="text-xs text-secondary tabular-nums">{{
            t('pages.upload.taskQueue.showing', {
              from: (taskPage - 1) * pageSize + 1,
              to: Math.min(taskPage * pageSize, filteredTasks.length),
              total: filteredTasks.length,
            })
          }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="queue-icon-button"
              :disabled="taskPage === 1"
              :aria-label="t('pages.upload.taskQueue.previousPage')"
              @click="taskPage--"
            >
              <ChevronLeftIcon :size="16" />
            </button>
            <span class="text-xs text-secondary tabular-nums">{{ taskPage }} / {{ pageCount }}</span>
            <button
              type="button"
              class="queue-icon-button"
              :disabled="taskPage === pageCount"
              :aria-label="t('pages.upload.taskQueue.nextPage')"
              @click="taskPage++"
            >
              <ChevronRightIcon :size="16" />
            </button>
          </div>
        </footer>
      </section>
    </CustomModal>
  </div>
</template>

<script setup lang="ts">
import {
  BanIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  CircleStopIcon,
  FileIcon,
  ListTodoIcon,
  ListXIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  StarIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from '@lucide/vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import SettingCard from '@/components/common/SettingCard.vue'
import { useUploadTaskQueue } from '@/composables/useUploadTaskQueue'
import { IRPCActionType } from '#/constants/rpcActions'

const { t } = useI18n()
const {
  taskDialogVisible,
  showTaskSettings,
  taskSearchQuery,
  taskFilter,
  taskPage,
  pageSize,
  pageCount,
  taskQueueStatus,
  settings,
  filteredTasks,
  visibleTasks,
  activeCount,
  retryableCount,
  taskFilters,
  actionsDisabled,
  pendingAction,
  isLoading,
  statusError,
  savingSettings,
  queueState,
  queueStateLabel,
  pendingPositions,
  openTaskDialog,
  refreshTaskStatus,
  addFilesToTask,
  addTaskFiles,
  updateSettings,
  getTaskStatusText,
  getTaskFailureText,
  canRetryTask,
  startTaskQueue,
  pauseTaskQueue,
  resumeTaskQueue,
  cancelAllTasks,
  cancelTask,
  removeTask,
  clearFinishedTasks,
  retryTask,
  retryAllFailedTasks,
  moveTaskUp,
  moveTaskDown,
  toggleTaskPriority,
} = useUploadTaskQueue()
const dragDepth = ref(0)
const taskList = useTemplateRef('taskList')
const stats = computed(() => taskQueueStatus.stats)
const queuedTotal = computed(() => stats.value.total - stats.value.cancelled)
const finishedCount = computed(() => stats.value.completed + stats.value.cancelled)
const showSpeed = computed(
  () => taskQueueStatus.config.isRunning && !taskQueueStatus.config.isPaused && stats.value.avgSpeed > 0,
)
// Zero-count filters only add noise; keep the active one so it can be switched off.
const shownFilters = computed(() =>
  taskFilters.value.filter(filter => filter.value === 'all' || filter.count || taskFilter.value === filter.value),
)
// Segment the bar by file outcome so failures stay visible next to progress.
const progressSegments = computed(() => {
  const total = queuedTotal.value
  if (!total) return []
  const uploading = taskQueueStatus.tasks.reduce(
    (sum, task) => sum + (task.status === 'uploading' ? task.progress / 100 : 0),
    0,
  )
  return [
    { key: 'completed', class: 'bg-success', count: stats.value.completed },
    { key: 'uploading', class: 'bg-accent', count: uploading },
    { key: 'failed', class: 'bg-danger', count: stats.value.failed },
  ].map(segment => ({ ...segment, width: (segment.count / total) * 100 }))
})
const queueHint = computed(() => {
  if (taskQueueStatus.config.isPaused) return t('pages.upload.taskQueue.pauseHint')
  if (taskQueueStatus.config.isRunning)
    return t('pages.upload.taskQueue.intervalSummary', { seconds: taskQueueStatus.config.intervalS })
  return ''
})

watch([taskPage, taskFilter, taskSearchQuery], () => {
  taskList.value?.scrollTo({ top: 0 })
})
watch(taskDialogVisible, () => {
  dragDepth.value = 0
})

function setSwitch(key: 'autoStart' | 'pauseOnError', value: boolean) {
  settings[key] = value
  void updateSettings(key)
}

function resetFilters() {
  taskFilter.value = 'all'
  taskSearchQuery.value = ''
}

function onDragEnter(event: DragEvent) {
  if (!actionsDisabled.value && event.dataTransfer?.types.includes('Files')) dragDepth.value++
}

function onDragOver(event: DragEvent) {
  if (event.dataTransfer) event.dataTransfer.dropEffect = actionsDisabled.value ? 'none' : 'copy'
}

function onDrop(event: DragEvent) {
  dragDepth.value = 0
  if (!actionsDisabled.value && event.dataTransfer?.files.length) void addTaskFiles(event.dataTransfer.files)
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${parseFloat((bytes / 1024 ** index).toFixed(1))} ${units[index]}`
}

function formatTime(ms: number): string {
  const seconds = Math.max(1, Math.ceil(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
</script>

<style scoped src="./UploadTaskQueue.css"></style>
