<template>
  <div class="contents">
    <button type="button" class="queue-entry" aria-haspopup="dialog" @click="openTaskDialog">
      <ListTodoIcon :size="18" class="shrink-0 text-accent" aria-hidden="true" />
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-main">{{ t('pages.upload.taskUpload') }}</span>
        <span class="block truncate text-xs text-secondary">{{
          statusError ? t('pages.upload.taskQueue.unavailable') : queueStateLabel
        }}</span>
      </span>
      <span
        v-if="activeCount || taskQueueStatus.stats.failed"
        class="queue-count"
        :class="{ 'text-danger': !activeCount }"
      >
        {{ activeCount || taskQueueStatus.stats.failed }}
      </span>
      <ChevronRightIcon :size="16" class="text-secondary" aria-hidden="true" />
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
          <span class="queue-state" :data-state="queueState" role="status">{{ queueStateLabel }}</span>
        </div>
      </template>

      <section
        class="queue-panel"
        :class="{ 'is-dragging': dragDepth > 0 }"
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
              v-tooltip="t('pages.upload.taskQueue.clearFinishedHint')"
              type="secondary"
              :icon="ListXIcon"
              :disabled="actionsDisabled || !(taskQueueStatus.stats.completed + taskQueueStatus.stats.cancelled)"
              :text="t('pages.upload.taskQueue.clearFinished')"
              @click="clearFinishedTasks"
            />
            <button
              v-tooltip="t('pages.settings.title')"
              type="button"
              class="queue-icon-button"
              :aria-label="t('pages.settings.title')"
              :aria-expanded="showTaskSettings"
              aria-controls="upload-queue-settings"
              @click="showTaskSettings = !showTaskSettings"
            >
              <SettingsIcon :size="18" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div v-if="taskQueueStatus.stats.total" class="queue-overview">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="text-sm text-main">{{
              t('pages.upload.taskQueue.completedSummary', {
                completed: taskQueueStatus.stats.completed,
                total: taskQueueStatus.stats.total - taskQueueStatus.stats.cancelled,
              })
            }}</span>
            <span class="text-sm font-semibold text-accent tabular-nums">{{ taskQueueStatus.stats.progress }}%</span>
          </div>
          <div
            class="queue-progress"
            role="progressbar"
            :aria-label="t('pages.upload.taskQueue.overallProgress')"
            :aria-valuenow="taskQueueStatus.stats.progress"
            :aria-valuemin="0"
            :aria-valuemax="100"
          >
            <div :style="{ width: `${taskQueueStatus.stats.progress}%` }" />
          </div>
          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-secondary">
            <span v-if="taskQueueStatus.config.isPaused">{{ t('pages.upload.taskQueue.pauseHint') }}</span>
            <span v-else>{{
              t('pages.upload.taskQueue.intervalSummary', { seconds: taskQueueStatus.config.intervalS })
            }}</span>
            <div class="flex flex-wrap items-center gap-3 tabular-nums">
              <span
                v-if="
                  taskQueueStatus.config.isRunning &&
                  !taskQueueStatus.config.isPaused &&
                  taskQueueStatus.stats.avgSpeed > 0
                "
                >{{ formatSize(taskQueueStatus.stats.avgSpeed) }}/s</span
              >
              <span v-if="taskQueueStatus.stats.estimatedTimeMs > 0">{{
                t('pages.upload.taskQueue.timeRemaining', { time: formatTime(taskQueueStatus.stats.estimatedTimeMs) })
              }}</span>
              <span
                >{{ formatSize(taskQueueStatus.stats.transferredSize) }} /
                {{ formatSize(taskQueueStatus.stats.totalSize) }}</span
              >
            </div>
          </div>
        </div>

        <fieldset
          v-if="showTaskSettings"
          id="upload-queue-settings"
          class="queue-settings"
          :disabled="savingSettings || actionsDisabled"
        >
          <div>
            <label for="queue-interval">{{ t('pages.upload.taskQueue.interval') }}</label>
            <div class="flex items-center gap-2">
              <input
                id="queue-interval"
                v-model.number="settings.intervalS"
                type="number"
                min="0.1"
                max="99999"
                step="0.1"
                @change="updateSettings('intervalS')"
              />
              <span class="text-xs text-secondary">s</span>
            </div>
          </div>
          <div>
            <label for="queue-retries">{{ t('pages.upload.taskQueue.maxRetry') }}</label>
            <input
              id="queue-retries"
              v-model.number="settings.maxRetryCount"
              type="number"
              min="0"
              max="10"
              step="1"
              @change="updateSettings('maxRetryCount')"
            />
          </div>
          <label class="queue-toggle" for="queue-auto-start">
            <input
              id="queue-auto-start"
              v-model="settings.autoStart"
              type="checkbox"
              @change="updateSettings('autoStart')"
            />
            <span>{{ t('pages.upload.taskQueue.autoStart') }}</span>
          </label>
          <label class="queue-toggle" for="queue-pause-on-error">
            <input
              id="queue-pause-on-error"
              v-model="settings.pauseOnError"
              type="checkbox"
              @change="updateSettings('pauseOnError')"
            />
            <span>{{ t('pages.upload.taskQueue.pauseOnError') }}</span>
          </label>
        </fieldset>

        <div v-if="taskQueueStatus.stats.total" class="queue-filters">
          <label class="queue-search">
            <SearchIcon :size="16" class="shrink-0 text-secondary" aria-hidden="true" />
            <input
              v-model="taskSearchQuery"
              type="search"
              :aria-label="t('pages.upload.taskQueue.searchPlaceholder')"
              :placeholder="t('pages.upload.taskQueue.searchPlaceholder')"
            />
          </label>
          <div class="flex flex-wrap gap-1" role="group" :aria-label="t('pages.upload.taskQueue.filterLabel')">
            <button
              v-for="filter in taskFilters"
              :key="filter.value"
              type="button"
              class="queue-filter"
              :aria-pressed="taskFilter === filter.value"
              @click="taskFilter = filter.value"
            >
              {{ filter.label }} <span class="tabular-nums">{{ filter.count }}</span>
            </button>
          </div>
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
            <ListTodoIcon :size="36" class="text-accent" aria-hidden="true" />
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
                <CheckCircleIcon v-if="task.status === 'completed'" :size="20" />
                <CircleAlertIcon v-else-if="task.status === 'failed'" :size="20" />
                <LoaderCircleIcon
                  v-else-if="task.status === 'uploading'"
                  :size="20"
                  class="animate-spin motion-reduce:animate-none"
                />
                <FileIcon v-else :size="20" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-2">
                  <span v-tooltip="task.filePath" class="truncate text-sm font-medium text-main">{{
                    task.fileName
                  }}</span>
                  <StarIcon
                    v-if="task.priority === 2"
                    :size="13"
                    class="shrink-0 fill-warning text-warning"
                    :aria-label="t('pages.upload.taskQueue.highPriority')"
                  />
                </div>
                <div class="queue-row-details">
                  <span class="queue-task-status">{{ getTaskStatusText(task) }}</span>
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
                      :class="{ 'animate-upload-progress motion-reduce:animate-none': task.indeterminate }"
                      :style="{ width: task.indeterminate ? '35%' : `${task.progress}%` }"
                    />
                  </div>
                  <span v-if="!task.indeterminate" class="text-xs text-secondary tabular-nums"
                    >{{ task.progress }}%</span
                  >
                </div>
                <p v-if="task.error" class="queue-task-error">{{ task.error }}</p>
              </div>
              <div class="queue-row-actions">
                <template v-if="task.status === 'pending'">
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
                  <button
                    v-tooltip="t('pages.upload.taskQueue.togglePriority')"
                    type="button"
                    class="queue-icon-button"
                    :disabled="actionsDisabled"
                    :aria-pressed="task.priority === 2"
                    :aria-label="t('pages.upload.taskQueue.togglePriority')"
                    @click="toggleTaskPriority(task.id, task.priority)"
                  >
                    <StarIcon :size="16" />
                  </button>
                </template>
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
                  v-if="['completed', 'cancelled', 'failed'].includes(task.status)"
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
        <footer class="queue-footer">
          <span v-if="filteredTasks.length" class="text-xs text-secondary tabular-nums">{{
            t('pages.upload.taskQueue.showing', {
              from: (taskPage - 1) * pageSize + 1,
              to: Math.min(taskPage * pageSize, filteredTasks.length),
              total: filteredTasks.length,
            })
          }}</span>
          <span v-else class="text-xs text-secondary">{{ t('pages.upload.taskQueue.dropFiles') }}</span>
          <div class="flex items-center gap-2">
            <template v-if="pageCount > 1">
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
            </template>
            <button
              v-if="activeCount"
              type="button"
              class="queue-cancel"
              :disabled="actionsDisabled"
              @click="cancelAllTasks"
            >
              {{ t('pages.upload.taskQueue.cancelAll') }}
            </button>
          </div>
        </footer>
      </section>
    </CustomModal>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  FileIcon,
  ListTodoIcon,
  ListXIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from '@lucide/vue'
import { ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
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
watch([taskPage, taskFilter, taskSearchQuery], () => {
  taskList.value?.scrollTo({ top: 0 })
})
watch(taskDialogVisible, () => {
  dragDepth.value = 0
})

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
