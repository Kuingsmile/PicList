import { useStorage } from '@vueuse/core'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useMessage from '@/composables/useMessage'
import { getUploadFiles } from '@/utils/uploadFiles'
import { IRPCActionType } from '#/constants/rpcActions'

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

const taskStatusClasses: Record<string, string> = {
  pending: 'status-pending',
  uploading: 'status-uploading',
  completed: 'status-completed',
  failed: 'status-failed',
  cancelled: 'status-cancelled',
}

const taskStatusLabels: Record<string, string> = {
  pending: 'pages.upload.taskQueue.statusPending',
  uploading: 'pages.upload.taskQueue.statusUploading',
  completed: 'pages.upload.taskQueue.statusCompleted',
  failed: 'pages.upload.taskQueue.statusFailed',
  cancelled: 'pages.upload.taskQueue.statusCancelled',
}

export function useUploadTaskQueue() {
  const { t } = useI18n()
  const message = useMessage()
  const taskDialogVisible = ref(false)
  const uploadInterval = ref(1000)
  const showTaskSettings = useStorage('upload-task-queue-show-settings', true)
  const taskSearchQuery = ref('')
  const taskFilter = ref('all')
  const autoStart = ref(false)
  const pauseOnError = ref(false)
  const maxRetryCount = ref(3)
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
  let removeTaskQueueListener: () => void = () => {}

  const filteredTasks = computed(() => {
    let tasks = taskQueueStatus.tasks
    if (taskFilter.value !== 'all') {
      tasks = tasks.filter(task => task.status === taskFilter.value)
    }
    if (taskSearchQuery.value) {
      const query = taskSearchQuery.value.toLowerCase()
      tasks = tasks.filter(task => task.fileName.toLowerCase().includes(query))
    }
    return tasks
  })

  const overallProgressPercent = computed(() => {
    const { completed, total, cancelled } = taskQueueStatus.stats
    if (total === 0) return 0
    const activeTotal = total - cancelled
    return activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : 0
  })

  function applyTaskStatus(status: IUploadTaskQueueStatus) {
    Object.assign(taskQueueStatus, status)
    uploadInterval.value = status.config.intervalS
  }

  async function refreshTaskStatus() {
    const status = await window.electron.triggerRPC<IUploadTaskQueueStatus>(IRPCActionType.UPLOAD_TASK_GET_STATUS)
    if (!status) return
    applyTaskStatus(status)
    // Only explicit refreshes replace the remaining settings being edited in the dialog.
    autoStart.value = status.config.autoStart
    pauseOnError.value = status.config.pauseOnError
    maxRetryCount.value = status.config.maxRetryCount
  }

  async function runTaskAction<T>(action: string, ...args: unknown[]) {
    const result = await window.electron.triggerRPC<T>(action, ...args)
    await refreshTaskStatus()
    return result
  }

  function openTaskDialog() {
    taskDialogVisible.value = true
    refreshTaskStatus()
  }

  async function handleTaskFileSelection(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    const files = getUploadFiles(input.files)
    await runTaskAction(IRPCActionType.UPLOAD_TASK_ADD, files)
    message.success(t('pages.upload.taskQueue.filesAdded', { count: files.length }))
  }

  async function addFilesToTask() {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = handleTaskFileSelection
    input.click()
  }

  async function startTaskQueue() {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_START, uploadInterval.value)
    message.success(t('pages.upload.taskQueue.started'))
  }

  async function pauseTaskQueue() {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_PAUSE)
    message.info(t('pages.upload.taskQueue.paused'))
  }

  async function resumeTaskQueue() {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_RESUME)
    message.success(t('pages.upload.taskQueue.resumed'))
  }

  async function cancelAllTasks() {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_CANCEL_ALL)
    message.info(t('pages.upload.taskQueue.allCancelled'))
  }

  async function cancelTask(taskId: string) {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_CANCEL_ONE, taskId)
  }

  async function removeTask(taskId: string) {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_REMOVE_ONE, taskId)
  }

  async function clearFinishedTasks() {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_CLEAR_FINISHED)
    message.success(t('pages.upload.taskQueue.cleared'))
  }

  async function updateInterval() {
    await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_SET_INTERVAL, uploadInterval.value)
  }

  async function retryTask(taskId: string) {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_RETRY_ONE, taskId)
    message.success(t('pages.upload.taskQueue.taskRetried'))
  }

  async function retryAllFailedTasks() {
    const count = await runTaskAction<number>(IRPCActionType.UPLOAD_TASK_RETRY_ALL_FAILED)
    message.success(t('pages.upload.taskQueue.retriedAllFailed', { count }))
  }

  async function moveTaskUp(taskId: string) {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_MOVE_UP, taskId)
  }

  async function moveTaskDown(taskId: string) {
    await runTaskAction(IRPCActionType.UPLOAD_TASK_MOVE_DOWN, taskId)
  }

  async function toggleTaskPriority(taskId: string, currentPriority: number) {
    const newPriority = currentPriority === 2 ? 1 : 2
    await runTaskAction(IRPCActionType.UPLOAD_TASK_SET_PRIORITY, taskId, newPriority)
  }

  async function updateSettings() {
    await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_UPDATE_SETTINGS, {
      intervalS: uploadInterval.value,
      autoStart: autoStart.value,
      pauseOnError: pauseOnError.value,
      maxRetryCount: maxRetryCount.value,
    })
  }

  function getTaskStatusClass(status: string): string {
    return taskStatusClasses[status] || ''
  }

  function getTaskStatusText(status: string): string {
    const label = taskStatusLabels[status]
    return label ? t(label) : status
  }

  onBeforeMount(() => {
    removeTaskQueueListener = window.electron.ipcRendererOn('uploadTaskQueueUpdate', applyTaskStatus)
  })

  onBeforeUnmount(() => {
    removeTaskQueueListener()
  })

  return {
    taskDialogVisible,
    uploadInterval,
    showTaskSettings,
    taskSearchQuery,
    taskFilter,
    autoStart,
    pauseOnError,
    maxRetryCount,
    taskQueueStatus,
    filteredTasks,
    overallProgressPercent,
    openTaskDialog,
    refreshTaskStatus,
    addFilesToTask,
    startTaskQueue,
    pauseTaskQueue,
    resumeTaskQueue,
    cancelAllTasks,
    cancelTask,
    removeTask,
    clearFinishedTasks,
    updateInterval,
    retryTask,
    retryAllFailedTasks,
    moveTaskUp,
    moveTaskDown,
    toggleTaskPriority,
    updateSettings,
    getTaskStatusClass,
    getTaskStatusText,
  }
}
