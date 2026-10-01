import path from 'node:path'

import { dataDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'
import { Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import { v4 as uuid } from 'uuid'

import { IWindowList } from '~/constants'
import { t } from '~/i18n/index'
import { TaskCheckpoint } from '~/services/taskCheckpoint'
import {
  assertFinalizationStorageAvailable,
  createUploadFinalization,
  FinalizationStorageUnavailableError,
  finalizeUpload,
  isUploadFinalization,
  loadUploadFinalization,
  protectQueueFinalizations,
  saveUploadFinalization,
  type UploadFinalization,
} from '~/services/uploads/uploadFinalizer'
import { sendToWindow, UploadJob, UploadJobError } from '~/services/uploads/uploadJob'
import {
  decodeUploadCheckpoint,
  normalizeUploadInterval,
  retainUploadHistory,
  uploadTaskMetadata,
} from '~/services/uploads/uploadTaskMetadata'
import { configPaths } from '~/utils/configPaths'

export const UploadTaskStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PAUSED: 'paused',
}

export const UploadTaskPriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
}

export interface IUploadTaskItem {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  status: string
  progress: number
  error?: string
  failureStage?: 'transfer' | 'finalization'
  finalizationId?: string
  finalization?: UploadFinalization
  remoteCompleted?: boolean
  interrupted?: boolean
  sourceRequired?: boolean
  result?: IStringKeyMap
  createdAt: number
  startedAt?: number
  completedAt?: number
  retryCount: number
  priority: number
  uploadSpeed?: number // bytes per second
  uploadDuration?: number // milliseconds
}

export interface IUploadTaskQueueConfig {
  intervalS: number // Interval between uploads in seconds
  isRunning: boolean
  isPaused: boolean
  autoStart: boolean
  pauseOnError: boolean
  maxRetryCount: number
}

class UploadTaskQueueManager {
  private static instance: UploadTaskQueueManager

  private taskQueue: IUploadTaskItem[] = []
  private config: IUploadTaskQueueConfig = {
    intervalS: 1, // Default 1 second interval
    isRunning: false,
    isPaused: false,
    autoStart: false,
    pauseOnError: false,
    maxRetryCount: 3,
  }

  private taskOrigins = new Map<string, WebContents>()
  private activeJobs = new Map<string, UploadJob>()
  private checkpoint = new TaskCheckpoint({
    file: path.join(dataDir(), 'taskQueue.json'),
    decode: decodeUploadCheckpoint,
    snapshot: async () => {
      await this.migrateLegacyFinalizations()
      return {
        taskQueue: this.taskQueue.map(uploadTaskMetadata),
        config: {
          intervalS: this.config.intervalS,
          autoStart: this.config.autoStart,
          pauseOnError: this.config.pauseOnError,
          maxRetryCount: this.config.maxRetryCount,
        },
      }
    },
    onError: () => console.error('Upload task checkpoint unavailable'),
  })
  private legacyFinalizations = new Set<IUploadTaskItem>()
  private closing = false
  private taskTimer: NodeJS.Timeout | null = null
  private workerPromise: Promise<void> | null = null
  private wakeWorker: (() => void) | null = null
  private nextUploadAt = 0
  private generation = 0
  private progressTimer: NodeJS.Timeout | null = null
  private runResults = new Map<string, 'completed' | 'failed'>()

  private constructor() {
    this.restore()
  }

  static getInstance(): UploadTaskQueueManager {
    if (!UploadTaskQueueManager.instance) {
      UploadTaskQueueManager.instance = new UploadTaskQueueManager()
    }
    return UploadTaskQueueManager.instance
  }

  private getFileSize(filePath: string): number {
    try {
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return 0
      }
      const stats = fs.statSync(filePath)
      return stats.size
    } catch {
      return 0
    }
  }

  addTasks(
    files: IFileWithPath[],
    priority: number = UploadTaskPriority.NORMAL,
    origin?: WebContents,
  ): IUploadTaskItem[] {
    if (this.closing) return []
    const newTasks: IUploadTaskItem[] = files.map(file => ({
      id: `task_${uuid()}`,
      fileName: file.name || path.basename(file.path),
      filePath: file.path,
      fileSize: this.getFileSize(file.path),
      status: UploadTaskStatus.PENDING,
      progress: 0,
      createdAt: Date.now(),
      retryCount: 0,
      priority: Number.isFinite(priority) ? Math.max(0, Math.min(2, Math.floor(priority))) : UploadTaskPriority.NORMAL,
    }))

    if (!newTasks.length) return newTasks
    if (origin) newTasks.forEach(task => this.taskOrigins.set(task.id, origin))
    // A batch shares one priority. Insert once instead of scanning and splicing for every file.
    const insertIndex = this.taskQueue.findIndex(
      task => task.status === UploadTaskStatus.PENDING && task.priority < newTasks[0].priority,
    )
    this.taskQueue =
      insertIndex === -1
        ? [...this.taskQueue, ...newTasks]
        : [...this.taskQueue.slice(0, insertIndex), ...newTasks, ...this.taskQueue.slice(insertIndex)]

    this.persist()
    this.notifyTaskUpdate()

    if (this.config.autoStart && !this.config.isRunning) {
      void this.startQueue()
    } else if (this.config.isRunning) {
      this.ensureWorker()
    }

    return newTasks
  }

  async startQueue(intervalS?: number): Promise<void> {
    if (this.closing) return
    if (intervalS !== undefined) {
      this.setInterval(intervalS)
    }

    if (this.config.isRunning) {
      return
    }

    this.runResults.clear()
    this.config.isRunning = true
    this.config.isPaused = false
    this.persist()
    this.notifyTaskUpdate()

    // Queue controls acknowledge immediately; the worker owns the entire upload lifecycle.
    this.ensureWorker()
  }

  private ensureWorker(): void {
    this.wakeWorker?.()
    if (!this.workerPromise) {
      this.workerPromise = this.processQueue().finally(() => {
        this.workerPromise = null
        // A new start may arrive after the loop exits but before this cleanup runs.
        if (this.config.isRunning) this.ensureWorker()
      })
    }
  }

  private waitForWake(delay?: number): Promise<void> {
    return new Promise(resolve => {
      this.wakeWorker = () => {
        if (this.taskTimer) {
          clearTimeout(this.taskTimer)
          this.taskTimer = null
        }
        this.wakeWorker = null
        resolve()
      }
      if (delay !== undefined) {
        this.taskTimer = setTimeout(this.wakeWorker, delay)
      }
    })
  }

  private isTaskActive(task: IUploadTaskItem, generation: number): boolean {
    return generation === this.generation && task.status === UploadTaskStatus.UPLOADING && this.taskQueue.includes(task)
  }

  private async processQueue(): Promise<void> {
    while (this.config.isRunning) {
      if (this.config.isPaused) {
        await this.waitForWake()
        continue
      }

      const pendingTask = this.taskQueue.find(task => task.status === UploadTaskStatus.PENDING)
      if (!pendingTask) {
        this.config.isRunning = false
        this.persist()
        this.notifyTaskUpdate()
        this.showCompletionNotification()
        return
      }

      const delay = this.nextUploadAt - Date.now()
      if (delay > 0) {
        await this.waitForWake(delay)
        continue
      }

      const generation = this.generation
      pendingTask.status = UploadTaskStatus.UPLOADING
      pendingTask.startedAt = Date.now()
      this.persist()
      this.notifyTaskUpdate()

      try {
        const result = await this.uploadSingleFile(pendingTask, generation)
        if (!this.isTaskActive(pendingTask, generation)) continue

        pendingTask.status = UploadTaskStatus.COMPLETED
        pendingTask.progress = 100
        pendingTask.completedAt = Date.now()
        pendingTask.result = result
        pendingTask.error = undefined
        pendingTask.failureStage = undefined
        this.runResults.set(pendingTask.id, 'completed')

        if (pendingTask.startedAt && pendingTask.fileSize > 0) {
          pendingTask.uploadDuration = Math.max(1, pendingTask.completedAt - pendingTask.startedAt)
          pendingTask.uploadSpeed = Math.round((pendingTask.fileSize / pendingTask.uploadDuration) * 1000)
        }
      } catch (error) {
        if (!this.isTaskActive(pendingTask, generation)) continue
        pendingTask.failureStage =
          pendingTask.remoteCompleted || pendingTask.finalization || pendingTask.failureStage === 'finalization'
            ? 'finalization'
            : 'transfer'
        pendingTask.error =
          error instanceof FinalizationStorageUnavailableError
            ? error.message
            : pendingTask.failureStage === 'finalization'
              ? 'Upload finalization is incomplete or unavailable; retry will not upload again.'
              : pendingTask.sourceRequired
                ? 'The source must be selected again before retrying.'
                : 'Upload failed; retry is available.'
        pendingTask.completedAt = Date.now()

        if (
          pendingTask.retryCount < this.config.maxRetryCount &&
          !pendingTask.sourceRequired &&
          !(error instanceof FinalizationStorageUnavailableError)
        ) {
          pendingTask.retryCount++
          pendingTask.status = UploadTaskStatus.PENDING
          pendingTask.startedAt = undefined
          pendingTask.completedAt = undefined
          pendingTask.error = undefined
          pendingTask.progress = 0
        } else {
          pendingTask.status = UploadTaskStatus.FAILED
          this.runResults.set(pendingTask.id, 'failed')
          if (this.config.pauseOnError) this.config.isPaused = true
        }
      } finally {
        // Apply the interval after the desktop request settles, including cancellation.
        this.nextUploadAt = Date.now() + this.config.intervalS * 1000
      }

      this.persist()
      this.notifyTaskUpdate()
    }
  }

  private async uploadSingleFile(task: IUploadTaskItem, generation: number): Promise<IStringKeyMap | undefined> {
    const win = windowManager.getAvailableWindow()
    const origin = this.taskOrigins.get(task.id)
    const webContents = origin && !origin.isDestroyed() ? origin : win?.webContents
    let lastProgressAt = 0
    const job = new UploadJob({
      origin: webContents,
      onProgress: event => {
        if (event.status !== 'uploading' || !this.isTaskActive(task, generation)) return
        const progress = event.phase === 'finalizing' ? 99 : Math.max(0, Math.min(99, Math.floor(event.progress)))
        if (task.progress === progress) return
        task.progress = progress
        const now = Date.now()
        // Progress is transient; throttle renderer snapshots without writing task checkpoints.
        if (now - lastProgressAt >= 100) {
          lastProgressAt = now
          this.notifyTaskUpdate()
        } else if (!this.progressTimer) {
          this.progressTimer = setTimeout(
            () => {
              lastProgressAt = Date.now()
              this.notifyTaskUpdate()
            },
            100 - (now - lastProgressAt),
          )
          this.progressTimer.unref()
        }
      },
    })
    this.activeJobs.set(task.id, job)
    try {
      return await job.run(async () => {
        const assertActive = () => {
          job.throwIfStopped()
          if (!this.isTaskActive(task, generation)) throw new UploadJobError('cancelled')
        }
        // The journal may be newer than taskQueue.json if the queue checkpoint failed.
        if (task.finalizationId) {
          try {
            const saved = await loadUploadFinalization(task.finalizationId)
            if (saved && (!task.finalization || saved.revision > task.finalization.revision)) task.finalization = saved
          } catch {
            task.failureStage = 'finalization'
            throw new Error('Upload finalization is unavailable')
          }
        }
        assertActive()
        let contexts: IuploadReturnCtxResult | undefined
        if (!task.finalization) {
          if (task.remoteCompleted || task.failureStage === 'finalization') {
            throw new Error('The completed remote upload needs its finalization journal')
          }
          if (task.sourceRequired) throw new Error('The upload source must be selected again')
          assertFinalizationStorageAvailable()
          task.finalizationId = job.context.id
          // Commit the journal link before any remote side effect, even if the process dies during the upload.
          await this.flush()
          assertActive()
          contexts = await uploader.uploadReturnCtx([task.filePath], undefined, job)
          assertActive()
          task.finalization = createUploadFinalization(
            contexts,
            [task.filePath],
            { copy: true, notification: 'none' },
            task.finalizationId,
          )
        }
        task.remoteCompleted = true
        task.failureStage = 'finalization'
        task.interrupted = false
        // If writing the journal fails, recovery must still never fall back to a second remote upload.
        try {
          await saveUploadFinalization(task.finalization)
        } finally {
          await this.flush()
        }
        assertActive()
        const results = await finalizeUpload(task.finalization, {
          contexts,
          origin: webContents,
          assertActive,
        })
        return results[0]
      })
    } finally {
      this.activeJobs.delete(task.id)
    }
  }

  pauseQueue(): void {
    this.config.isPaused = true
    this.wakeWorker?.()
    this.persist()
    this.notifyTaskUpdate()
  }

  async resumeQueue(): Promise<void> {
    if (!this.config.isRunning) {
      await this.startQueue()
      return
    }

    this.config.isPaused = false
    this.persist()
    this.notifyTaskUpdate()
    this.ensureWorker()
  }

  cancelQueue(): void {
    this.generation++
    this.config.isRunning = false
    this.config.isPaused = false

    // Settle the desktop requests; late core results remain isolated to their cancelled jobs.
    this.activeJobs.forEach(job => job.cancel())
    this.wakeWorker?.()

    this.taskQueue.forEach(task => {
      if (task.status === UploadTaskStatus.PENDING || task.status === UploadTaskStatus.UPLOADING) {
        task.status = UploadTaskStatus.CANCELLED
        task.completedAt = Date.now()
      }
    })

    this.persist()
    this.notifyTaskUpdate()
  }

  cancelTask(taskId: string): boolean {
    const task = this.taskQueue.find(t => t.id === taskId)
    if (task && (task.status === UploadTaskStatus.PENDING || task.status === UploadTaskStatus.UPLOADING)) {
      this.activeJobs.get(taskId)?.cancel()
      task.status = UploadTaskStatus.CANCELLED
      task.completedAt = Date.now()
      this.persist()
      this.notifyTaskUpdate()
      return true
    }
    return false
  }

  removeTask(taskId: string): boolean {
    const index = this.taskQueue.findIndex(t => t.id === taskId)
    if (index !== -1) {
      this.activeJobs.get(taskId)?.cancel()
      this.taskOrigins.delete(taskId)
      this.taskQueue.splice(index, 1)
      this.persist()
      this.notifyTaskUpdate()
      return true
    }
    return false
  }

  clearFinishedTasks(): void {
    this.taskQueue = this.taskQueue.filter(
      task =>
        task.status === UploadTaskStatus.PENDING ||
        task.status === UploadTaskStatus.UPLOADING ||
        task.status === UploadTaskStatus.PAUSED,
    )
    this.persist()
    this.notifyTaskUpdate()
  }

  clearAllTasks(): void {
    this.cancelQueue()
    this.taskQueue = []
    this.taskOrigins.clear()
    this.persist()
    this.notifyTaskUpdate()
  }

  getAllTasks(): IUploadTaskItem[] {
    return this.taskQueue.map(({ finalization: _finalization, ...task }) => ({ ...task }))
  }

  getQueueStatus(): {
    tasks: IUploadTaskItem[]
    config: IUploadTaskQueueConfig
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
  } {
    const completedTasks = this.taskQueue.filter(t => t.status === UploadTaskStatus.COMPLETED)
    const pendingTasks = this.taskQueue.filter(t => t.status === UploadTaskStatus.PENDING)
    const uploadingTasks = this.taskQueue.filter(t => t.status === UploadTaskStatus.UPLOADING)

    const totalSize = this.taskQueue.reduce((sum, t) => sum + (t.fileSize || 0), 0)
    const completedSize = completedTasks.reduce((sum, t) => sum + (t.fileSize || 0), 0)

    const tasksWithSpeed = completedTasks.filter(t => t.uploadSpeed && t.uploadSpeed > 0)
    const avgSpeed =
      tasksWithSpeed.length > 0
        ? Math.round(tasksWithSpeed.reduce((sum, t) => sum + (t.uploadSpeed || 0), 0) / tasksWithSpeed.length)
        : 0

    const remainingSize =
      pendingTasks.reduce((sum, t) => sum + (t.fileSize || 0), 0) +
      uploadingTasks.reduce((sum, t) => sum + (t.fileSize || 0), 0)
    const estimatedTimeMs =
      avgSpeed > 0
        ? Math.round((remainingSize / avgSpeed) * 1000) + pendingTasks.length * this.config.intervalS * 1000
        : 0

    const stats = {
      total: this.taskQueue.length,
      pending: pendingTasks.length,
      completed: completedTasks.length,
      failed: this.taskQueue.filter(t => t.status === UploadTaskStatus.FAILED).length,
      cancelled: this.taskQueue.filter(t => t.status === UploadTaskStatus.CANCELLED).length,
      uploading: uploadingTasks.length,
      totalSize,
      completedSize,
      avgSpeed,
      estimatedTimeMs,
    }

    return {
      tasks: this.getAllTasks(),
      config: { ...this.config },
      stats,
    }
  }

  retryTask(taskId: string): boolean {
    const task = this.taskQueue.find(t => t.id === taskId)
    if (task && task.status === UploadTaskStatus.FAILED) {
      this.runResults.delete(taskId)
      task.status = UploadTaskStatus.PENDING
      task.retryCount = 0
      task.error = undefined
      task.startedAt = undefined
      task.completedAt = undefined
      task.progress = 0
      this.persist()
      this.notifyTaskUpdate()
      return true
    }
    return false
  }

  retryAllFailed(): number {
    let count = 0
    this.taskQueue.forEach(task => {
      if (task.status === UploadTaskStatus.FAILED) {
        this.runResults.delete(task.id)
        task.status = UploadTaskStatus.PENDING
        task.retryCount = 0
        task.error = undefined
        task.startedAt = undefined
        task.completedAt = undefined
        task.progress = 0
        count++
      }
    })
    if (count > 0) {
      this.persist()
      this.notifyTaskUpdate()
    }
    return count
  }

  moveTaskUp(taskId: string): boolean {
    const index = this.taskQueue.findIndex(t => t.id === taskId)
    if (index > 0 && this.taskQueue[index].status === UploadTaskStatus.PENDING) {
      let targetIndex = index - 1
      while (targetIndex >= 0 && this.taskQueue[targetIndex].status !== UploadTaskStatus.PENDING) {
        targetIndex--
      }
      if (targetIndex >= 0) {
        const temp = this.taskQueue[index]
        this.taskQueue[index] = this.taskQueue[targetIndex]
        this.taskQueue[targetIndex] = temp
        this.persist()
        this.notifyTaskUpdate()
        return true
      }
    }
    return false
  }

  moveTaskDown(taskId: string): boolean {
    const index = this.taskQueue.findIndex(t => t.id === taskId)
    if (index >= 0 && index < this.taskQueue.length - 1 && this.taskQueue[index].status === UploadTaskStatus.PENDING) {
      let targetIndex = index + 1
      while (targetIndex < this.taskQueue.length && this.taskQueue[targetIndex].status !== UploadTaskStatus.PENDING) {
        targetIndex++
      }
      if (targetIndex < this.taskQueue.length) {
        const temp = this.taskQueue[index]
        this.taskQueue[index] = this.taskQueue[targetIndex]
        this.taskQueue[targetIndex] = temp
        this.persist()
        this.notifyTaskUpdate()
        return true
      }
    }
    return false
  }

  setTaskPriority(taskId: string, priority: number): boolean {
    const task = this.taskQueue.find(t => t.id === taskId)
    if (task && task.status === UploadTaskStatus.PENDING) {
      task.priority = Number.isFinite(priority) ? Math.max(0, Math.min(2, Math.floor(priority))) : task.priority
      this.taskQueue.sort((a, b) => {
        if (a.status !== UploadTaskStatus.PENDING && b.status !== UploadTaskStatus.PENDING) return 0
        if (a.status !== UploadTaskStatus.PENDING) return 1
        if (b.status !== UploadTaskStatus.PENDING) return -1
        return b.priority - a.priority
      })
      this.persist()
      this.notifyTaskUpdate()
      return true
    }
    return false
  }

  updateSettings(settings: Partial<IUploadTaskQueueConfig>): void {
    if (settings.intervalS !== undefined) {
      this.updateInterval(settings.intervalS)
    }
    if (typeof settings.autoStart === 'boolean') {
      this.config.autoStart = settings.autoStart
    }
    if (typeof settings.pauseOnError === 'boolean') {
      this.config.pauseOnError = settings.pauseOnError
    }
    if (Number.isFinite(settings.maxRetryCount)) {
      this.config.maxRetryCount = Math.max(0, Math.min(10, Math.floor(settings.maxRetryCount!)))
    }
    this.persist()
    this.notifyTaskUpdate()
  }

  getSettings(): IUploadTaskQueueConfig {
    return { ...this.config }
  }

  setInterval(intervalS: number): void {
    this.updateInterval(intervalS)
    this.persist()
    this.notifyTaskUpdate()
  }

  private updateInterval(intervalS: number): void {
    const interval = normalizeUploadInterval(intervalS, this.config.intervalS)
    if (this.nextUploadAt) this.nextUploadAt += (interval - this.config.intervalS) * 1000
    this.config.intervalS = interval
    this.wakeWorker?.()
  }

  getInterval(): number {
    return this.config.intervalS
  }

  isRunning(): boolean {
    return this.config.isRunning
  }

  isPaused(): boolean {
    return this.config.isPaused
  }

  private showCompletionNotification(): void {
    // History can include previous runs or prune older rows in a large batch.
    // Notifications describe the run that just finished, independently of retained task history.
    const stats = { completed: 0, failed: 0 }
    for (const status of this.runResults.values()) stats[status]++

    if (stats.completed > 0 || stats.failed > 0) {
      const isShowResultNotification =
        picgo.getConfig<boolean | undefined>(configPaths.settings.uploadResultNotification) === undefined
          ? true
          : !!picgo.getConfig<boolean>(configPaths.settings.uploadResultNotification)

      if (isShowResultNotification) {
        const notification = new Notification({
          title: t('main.notification.uploadTaskComplete'),
          body: t('main.notification.taskSuccessMsg', { completed: stats.completed, failed: stats.failed }),
        })
        notification.show()
      }
    }
  }

  private notifyTaskUpdate(): void {
    if (this.progressTimer) {
      clearTimeout(this.progressTimer)
      this.progressTimer = null
    }
    const status = this.getQueueStatus()
    sendToWindow(windowManager.get(IWindowList.SETTING_WINDOW)?.webContents, 'uploadTaskQueueUpdate', status)
  }

  private persist(): void {
    this.taskQueue = retainUploadHistory(this.taskQueue)
    for (const task of this.legacyFinalizations) {
      if (!this.taskQueue.includes(task)) this.legacyFinalizations.delete(task)
    }
    const taskIds = new Set(this.taskQueue.map(task => task.id))
    for (const id of this.taskOrigins.keys()) {
      if (!taskIds.has(id)) this.taskOrigins.delete(id)
    }
    protectQueueFinalizations(this.taskQueue.flatMap(task => (task.finalizationId ? [task.finalizationId] : [])))
    this.checkpoint.schedule()
  }

  async flush(): Promise<void> {
    this.persist()
    await this.checkpoint.flush()
  }

  async shutdown(): Promise<void> {
    this.closing = true
    this.generation++
    this.config.isRunning = false
    this.config.isPaused = false
    this.wakeWorker?.()
    this.activeJobs.forEach(job => job.cancel())
    if (this.progressTimer) {
      clearTimeout(this.progressTimer)
      this.progressTimer = null
    }
    // Leave active work labelled as interrupted on recovery; shutting down is not user cancellation.
    await this.flush()
  }

  private async migrateLegacyFinalizations(): Promise<void> {
    for (const task of this.legacyFinalizations) {
      if (
        !isUploadFinalization(task.finalization) ||
        (task.finalizationId && task.finalization.id !== task.finalizationId)
      ) {
        throw new Error('Invalid legacy finalization')
      }
      task.finalizationId = task.finalization.id
      const saved = await loadUploadFinalization(task.finalizationId)
      if (saved && saved.revision > task.finalization.revision) task.finalization = saved
      await saveUploadFinalization(task.finalization)
      this.legacyFinalizations.delete(task)
    }
  }

  private restore(): void {
    const data = this.checkpoint.load()
    if (!data) return
    this.taskQueue = data.taskQueue
    this.config = { ...this.config, ...data.config, isRunning: false, isPaused: false }
    for (const task of this.taskQueue) {
      if (task.finalization) this.legacyFinalizations.add(task)
    }
    this.persist()
  }
}

export default UploadTaskQueueManager
