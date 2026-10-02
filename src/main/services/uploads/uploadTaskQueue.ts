import path from 'node:path'

import { dataDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'
import { Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import { v4 as uuid } from 'uuid'

import type { UploadTask, UploadTaskQueueConfig, UploadTaskQueueStatus } from '#/types/uploadTask'
import { getUploadTaskStats } from '#/utils/uploadTask'
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
} as const

export const UploadTaskPriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
}

export interface IUploadTaskItem extends UploadTask {
  finalizationId?: string
  finalization?: UploadFinalization
  result?: IStringKeyMap
}

export type IUploadTaskQueueConfig = UploadTaskQueueConfig

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
  private statusRevision = 0

  private constructor() {
    this.restore()
  }

  static getInstance(): UploadTaskQueueManager {
    if (!UploadTaskQueueManager.instance) {
      UploadTaskQueueManager.instance = new UploadTaskQueueManager()
    }
    return UploadTaskQueueManager.instance
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return 0
      }
      const stats = await fs.stat(filePath)
      return stats.size
    } catch {
      return 0
    }
  }

  async addTasks(
    files: IFileWithPath[],
    priority: number = UploadTaskPriority.NORMAL,
    origin?: WebContents,
  ): Promise<UploadTask[]> {
    if (this.closing) return []
    if (!Array.isArray(files) || files.some(file => !file || typeof file.path !== 'string' || !file.path.trim())) {
      throw new Error('Invalid upload files')
    }
    const newTasks: IUploadTaskItem[] = []
    // Bound metadata IO for large selections without blocking the main process with synchronous stat calls.
    for (let offset = 0; offset < files.length; offset += 32) {
      const batch = await Promise.all(
        files.slice(offset, offset + 32).map(async file => ({
          id: `task_${uuid()}`,
          fileName: file.name || path.basename(file.path),
          filePath: file.path,
          fileSize: await this.getFileSize(file.path),
          status: UploadTaskStatus.PENDING,
          progress: 0,
          createdAt: Date.now(),
          retryCount: 0,
          priority: Number.isFinite(priority)
            ? Math.max(0, Math.min(2, Math.floor(priority)))
            : UploadTaskPriority.NORMAL,
        })),
      )
      if (this.closing) return []
      newTasks.push(...batch)
    }

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
      const pendingTask = this.taskQueue.find(task => task.status === UploadTaskStatus.PENDING)
      if (!pendingTask) {
        this.config.isRunning = false
        this.config.isPaused = false
        this.persist()
        this.notifyTaskUpdate()
        this.showCompletionNotification()
        return
      }

      if (this.config.isPaused) {
        await this.waitForWake()
        continue
      }

      const delay = this.nextUploadAt - Date.now()
      if (delay > 0) {
        await this.waitForWake(delay)
        continue
      }

      const generation = this.generation
      pendingTask.status = UploadTaskStatus.UPLOADING
      pendingTask.startedAt = Date.now()
      this.resetProgress(pendingTask)
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
          this.resetProgress(pendingTask)
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
    let speedSample = { bytes: 0, at: Date.now(), destination: 'primary' }
    const job = new UploadJob({
      origin: webContents,
      onProgress: event => {
        if (event.status !== 'uploading' || !this.isTaskActive(task, generation)) return
        const progress = event.phase === 'finalizing' ? 99 : Math.max(0, Math.min(99, Math.floor(event.progress)))
        task.progress = progress
        task.phase = event.phase
        task.indeterminate = event.indeterminate
        task.destination = event.destination
        task.transferredBytes = event.transferredBytes
        task.totalBytes = event.totalBytes
        const now = Date.now()
        if (event.destination !== speedSample.destination || (event.transferredBytes ?? 0) < speedSample.bytes) {
          speedSample = { bytes: 0, at: now, destination: event.destination || 'primary' }
          task.uploadSpeed = undefined
        }
        if (event.phase === 'uploading' && event.transferredBytes !== undefined && now - speedSample.at >= 250) {
          task.uploadSpeed = Math.round(((event.transferredBytes - speedSample.bytes) * 1000) / (now - speedSample.at))
          speedSample = { bytes: event.transferredBytes, at: now, destination: event.destination || 'primary' }
        } else if (event.phase !== 'uploading') {
          task.uploadSpeed = undefined
        }
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
    if (!this.config.isRunning) return
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
      this.wakeWorker?.()
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
      this.wakeWorker?.()
      this.persist()
      this.notifyTaskUpdate()
      return true
    }
    return false
  }

  clearFinishedTasks(): void {
    this.taskQueue = this.taskQueue.filter(
      task => task.status !== UploadTaskStatus.COMPLETED && task.status !== UploadTaskStatus.CANCELLED,
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

  getAllTasks(): UploadTask[] {
    return this.taskQueue.map(
      ({ finalization: _finalization, finalizationId: _finalizationId, result: _result, ...task }) => ({ ...task }),
    )
  }

  getQueueStatus(): UploadTaskQueueStatus {
    return {
      revision: this.statusRevision,
      tasks: this.getAllTasks(),
      config: { ...this.config },
      stats: getUploadTaskStats(this.taskQueue, this.config),
    }
  }

  private resetProgress(task: IUploadTaskItem): void {
    task.progress = 0
    task.phase = 'preparing'
    task.indeterminate = true
    task.destination = undefined
    task.transferredBytes = undefined
    task.totalBytes = undefined
    task.uploadSpeed = undefined
    task.uploadDuration = undefined
  }

  private prepareRetry(task: IUploadTaskItem): boolean {
    if (
      task.status !== UploadTaskStatus.FAILED ||
      (task.sourceRequired && !task.remoteCompleted && !task.finalizationId)
    )
      return false
    this.runResults.delete(task.id)
    task.status = UploadTaskStatus.PENDING
    task.retryCount = 0
    task.error = undefined
    task.startedAt = undefined
    task.completedAt = undefined
    this.resetProgress(task)
    return true
  }

  private restartAfterRetry(): void {
    this.sortPendingTasks()
    this.persist()
    this.notifyTaskUpdate()
    if (this.config.isRunning) this.ensureWorker()
    else if (this.config.autoStart) void this.startQueue()
  }

  retryTask(taskId: string): boolean {
    const task = this.taskQueue.find(t => t.id === taskId)
    if (task && this.prepareRetry(task)) {
      this.restartAfterRetry()
      return true
    }
    return false
  }

  retryAllFailed(): number {
    let count = 0
    this.taskQueue.forEach(task => {
      if (this.prepareRetry(task)) count++
    })
    if (count > 0) this.restartAfterRetry()
    return count
  }

  moveTaskUp(taskId: string): boolean {
    const index = this.taskQueue.findIndex(t => t.id === taskId)
    if (index > 0 && this.taskQueue[index].status === UploadTaskStatus.PENDING) {
      let targetIndex = index - 1
      while (targetIndex >= 0 && this.taskQueue[targetIndex].status !== UploadTaskStatus.PENDING) {
        targetIndex--
      }
      if (targetIndex >= 0 && this.taskQueue[targetIndex].priority === this.taskQueue[index].priority) {
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
      if (
        targetIndex < this.taskQueue.length &&
        this.taskQueue[targetIndex].priority === this.taskQueue[index].priority
      ) {
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

  private sortPendingTasks(): void {
    const pending = this.taskQueue
      .filter(task => task.status === UploadTaskStatus.PENDING)
      .sort((a, b) => b.priority - a.priority)
    let index = 0
    this.taskQueue = this.taskQueue.map(task => (task.status === UploadTaskStatus.PENDING ? pending[index++] : task))
  }

  setTaskPriority(taskId: string, priority: number): boolean {
    const task = this.taskQueue.find(t => t.id === taskId)
    if (task && task.status === UploadTaskStatus.PENDING) {
      task.priority = Number.isFinite(priority) ? Math.max(0, Math.min(2, Math.floor(priority))) : task.priority
      this.sortPendingTasks()
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
    this.statusRevision++
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
