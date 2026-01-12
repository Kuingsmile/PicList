<template>
  <div class="upload-container">
    <!-- Header Card -->
    <div class="upload-card header-card">
      <div class="card-header">
        <div class="provider-section">
          <button
            class="provider-button"
            :title="t('pages.upload.uploadViewHint')"
            @click="handlePicBedNameClick(picBedName)"
          >
            <div class="provider-info">
              <span class="provider-name">{{ picBedName }}</span>
              <span class="provider-config">{{ defaultConfigNameG || 'Default' }}</span>
            </div>
            <EditIcon :size="16" class="provider-arrow" />
          </button>
          <div
            class="add-favorite-button"
            :title="t('pages.upload.addToFavorites')"
            :class="{ disabled: favoritePicbeds.length >= MAX_FAVORITE_PICBEDS || isCurrentPicBedInFavorites }"
            @click="addCurrentPicbedToFavorites"
          >
            <PlusIcon :size="12" />
          </div>
          <transition-group
            name="badges-slide"
            tag="div"
            class="favorite-picbeds-container"
            :class="{ 'has-many': favoritePicbeds.length >= 4 }"
          >
            <button
              v-for="picbedType in favoritePicbeds"
              :key="picbedType.id"
              class="picbed-badge"
              :class="{ 'is-active': isCurrentPicbed(picbedType), 'show-delete': longPressedBadge === picbedType.id }"
              :title="t('pages.upload.longPressToRemoveFromFavorites') + getPicbedName(picbedType)"
              @click="handleBadgeClick(picbedType)"
              @mousedown="handleBadgeMouseDown(picbedType)"
              @mouseup="handleBadgeMouseUp"
              @mouseleave="handleBadgeMouseUp"
              @touchstart="handleBadgeTouchStart(picbedType, $event)"
              @touchend="handleBadgeTouchEnd"
              @touchcancel="handleBadgeTouchEnd"
            >
              <span class="badge-name">{{ getAbbreviatedName(picbedType) }}</span>
              <button
                v-if="longPressedBadge === picbedType.id"
                class="badge-remove"
                :title="t('pages.upload.removeFromFavorites')"
                @click.stop="removePicbedFromFavorites(picbedType)"
              >
                <XIcon :size="12" />
              </button>
            </button>
          </transition-group>
        </div>
        <div class="header-actions">
          <div class="segmented-button-group">
            <button
              class="segmented-button"
              :title="t('pages.upload.imageProcessNameSingle')"
              @click="handleImageProcessSingle"
            >
              <Settings :size="16" />
              <span>{{ t('pages.upload.imageProcessNameSingle') }}</span>
            </button>
            <button class="segmented-button" :title="t('pages.upload.imageProcessName')" @click="handleImageProcess">
              <span>{{ t('pages.upload.imageProcessName') }}</span>
            </button>
          </div>
          <button class="action-button" @click="handleChangePicBed">
            <ArrowLeftRightIcon :size="16" />
            <span>{{ t('pages.upload.changePicBed') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Upload Card -->
    <div class="upload-card main-card">
      <div
        id="upload-area"
        class="upload-zone"
        :class="{ 'drag-active': dragover }"
        @drop.prevent="onDrop"
        @dragover.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
        @click="openUploadWindow"
      >
        <div class="upload-content">
          <div class="upload-icon">
            <UploadCloudIcon :size="48" />
          </div>
          <div class="upload-text">
            <h3 class="upload-title">
              {{ t('pages.upload.dragFileToHere') }}
            </h3>
            <p class="upload-subtitle">
              {{ ' ' }}
            </p>
            <div class="upload-formats">
              <span class="format-label">{{ t('pages.upload.uploadHint') }}</span>
            </div>
          </div>
        </div>
        <input id="file-uploader" ref="fileInput" type="file" multiple style="display: none" @change="onChange" />
      </div>

      <!-- Progress Bar -->
      <transition name="progress">
        <div v-if="showProgress" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :class="{ 'progress-error': showError }" :style="{ width: `${progress}%` }" />
          </div>
          <span class="progress-text">
            {{ showError ? t('pages.upload.uploadFailed') : `${progress}%` }}
          </span>
        </div>
      </transition>
    </div>

    <!-- Quick Actions Card -->
    <div class="upload-card actions-card">
      <div class="card-header">
        <h4 class="card-title">
          {{ t('pages.upload.quickUpload') }}
        </h4>
      </div>
      <div class="quick-actions">
        <button class="quick-action-button" @click="uploadClipboardFiles">
          <ClipboardIcon :size="20" />
          <span>{{ t('pages.upload.clipboardPicture') }}</span>
        </button>
        <button class="quick-action-button" @click="uploadURLFiles">
          <LinkIcon :size="20" />
          <span>{{ t('pages.upload.urlUpload') }}</span>
        </button>
        <button
          class="quick-action-button"
          :class="{ 'has-badge': taskQueueStatus.tasks.length > 0 }"
          @click="openTaskDialog"
        >
          <ListTodoIcon :size="20" />
          <span>{{ t('pages.upload.taskUpload') }}</span>
          <span v-if="taskQueueStatus.tasks.length > 0" class="task-count-badge">
            {{ taskQueueStatus.tasks.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Settings Card -->
    <div class="upload-card settings-card">
      <div class="card-header">
        <h4 class="card-title">
          {{ t('pages.upload.linkFormat') }}
        </h4>
      </div>
      <div class="settings-content">
        <!-- Format Options -->
        <div class="setting-group">
          <label class="setting-label">{{ t('pages.upload.outputFormat') }}</label>
          <div class="format-buttons">
            <button
              v-for="(format, key) in pasteFormatList"
              :key="key"
              class="format-button"
              :class="{ active: pasteStyle === key }"
              :title="format"
              @click="updatePasteStyle(key)"
            >
              {{ key }}
            </button>
          </div>
        </div>

        <!-- URL Length Options -->
        <div class="setting-group">
          <label class="setting-label">{{ t('pages.upload.urlType.title') }}</label>
          <div class="url-toggle">
            <button class="toggle-button" :class="{ active: !useShortUrl }" @click="updateUrlType(false)">
              <span>{{ t('pages.upload.urlType.normal') }}</span>
            </button>
            <button class="toggle-button" :class="{ active: useShortUrl }" @click="updateUrlType(true)">
              <span>{{ t('pages.upload.urlType.short') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Process Dialog -->
    <transition name="modal">
      <div v-if="imageProcessDialogVisible" class="modal-overlay" @click.stop>
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              {{ t('pages.imageProcess.title') }}
            </h3>
            <span class="modal-subtitle">
              {{
                PicBedId === '' ? t('pages.imageProcess.subtitle-Global') : t('pages.imageProcess.subtitle-PerPicbed')
              }}
            </span>
            <button class="modal-close" @click="imageProcessDialogVisible = false">
              <XIcon :size="20" />
            </button>
          </div>
          <div class="modal-content">
            <ImageProcessSetting :config-id="PicBedId" :current-picbed-name="defaultPicBedG" />
          </div>
        </div>
      </div>
    </transition>

    <!-- Task Queue Manager Modal -->
    <transition name="modal">
      <div v-if="taskDialogVisible" class="modal-overlay" @click="taskDialogVisible = false">
        <div class="modal-container task-queue-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-text">
              <h3 class="modal-title">
                <ListTodoIcon :size="22" />
                {{ t('pages.upload.taskQueue.title') }}
              </h3>
              <span class="modal-subtitle">
                {{
                  t('pages.upload.taskQueue.stats', {
                    completed: taskQueueStatus.stats.completed,
                    total: taskQueueStatus.stats.total,
                  })
                }}
              </span>
            </div>
            <button class="modal-close" @click="taskDialogVisible = false">
              <XIcon :size="20" />
            </button>
          </div>

          <div class="modal-content task-queue-content">
            <!-- Action Bar -->
            <div class="task-action-bar">
              <div class="action-bar-left">
                <button class="action-btn primary" @click="addFilesToTask">
                  <PlusIcon :size="16" />
                  {{ t('pages.upload.taskQueue.addFiles') }}
                </button>
                <button
                  v-if="!taskQueueStatus.config.isRunning && taskQueueStatus.stats.pending > 0"
                  class="action-btn success"
                  @click="startTaskQueue"
                >
                  <PlayIcon :size="16" />
                  {{ t('pages.upload.taskQueue.start') }}
                </button>
                <button
                  v-if="taskQueueStatus.config.isRunning && !taskQueueStatus.config.isPaused"
                  class="action-btn warning"
                  @click="pauseTaskQueue"
                >
                  <PauseIcon :size="16" />
                  {{ t('pages.upload.taskQueue.pause') }}
                </button>
                <button v-if="taskQueueStatus.config.isPaused" class="action-btn success" @click="resumeTaskQueue">
                  <PlayIcon :size="16" />
                  {{ t('pages.upload.taskQueue.resume') }}
                </button>
              </div>
              <div class="action-bar-right">
                <button v-if="taskQueueStatus.stats.failed > 0" class="action-btn" @click="retryAllFailedTasks">
                  <RefreshCwIcon :size="16" />
                  {{ t('pages.upload.taskQueue.retryAllFailed') }}
                </button>
                <button
                  v-if="taskQueueStatus.config.isRunning || taskQueueStatus.stats.pending > 0"
                  class="action-btn danger"
                  @click="cancelAllTasks"
                >
                  <XIcon :size="16" />
                  {{ t('pages.upload.taskQueue.cancelAll') }}
                </button>
                <button
                  v-if="
                    taskQueueStatus.stats.completed > 0 ||
                    taskQueueStatus.stats.failed > 0 ||
                    taskQueueStatus.stats.cancelled > 0
                  "
                  class="action-btn"
                  @click="clearFinishedTasks"
                >
                  <Trash2Icon :size="16" />
                  {{ t('pages.upload.taskQueue.clearFinished') }}
                </button>
                <button
                  class="action-btn"
                  :class="{ active: showTaskSettings }"
                  @click="showTaskSettings = !showTaskSettings"
                >
                  <SettingsIcon :size="16" />
                </button>
              </div>
            </div>

            <!-- Overall Progress -->
            <div v-if="taskQueueStatus.stats.total > 0" class="overall-progress">
              <div class="progress-info">
                <span class="progress-label">{{ t('pages.upload.taskQueue.overallProgress') }}</span>
                <span class="progress-percentage">{{ overallProgressPercent }}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" :style="{ width: `${overallProgressPercent}%` }" />
              </div>
              <div class="progress-details">
                <span v-if="taskQueueStatus.stats.avgSpeed > 0" class="progress-detail-item">
                  <ZapIcon :size="14" />
                  {{ formatSpeed(taskQueueStatus.stats.avgSpeed) }}
                </span>
                <span
                  v-if="taskQueueStatus.stats.estimatedTimeMs > 0 && taskQueueStatus.config.isRunning"
                  class="progress-detail-item"
                >
                  <ClockIcon :size="14" />
                  {{ formatTime(taskQueueStatus.stats.estimatedTimeMs) }}
                </span>
                <span class="progress-detail-item">
                  <HardDriveIcon :size="14" />
                  {{ formatSize(taskQueueStatus.stats.completedSize) }} /
                  {{ formatSize(taskQueueStatus.stats.totalSize) }}
                </span>
              </div>
            </div>

            <!-- Settings Panel -->
            <transition name="settings-slide">
              <div v-if="showTaskSettings" class="settings-panel">
                <div class="settings-grid">
                  <div class="setting-item">
                    <label class="setting-label">
                      <TimerIcon :size="14" />
                      {{ t('pages.upload.taskQueue.interval') }}
                    </label>
                    <div class="input-with-unit">
                      <input
                        v-model.number="uploadInterval"
                        type="number"
                        min="0.1"
                        max="99999"
                        step="0.1"
                        class="setting-input"
                        :disabled="taskQueueStatus.config.isRunning"
                        @change="updateInterval"
                      />
                      <span class="input-unit">s</span>
                    </div>
                  </div>
                  <div class="setting-item">
                    <label class="setting-label">{{ t('pages.upload.taskQueue.maxRetry') }}</label>
                    <input
                      v-model.number="maxRetryCount"
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      class="setting-input"
                      @change="updateSettings"
                    />
                  </div>
                  <div class="setting-item toggle-item">
                    <label class="setting-label" for="task-auto-start">
                      {{ t('pages.upload.taskQueue.autoStart') }}
                    </label>
                    <input
                      id="task-auto-start"
                      v-model="autoStart"
                      type="checkbox"
                      class="setting-checkbox"
                      @change="updateSettings"
                    />
                  </div>
                  <div class="setting-item toggle-item">
                    <label class="setting-label" for="task-pause-on-error">
                      {{ t('pages.upload.taskQueue.pauseOnError') }}
                    </label>
                    <input
                      id="task-pause-on-error"
                      v-model="pauseOnError"
                      type="checkbox"
                      class="setting-checkbox"
                      @change="updateSettings"
                    />
                  </div>
                </div>
              </div>
            </transition>

            <!-- Filter & Search Bar -->
            <div v-if="taskQueueStatus.tasks.length > 0" class="filter-search-bar">
              <div class="search-box">
                <SearchIcon :size="16" />
                <input
                  v-model="taskSearchQuery"
                  type="text"
                  class="search-input"
                  :placeholder="t('pages.upload.taskQueue.searchPlaceholder')"
                />
              </div>
              <div class="filter-tabs">
                <button class="filter-tab" :class="{ active: taskFilter === 'all' }" @click="taskFilter = 'all'">
                  {{ t('pages.upload.taskQueue.filterAll') }}
                </button>
                <button
                  class="filter-tab"
                  :class="{ active: taskFilter === 'pending' }"
                  @click="taskFilter = 'pending'"
                >
                  {{ t('pages.upload.taskQueue.filterPending') }}
                </button>
                <button
                  class="filter-tab"
                  :class="{ active: taskFilter === 'completed' }"
                  @click="taskFilter = 'completed'"
                >
                  {{ t('pages.upload.taskQueue.filterCompleted') }}
                </button>
                <button class="filter-tab" :class="{ active: taskFilter === 'failed' }" @click="taskFilter = 'failed'">
                  {{ t('pages.upload.taskQueue.filterFailed') }}
                </button>
              </div>
            </div>

            <!-- Task List -->
            <div v-if="taskQueueStatus.tasks.length > 0" class="task-list-container">
              <TransitionGroup name="task" tag="div" class="task-list">
                <div
                  v-for="task in filteredTasks"
                  :key="task.id"
                  class="task-item"
                  :class="getTaskStatusClass(task.status)"
                >
                  <div class="task-content">
                    <div class="task-header-row">
                      <div class="task-name">
                        <span class="task-filename" :title="task.filePath">{{ task.fileName }}</span>
                        <span v-if="task.priority === 2" class="priority-badge">
                          <StarIcon :size="12" />
                        </span>
                      </div>
                      <div class="task-status-badge" :class="getTaskStatusClass(task.status)">
                        {{ getTaskStatusText(task.status) }}
                      </div>
                    </div>
                    <div class="task-meta-row">
                      <span v-if="task.fileSize > 0" class="task-meta-item">
                        <HardDriveIcon :size="12" />
                        {{ formatSize(task.fileSize) }}
                      </span>
                      <span v-if="task.uploadSpeed && task.status === 'uploading'" class="task-meta-item">
                        <ZapIcon :size="12" />
                        {{ formatSpeed(task.uploadSpeed) }}
                      </span>
                      <span v-if="task.retryCount > 0" class="task-meta-item retry">
                        {{ t('pages.upload.taskQueue.retryCount', { count: task.retryCount }) }}
                      </span>
                      <span v-if="task.error" class="task-meta-item error" :title="task.error">
                        {{ task.error }}
                      </span>
                    </div>
                  </div>
                  <div class="task-actions">
                    <!-- Pending task actions -->
                    <template v-if="task.status === 'pending'">
                      <button
                        class="task-icon-btn"
                        :title="t('pages.upload.taskQueue.moveUp')"
                        @click="moveTaskUp(task.id)"
                      >
                        <ChevronUpIcon :size="16" />
                      </button>
                      <button
                        class="task-icon-btn"
                        :title="t('pages.upload.taskQueue.moveDown')"
                        @click="moveTaskDown(task.id)"
                      >
                        <ChevronDownIcon :size="16" />
                      </button>
                      <button
                        class="task-icon-btn priority"
                        :class="{ 'is-high': task.priority === 2 }"
                        :title="t('pages.upload.taskQueue.togglePriority')"
                        @click="toggleTaskPriority(task.id, task.priority)"
                      >
                        <StarIcon :size="16" />
                      </button>
                      <button
                        class="task-icon-btn danger"
                        :title="t('pages.upload.taskQueue.cancelTask')"
                        @click="cancelTask(task.id)"
                      >
                        <XIcon :size="16" />
                      </button>
                    </template>
                    <!-- Failed task actions -->
                    <template v-if="task.status === 'failed'">
                      <button
                        class="task-icon-btn"
                        :title="t('pages.upload.taskQueue.retryTask')"
                        @click="retryTask(task.id)"
                      >
                        <RefreshCwIcon :size="16" />
                      </button>
                      <button
                        class="task-icon-btn danger"
                        :title="t('pages.upload.taskQueue.removeTask')"
                        @click="removeTask(task.id)"
                      >
                        <Trash2Icon :size="16" />
                      </button>
                    </template>
                    <!-- Completed/Cancelled task actions -->
                    <template v-if="task.status === 'completed' || task.status === 'cancelled'">
                      <button
                        class="task-icon-btn"
                        :title="t('pages.upload.taskQueue.removeTask')"
                        @click="removeTask(task.id)"
                      >
                        <Trash2Icon :size="16" />
                      </button>
                    </template>
                    <!-- Status icon -->
                    <div class="task-status-icon">
                      <CheckCircleIcon v-if="task.status === 'completed'" :size="18" class="icon-success" />
                      <XCircleIcon v-if="task.status === 'failed'" :size="18" class="icon-error" />
                      <LoaderIcon v-if="task.status === 'uploading'" :size="18" class="icon-loading spinning" />
                      <ClockIcon v-if="task.status === 'pending'" :size="18" class="icon-pending" />
                    </div>
                  </div>
                </div>
              </TransitionGroup>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <ListTodoIcon :size="48" />
              <h4>{{ t('pages.upload.taskQueue.empty') }}</h4>
              <p>{{ t('pages.upload.taskQueue.emptyHint') }}</p>
              <button class="action-btn primary" @click="addFilesToTask">
                <PlusIcon :size="16" />
                {{ t('pages.upload.taskQueue.selectFiles') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'
import {
  ArrowLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  ClockIcon,
  EditIcon,
  HardDriveIcon,
  LinkIcon,
  ListTodoIcon,
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Settings,
  SettingsIcon,
  StarIcon,
  TimerIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
  XIcon,
  ZapIcon,
} from 'lucide-vue-next'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import { PICBEDS_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { isUrl } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { useDragEventListeners } from '@/utils/drag'
import { IPasteStyle, IRPCActionType } from '@/utils/enum'

// Task queue types
interface IUploadTaskItem {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  status: string
  progress: number
  error?: string
  result?: any
  createdAt: number
  startedAt?: number
  completedAt?: number
  retryCount: number
  priority: number
  uploadSpeed?: number
  uploadDuration?: number
}

interface IUploadTaskQueueStatus {
  tasks: IUploadTaskItem[]
  config: {
    intervalS: number
    isRunning: boolean
    isPaused: boolean
    autoStart: boolean
    pauseOnError: boolean
    maxRetryCount: number
  }
  stats: {
    total: number
    pending: number
    completed: number
    failed: number
    cancelled: number
    uploading: number
    totalSize: number
    completedSize: number
    avgSpeed: number
    estimatedTimeMs: number
  }
}

useDragEventListeners()
const $router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { picBedG, defaultPicBedG, defaultConfigNameG, defaultIdG, updatePicBeds } = usePicBed()

const imageProcessDialogVisible = ref(false)
const taskDialogVisible = ref(false)
const useShortUrl = ref(false)
const dragover = ref(false)
const progress = ref(0)
const showProgress = ref(false)
const showError = ref(false)
const pasteStyle = ref(IPasteStyle.MARKDOWN)
const PicBedId = ref('')
const fileInput = useTemplateRef('fileInput')
const uploadInterval = ref(1000)

const favoritePicbeds = useStorage<IFavoritePicbedItem[]>('favorite-picbeds', [])
const MAX_FAVORITE_PICBEDS = 6
const longPressedBadge = ref<string | null>(null)
let longPressTimer: NodeJS.Timeout | null = null
const LONG_PRESS_DURATION = 500
const isCurrentPicBedInFavorites = computed(() => {
  const result = favoritePicbeds.value.some(item => item.id === defaultIdG.value)
  return result
})

// New task queue settings
const showTaskSettings = useStorage('upload-task-queue-show-settings', true)
const taskSearchQuery = ref('')
const taskFilter = ref<'all' | 'pending' | 'completed' | 'failed'>('all')
const autoStart = ref(false)
const pauseOnError = ref(false)
const maxRetryCount = ref(3)

// Task queue status
const taskQueueStatus = reactive<IUploadTaskQueueStatus>({
  tasks: [],
  config: {
    intervalS: 1,
    isRunning: false,
    isPaused: false,
    autoStart: false,
    pauseOnError: false,
    maxRetryCount: 3,
  },
  stats: {
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    uploading: 0,
    totalSize: 0,
    completedSize: 0,
    avgSpeed: 0,
    estimatedTimeMs: 0,
  },
})

// Computed properties
const filteredTasks = computed(() => {
  let tasks = taskQueueStatus.tasks

  if (taskFilter.value !== 'all') {
    tasks = tasks.filter(t => t.status === taskFilter.value)
  }

  if (taskSearchQuery.value) {
    const query = taskSearchQuery.value.toLowerCase()
    tasks = tasks.filter(t => t.fileName.toLowerCase().includes(query))
  }

  return tasks
})

const overallProgressPercent = computed(() => {
  if (taskQueueStatus.stats.total === 0) return 0
  const completed = taskQueueStatus.stats.completed
  const total = taskQueueStatus.stats.total - taskQueueStatus.stats.cancelled
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

const picBedName = computed(() => {
  if (!picBedG.value || picBedG.value.length === 0) {
    return ''
  }
  const target = picBedG.value.find(item => item.type === defaultPicBedG.value)
  return target ? target.name : defaultPicBedG.value
})

const pasteFormatList = ref<Record<string, string>>({
  [IPasteStyle.MARKDOWN]: '![alt](url)',
  [IPasteStyle.HTML]: '<img src="url"/>',
  [IPasteStyle.URL]: 'http://test.com/test.png',
  [IPasteStyle.UBB]: '[img]url[/img]',
  [IPasteStyle.CUSTOM]: '',
})

function syncPicBedHandler(): void {
  updatePicBeds()
}

let removeUploadProgressListenerCallback: () => void = () => {}
let removeSyncPicBedListenerCallback: () => void = () => {}

function uploadProgressHandler(p: number): void {
  if (p !== -1) {
    showProgress.value = true
    progress.value = p
  } else {
    progress.value = 100
    showError.value = true
  }
}

const handleImageProcess = () => {
  PicBedId.value = ''
  imageProcessDialogVisible.value = true
}

const handleImageProcessSingle = () => {
  PicBedId.value = defaultIdG.value
  imageProcessDialogVisible.value = true
}

watch(progress, onProgressChange)

function onProgressChange(val: number) {
  if (val === 100) {
    setTimeout(() => {
      showProgress.value = false
      showError.value = false
    }, 1000)
    setTimeout(() => {
      progress.value = 0
    }, 1200)
  }
}

async function handlePicBedNameClick(_picBedName: string) {
  const currentPicBedConfig = ((await getConfig<any[]>(`uploader.${defaultPicBedG.value}`)) as any) || {}
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: defaultPicBedG.value,
      configId: defaultIdG.value,
    },
    query: {
      defaultConfigId: currentPicBedConfig.defaultId || '',
    },
  })
}

function onDrop(e: DragEvent) {
  dragover.value = false

  // send files first
  if (e.dataTransfer?.files?.length) {
    ipcSendFiles(e.dataTransfer.files)
  } else if (e.dataTransfer?.items) {
    const items = e.dataTransfer.items
    if (items.length === 2 && items[0].type === 'text/uri-list') {
      handleURLDrag(items, e.dataTransfer)
    } else if (items[0].type === 'text/plain') {
      const str = e.dataTransfer.getData(items[0].type)
      if (isUrl(str)) {
        window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: str }])
      } else {
        message.error(t('pages.upload.dragValidPictureOrUrl'))
      }
    }
  }
}

function handleURLDrag(items: DataTransferItemList, dataTransfer: DataTransfer) {
  const urlString = dataTransfer.getData(items[1].type)
  const urlMatch = urlString.match(/<img.*src="(.*?)"/)
  if (urlMatch) {
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
      {
        path: urlMatch[1],
      },
    ])
  } else {
    message.error(t('pages.upload.dragValidPictureOrUrl'))
  }
}

function openUploadWindow() {
  fileInput.value?.click()
}

function onChange(e: any) {
  ipcSendFiles(e.target.files)
  ;(fileInput.value as HTMLInputElement).value = ''
}

function ipcSendFiles(files: FileList) {
  const sendFiles: IFileWithPath[] = []
  Array.from(files).forEach(item => {
    const obj = {
      name: item.name,
      path: window.electron.showFilePath(item),
    }
    sendFiles.push(obj)
  })
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, sendFiles)
}

async function getPasteStyle() {
  pasteStyle.value = (await getConfig(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  pasteFormatList.value.Custom = (await getConfig(configPaths.settings.customLink)) || '![$fileName]($url)'
}

async function getUseShortUrl() {
  useShortUrl.value = (await getConfig(configPaths.settings.useShortUrl)) || false
}

function updatePasteStyle(style: string) {
  pasteStyle.value = style
  saveConfig({
    [configPaths.settings.pasteStyle]: style || IPasteStyle.MARKDOWN,
  })
}

function updateUrlType(shortUrl: boolean) {
  useShortUrl.value = shortUrl
  saveConfig({
    [configPaths.settings.useShortUrl]: shortUrl,
  })
}

async function valideFavoritePicbeds() {
  if (!favoritePicbeds.value.length) return
  const allUploaders = (await getConfig<IStringKeyMap>(configPaths.uploader)) || {}

  const availableFavorites = favoritePicbeds.value.filter(item => {
    return (
      Object.keys(allUploaders).includes(item.type) &&
      allUploaders[item.type]?.configList.some((cfg: any) => cfg._id === item.id && cfg._configName === item.configName)
    )
  })
  if (JSON.stringify(availableFavorites) !== JSON.stringify(favoritePicbeds.value)) {
    favoritePicbeds.value = availableFavorites
  }
}

watch(favoritePicbeds, valideFavoritePicbeds, { immediate: true })

function addCurrentPicbedToFavorites() {
  favoritePicbeds.value.push({
    id: defaultIdG.value,
    type: defaultPicBedG.value,
    configName: defaultConfigNameG.value,
  })
  message.success(t('pages.upload.picbedAddedToFavorites'))
}

function removePicbedFromFavorites(picbedType: IFavoritePicbedItem) {
  const index = favoritePicbeds.value.findIndex(
    item => item.type === picbedType.type && item.id === picbedType.id && item.configName === picbedType.configName,
  )
  if (index === -1) return
  favoritePicbeds.value.splice(index, 1)
}

async function switchToPicbed(picbedType: IFavoritePicbedItem) {
  if (!picbedType.id || !picbedType.type || !picbedType.configName) {
    return
  }
  const uploaders = (await getConfig<IStringKeyMap>(`uploader.${picbedType.type}`)) || {}
  const targetConfig = uploaders?.configList.find(
    (cfg: any) => cfg._id === picbedType.id && cfg._configName === picbedType.configName,
  )
  if (!targetConfig) {
    return
  }
  saveConfig({
    [`uploader.${picbedType.type}.defaultId`]: picbedType.id,
    [`picBed.${picbedType.type}`]: targetConfig,
    [configPaths.picBed.current]: picbedType.type,
    [configPaths.picBed.uploader]: picbedType.type,
  })
  await updatePicBeds()
  const name = getPicbedName(picbedType).split('-')[0]
  window.electron.sendRPC(IRPCActionType.TRAY_SET_TOOL_TIP, `${name} ${targetConfig._configName}`)
  message.success(t('pages.upload.picbedSwitched', { name: getPicbedName(picbedType) }))
}

function getPicbedName(picbedType: IFavoritePicbedItem): string {
  if (!picBedG.value || picBedG.value.length === 0) {
    return picbedType.configName
  }
  const target = picBedG.value.find(item => item.type === picbedType.type)
  return `${target ? target.name : picbedType.type}-${picbedType.configName}`
}

const truncatePart = (part: string): string => {
  let partCount = 0
  let res = ''
  for (const char of part) {
    const isDoubleByte = char.charCodeAt(0) > 127
    const nextCount = partCount + (isDoubleByte ? 2 : 1)
    if (nextCount > 4) {
      return res
    }
    res += char
    partCount = nextCount
  }
  return res
}

function getAbbreviatedName(picbedType: IFavoritePicbedItem): string {
  const name = getPicbedName(picbedType)
  return name.split('-').map(truncatePart).join('-')
}

function isCurrentPicbed(picbedType: IFavoritePicbedItem): boolean {
  return defaultIdG.value === picbedType.id
}

function handleBadgeClick(picbedType: IFavoritePicbedItem) {
  if (longPressedBadge.value === picbedType.id) {
    return
  }
  if (isCurrentPicbed(picbedType)) {
    return
  }
  switchToPicbed(picbedType)
}

function handleBadgeMouseDown(picbedType: IFavoritePicbedItem) {
  longPressTimer = setTimeout(() => {
    longPressedBadge.value = picbedType.id
  }, LONG_PRESS_DURATION)
}

function handleBadgeMouseUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  setTimeout(() => {
    longPressedBadge.value = null
  }, 10000)
}

function handleBadgeTouchStart(picbedType: IFavoritePicbedItem, event: TouchEvent) {
  longPressTimer = setTimeout(() => {
    longPressedBadge.value = picbedType.id
    event.preventDefault()
  }, LONG_PRESS_DURATION)
}

function handleBadgeTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  setTimeout(() => {
    longPressedBadge.value = null
  }, 10000)
}

function uploadClipboardFiles() {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE)
}

async function uploadURLFiles() {
  const str = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(str) ? str : '',
    title: t('pages.upload.inputUrlTip'),
    placeholder: t('pages.upload.httpPrefixTip') + '\n' + t('pages.upload.multipleUrlsHint'),
    multiLine: true,
  })
}

function handleInputBoxValue(val: string) {
  if (val === '') return

  const urls = val
    .split('\n')
    .map(url => url.trim())
    .filter(url => url !== '')

  if (urls.length === 0) return

  const invalidUrls: string[] = []
  const validUrls: string[] = []

  urls.forEach(url => {
    if (isUrl(url)) {
      validUrls.push(url)
    } else {
      invalidUrls.push(url)
    }
  })

  if (invalidUrls.length > 0) {
    const errorMessage =
      invalidUrls.length === 1
        ? t('pages.upload.inputValidUrl') + ': ' + invalidUrls[0]
        : t('pages.upload.invalidUrlsFound', {
            count: invalidUrls.length,
            urls: invalidUrls.slice(0, 3).join(', ') + (invalidUrls.length > 3 ? '...' : ''),
          })
    message.error(errorMessage)
  }

  if (validUrls.length > 0) {
    const filesToUpload = validUrls.map(url => ({ path: url }))
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, filesToUpload)

    if (validUrls.length > 1) {
      message.success(t('pages.upload.uploadingMultipleUrls', { count: validUrls.length }))
    }
  }
}

async function handleChangePicBed() {
  window.electron.sendRPC(IRPCActionType.SHOW_UPLOAD_PAGE_MENU)
}

function openTaskDialog() {
  taskDialogVisible.value = true
  refreshTaskStatus()
}

async function refreshTaskStatus() {
  const status = await window.electron.triggerRPC<IUploadTaskQueueStatus>(IRPCActionType.UPLOAD_TASK_GET_STATUS)
  if (status) {
    Object.assign(taskQueueStatus, status)
    uploadInterval.value = status.config.intervalS
    autoStart.value = status.config.autoStart
    pauseOnError.value = status.config.pauseOnError
    maxRetryCount.value = status.config.maxRetryCount
  }
}

async function addFilesToTask() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      const files: IFileWithPath[] = Array.from(target.files).map(file => ({
        name: file.name,
        path: window.electron.showFilePath(file),
      }))

      await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_ADD, files)
      await refreshTaskStatus()
      message.success(t('pages.upload.taskQueue.filesAdded', { count: files.length }))
    }
  }
  input.click()
}

async function startTaskQueue() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_START, uploadInterval.value)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.started'))
}

async function pauseTaskQueue() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_PAUSE)
  await refreshTaskStatus()
  message.info(t('pages.upload.taskQueue.paused'))
}

async function resumeTaskQueue() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_RESUME)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.resumed'))
}

async function cancelAllTasks() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_CANCEL_ALL)
  await refreshTaskStatus()
  message.info(t('pages.upload.taskQueue.allCancelled'))
}

async function cancelTask(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_CANCEL_ONE, taskId)
  await refreshTaskStatus()
}

async function removeTask(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_REMOVE_ONE, taskId)
  await refreshTaskStatus()
}

async function clearFinishedTasks() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_CLEAR_FINISHED)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.cleared'))
}

async function updateInterval() {
  uploadInterval.value = Math.max(100, Math.min(60000, uploadInterval.value))
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_SET_INTERVAL, uploadInterval.value)
}

async function retryTask(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_RETRY_ONE, taskId)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.taskRetried'))
}

async function retryAllFailedTasks() {
  const count = await window.electron.triggerRPC<number>(IRPCActionType.UPLOAD_TASK_RETRY_ALL_FAILED)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.retriedAllFailed', { count }))
}

async function moveTaskUp(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_MOVE_UP, taskId)
  await refreshTaskStatus()
}

async function moveTaskDown(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_MOVE_DOWN, taskId)
  await refreshTaskStatus()
}

async function toggleTaskPriority(taskId: string, currentPriority: number) {
  const newPriority = currentPriority === 2 ? 1 : 2
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_SET_PRIORITY, taskId, newPriority)
  await refreshTaskStatus()
}

async function updateSettings() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_UPDATE_SETTINGS, {
    intervalS: uploadInterval.value,
    autoStart: autoStart.value,
    pauseOnError: pauseOnError.value,
    maxRetryCount: maxRetryCount.value,
  })
}

// Helper functions
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatSpeed(bytesPerSecond: number): string {
  return formatSize(bytesPerSecond) + '/s'
}

function formatTime(ms: number): string {
  if (ms < 1000) return '< 1s'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

function getTaskStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'status-pending',
    uploading: 'status-uploading',
    completed: 'status-completed',
    failed: 'status-failed',
    cancelled: 'status-cancelled',
  }
  return statusMap[status] || ''
}

function getTaskStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: t('pages.upload.taskQueue.statusPending'),
    uploading: t('pages.upload.taskQueue.statusUploading'),
    completed: t('pages.upload.taskQueue.statusCompleted'),
    failed: t('pages.upload.taskQueue.statusFailed'),
    cancelled: t('pages.upload.taskQueue.statusCancelled'),
  }
  return statusMap[status] || status
}

function taskQueueUpdateHandler(status: IUploadTaskQueueStatus) {
  Object.assign(taskQueueStatus, status)
  uploadInterval.value = status.config.intervalS
}

let removeTaskQueueUpdateListenerCallback: () => void = () => {}

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  removeUploadProgressListenerCallback()
  removeSyncPicBedListenerCallback()
  removeTaskQueueUpdateListenerCallback()
})

onBeforeMount(async () => {
  removeUploadProgressListenerCallback = window.electron.ipcRendererOn('uploadProgress', uploadProgressHandler)
  removeSyncPicBedListenerCallback = window.electron.ipcRendererOn('syncPicBed', syncPicBedHandler)
  removeTaskQueueUpdateListenerCallback = window.electron.ipcRendererOn('uploadTaskQueueUpdate', taskQueueUpdateHandler)
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
  await Promise.all([getUseShortUrl(), getPasteStyle(), refreshTaskStatus()])
})
</script>

<script lang="ts">
export default {
  name: 'UploadPage',
}
</script>

<style scoped src="./css/UploadPage.css"></style>
