import { useStorage } from '@vueuse/core'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useMessage from '@/composables/useMessage'
import { getUploadFiles } from '@/utils/uploadFiles'
import { UPLOAD_TASK_QUEUE_UPDATE } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import type { UploadTask, UploadTaskQueueConfig, UploadTaskQueueStatus } from '#/types/uploadTask'
import { getUploadTaskStats } from '#/utils/uploadTask'

const statusLabels = {
  pending: 'statusPending',
  uploading: 'statusUploading',
  completed: 'statusCompleted',
  failed: 'statusFailed',
  cancelled: 'statusCancelled',
  paused: 'paused',
} as const

export function useUploadTaskQueue() {
  const { t } = useI18n()
  const message = useMessage()
  const taskDialogVisible = ref(false)
  const showTaskSettings = useStorage('upload-task-queue-show-settings', false)
  const taskSearchQuery = ref('')
  const taskFilter = ref('all')
  const taskPage = ref(1)
  const pageSize = 50
  const pendingAction = ref('')
  const isLoading = ref(true)
  const statusError = ref(false)
  const savingSettings = ref(false)
  const config: UploadTaskQueueConfig = {
    intervalS: 1,
    isRunning: false,
    isPaused: false,
    autoStart: false,
    pauseOnError: false,
    maxRetryCount: 3,
  }
  const taskQueueStatus = reactive<UploadTaskQueueStatus>({
    revision: -1,
    tasks: [],
    config,
    stats: getUploadTaskStats([], config),
  })
  const settings = reactive({ intervalS: 1, autoStart: false, pauseOnError: false, maxRetryCount: 3 })
  type Setting = keyof typeof settings
  let removeTaskQueueListener: () => void = () => {}

  const filteredTasks = computed(() => {
    const query = taskSearchQuery.value.trim().toLocaleLowerCase()
    const order = { uploading: 0, pending: 1, paused: 1, failed: 2, completed: 3, cancelled: 4 }
    return taskQueueStatus.tasks
      .filter(
        task =>
          (taskFilter.value === 'all' || task.status === taskFilter.value) &&
          (!query || task.fileName.toLocaleLowerCase().includes(query)),
      )
      .sort((a, b) => order[a.status] - order[b.status])
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(filteredTasks.value.length / pageSize)))
  const visibleTasks = computed(() =>
    filteredTasks.value.slice((taskPage.value - 1) * pageSize, taskPage.value * pageSize),
  )
  const activeCount = computed(() => taskQueueStatus.stats.pending + taskQueueStatus.stats.uploading)
  const retryableCount = computed(() => taskQueueStatus.tasks.filter(canRetryTask).length)
  const actionsDisabled = computed(() => isLoading.value || statusError.value || !!pendingAction.value)
  const queueState = computed(() => {
    if (taskQueueStatus.config.isPaused) return taskQueueStatus.stats.uploading ? 'pausing' : 'paused'
    if (taskQueueStatus.config.isRunning) return 'running'
    if (taskQueueStatus.stats.pending) return 'ready'
    if (taskQueueStatus.stats.failed) return 'needsAttention'
    return taskQueueStatus.stats.completed ? 'statusCompleted' : 'idle'
  })
  const queueStateLabel = computed(() => t(`pages.upload.taskQueue.${queueState.value}`))
  const taskFilters = computed(() =>
    (['all', 'uploading', 'pending', 'failed', 'completed', 'cancelled'] as const).map(status => ({
      value: status,
      label: t(`pages.upload.taskQueue.filter${status.charAt(0).toUpperCase() + status.slice(1)}`),
      count: status === 'all' ? taskQueueStatus.stats.total : taskQueueStatus.stats[status],
    })),
  )
  const pendingPositions = computed(() => {
    const tasks = taskQueueStatus.tasks.filter(task => task.status === 'pending')
    return new Map(
      tasks.map((task, index) => [
        task.id,
        {
          up: index > 0 && tasks[index - 1].priority === task.priority,
          down: index < tasks.length - 1 && tasks[index + 1].priority === task.priority,
        },
      ]),
    )
  })

  watch([taskSearchQuery, taskFilter], () => {
    taskPage.value = 1
  })
  watch(pageCount, count => {
    taskPage.value = Math.min(taskPage.value, count)
  })

  function applyTaskStatus(status: UploadTaskQueueStatus) {
    if (status.revision < taskQueueStatus.revision) return
    // Live progress must not replace a setting while the user is editing it.
    for (const key of Object.keys(settings) as Setting[]) {
      if (settings[key] === taskQueueStatus.config[key]) Object.assign(settings, { [key]: status.config[key] })
    }
    Object.assign(taskQueueStatus, status)
    statusError.value = false
  }

  async function refreshTaskStatus() {
    try {
      const status = await window.electron.triggerRPC<UploadTaskQueueStatus>(IRPCActionType.UPLOAD_TASK_GET_STATUS)
      if (!status) throw new Error('Queue unavailable')
      applyTaskStatus(status)
    } catch {
      statusError.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function runTaskAction<T>(action: string, args: unknown[] = [], success?: (result: T) => string) {
    if (actionsDisabled.value) return
    pendingAction.value = action
    try {
      const result = await window.electron.triggerRPC<T>(action, ...args)
      if (result === undefined) throw new Error('Missing queue acknowledgement')
      await refreshTaskStatus()
      if (result === false) message.info(t('pages.upload.taskQueue.taskChanged'))
      else if (success) message.success(success(result))
      return result
    } catch {
      message.error(t('pages.upload.taskQueue.actionFailed'))
    } finally {
      pendingAction.value = ''
    }
  }

  function openTaskDialog() {
    taskDialogVisible.value = true
    void refreshTaskStatus()
  }

  async function addTaskFiles(files: FileList) {
    if (!files.length) return
    try {
      await runTaskAction<UploadTask[]>(IRPCActionType.UPLOAD_TASK_ADD, [getUploadFiles(files)], result =>
        t('pages.upload.taskQueue.filesAdded', { count: result.length }),
      )
    } catch {
      message.error(t('pages.upload.taskQueue.actionFailed'))
    }
  }

  function addFilesToTask() {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = () => {
      if (input.files) void addTaskFiles(input.files)
    }
    input.click()
  }

  function canRetryTask(task: UploadTask) {
    return (
      task.status === 'failed' && (!task.sourceRequired || task.remoteCompleted || task.failureStage === 'finalization')
    )
  }

  async function updateSettings(key: Setting) {
    if (savingSettings.value) return
    const value = settings[key]
    if (key === 'intervalS' || key === 'maxRetryCount') {
      if (typeof value !== 'number' || !Number.isFinite(value)) settings[key] = taskQueueStatus.config[key]
      else
        settings[key] =
          key === 'intervalS' ? Math.max(0.1, Math.min(99999, value)) : Math.max(0, Math.min(10, Math.floor(value)))
    }
    savingSettings.value = true
    try {
      const saved = await window.electron.triggerRPC<UploadTaskQueueConfig>(
        IRPCActionType.UPLOAD_TASK_UPDATE_SETTINGS,
        { [key]: settings[key] },
      )
      if (!saved) throw new Error('Missing settings acknowledgement')
      Object.assign(settings, { [key]: saved[key] })
      await refreshTaskStatus()
    } catch {
      Object.assign(settings, { [key]: taskQueueStatus.config[key] })
      message.error(t('pages.upload.taskQueue.actionFailed'))
    } finally {
      savingSettings.value = false
    }
  }

  function getTaskStatusText(task: UploadTask): string {
    if (task.status !== 'uploading') return t(`pages.upload.taskQueue.${statusLabels[task.status]}`)
    const phase = t(`pages.upload.progress.${task.phase || 'uploading'}`)
    return task.destination === 'secondary' ? `${t('pages.upload.progress.secondary')} · ${phase}` : phase
  }

  onBeforeMount(() => {
    removeTaskQueueListener = window.electron.ipcRendererOn(UPLOAD_TASK_QUEUE_UPDATE, applyTaskStatus)
    void refreshTaskStatus()
  })
  onBeforeUnmount(() => removeTaskQueueListener())

  return {
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
    startTaskQueue: () => runTaskAction(IRPCActionType.UPLOAD_TASK_START),
    pauseTaskQueue: () => runTaskAction(IRPCActionType.UPLOAD_TASK_PAUSE),
    resumeTaskQueue: () => runTaskAction(IRPCActionType.UPLOAD_TASK_RESUME),
    cancelAllTasks: () => runTaskAction(IRPCActionType.UPLOAD_TASK_CANCEL_ALL),
    cancelTask: (id: string) => runTaskAction(IRPCActionType.UPLOAD_TASK_CANCEL_ONE, [id]),
    removeTask: (id: string) => runTaskAction(IRPCActionType.UPLOAD_TASK_REMOVE_ONE, [id]),
    clearFinishedTasks: () => runTaskAction(IRPCActionType.UPLOAD_TASK_CLEAR_FINISHED),
    retryTask: (id: string) =>
      runTaskAction(IRPCActionType.UPLOAD_TASK_RETRY_ONE, [id], () => t('pages.upload.taskQueue.taskRetried')),
    retryAllFailedTasks: () =>
      runTaskAction<number>(IRPCActionType.UPLOAD_TASK_RETRY_ALL_FAILED, [], count =>
        t('pages.upload.taskQueue.retriedAllFailed', { count }),
      ),
    moveTaskUp: (id: string) => runTaskAction(IRPCActionType.UPLOAD_TASK_MOVE_UP, [id]),
    moveTaskDown: (id: string) => runTaskAction(IRPCActionType.UPLOAD_TASK_MOVE_DOWN, [id]),
    toggleTaskPriority: (id: string, priority: number) =>
      runTaskAction(IRPCActionType.UPLOAD_TASK_SET_PRIORITY, [id, priority === 2 ? 1 : 2]),
  }
}
