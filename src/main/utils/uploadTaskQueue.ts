import path from 'node:path'

import { GalleryDB } from '@core/datastore'
import { dataDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import uploader from 'apis/app/uploader'
import windowManager from 'apis/app/window/windowManager'
import { Notification, WebContents } from 'electron'
import fs from 'fs-extra'
import { cloneDeep } from 'lodash-es'
import { v4 as uuid } from 'uuid'

import { T as $t } from '~/i18n/index'
import { handleCopyUrl, handleUrlEncodeWithSetting } from '~/utils/common'
import { configPaths } from '~/utils/configPaths'
import { IPasteStyle, IWindowList } from '~/utils/enum'
import pasteTemplate from '~/utils/pasteTemplate'

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
  result?: IStringKeyMap
  createdAt: number
  startedAt?: number
  completedAt?: number
  retryCount: number
  priority: number
  uploadSpeed?: number // bytes per second
  uploadDuration?: number // seconds
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

  private webContents: WebContents | null = null
  private persistPath = path.join(dataDir(), 'taskQueue.json')
  private taskTimer: NodeJS.Timeout | null = null

  private constructor() {
    this.restore()
  }

  static getInstance(): UploadTaskQueueManager {
    if (!UploadTaskQueueManager.instance) {
      UploadTaskQueueManager.instance = new UploadTaskQueueManager()
    }
    return UploadTaskQueueManager.instance
  }

  setWebContents(webContents: WebContents): this {
    this.webContents = webContents
    return this
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

  addTasks(files: IFileWithPath[], priority: number = UploadTaskPriority.NORMAL): IUploadTaskItem[] {
    const newTasks: IUploadTaskItem[] = files.map(file => ({
      id: `task_${uuid()}`,
      fileName: file.name || path.basename(file.path),
      filePath: file.path,
      fileSize: this.getFileSize(file.path),
      status: UploadTaskStatus.PENDING,
      progress: 0,
      createdAt: Date.now(),
      retryCount: 0,
      priority,
    }))

    newTasks.forEach(task => {
      const insertIndex = this.taskQueue.findIndex(
        t => t.status === UploadTaskStatus.PENDING && t.priority < task.priority,
      )
      if (insertIndex === -1) {
        this.taskQueue.push(task)
      } else {
        this.taskQueue.splice(insertIndex, 0, task)
      }
    })

    this.persist()
    this.notifyTaskUpdate()

    if (this.config.autoStart && !this.config.isRunning) {
      this.startQueue()
    }

    return newTasks
  }

  async startQueue(intervalS?: number): Promise<void> {
    if (intervalS !== undefined) {
      this.config.intervalS = intervalS
    }

    if (this.config.isRunning) {
      return
    }

    this.config.isRunning = true
    this.config.isPaused = false
    this.persist()
    this.notifyTaskUpdate()

    await this.processNextTask()
  }

  private async processNextTask(): Promise<void> {
    if (!this.config.isRunning || this.config.isPaused) {
      return
    }

    const pendingTask = this.taskQueue.find(task => task.status === UploadTaskStatus.PENDING)

    if (!pendingTask) {
      this.config.isRunning = false
      this.persist()
      this.notifyTaskUpdate()
      this.showCompletionNotification()
      return
    }

    pendingTask.status = UploadTaskStatus.UPLOADING
    pendingTask.startedAt = Date.now()
    this.persist()
    this.notifyTaskUpdate()

    try {
      const result = await this.uploadSingleFile(pendingTask)

      pendingTask.status = UploadTaskStatus.COMPLETED
      pendingTask.progress = 100
      pendingTask.completedAt = Date.now()
      pendingTask.result = result

      if (pendingTask.startedAt && pendingTask.fileSize > 0) {
        pendingTask.uploadDuration = pendingTask.completedAt - pendingTask.startedAt
        pendingTask.uploadSpeed = Math.round((pendingTask.fileSize / pendingTask.uploadDuration) * 1000)
      }
    } catch (error: any) {
      pendingTask.error = error.message || 'Upload failed'
      pendingTask.completedAt = Date.now()

      if (pendingTask.retryCount < this.config.maxRetryCount) {
        pendingTask.retryCount++
        pendingTask.status = UploadTaskStatus.PENDING
        pendingTask.startedAt = undefined
        pendingTask.completedAt = undefined
        pendingTask.error = undefined
      } else {
        pendingTask.status = UploadTaskStatus.FAILED

        if (this.config.pauseOnError) {
          this.config.isPaused = true
          this.persist()
          this.notifyTaskUpdate()
          return
        }
      }
    }

    this.persist()
    this.notifyTaskUpdate()

    if (this.config.isRunning && !this.config.isPaused) {
      const pendingCount = this.taskQueue.filter(t => t.status === UploadTaskStatus.PENDING).length
      if (pendingCount > 0) {
        this.taskTimer = setTimeout(() => {
          this.processNextTask()
        }, this.config.intervalS * 1000)
      } else {
        this.config.isRunning = false
        this.persist()
        this.notifyTaskUpdate()
        this.showCompletionNotification()
      }
    }
  }

  private async uploadSingleFile(task: IUploadTaskItem): Promise<IStringKeyMap> {
    const win = windowManager.getAvailableWindow()
    const webContents = this.webContents || win?.webContents

    if (!webContents) {
      throw new Error('No webContents available for upload')
    }

    const input = [task.filePath]
    const rawInput = cloneDeep(input)

    const res = await uploader.setWebContents(webContents).uploadReturnCtx(input)
    const imgs = res[0] ? res[0] : false
    const backupImgs = res[1] ? res[1] : false

    if (imgs !== false && imgs.length > 0) {
      const pasteStyle = picgo.getConfig<string>(configPaths.settings.pasteStyle) || IPasteStyle.MARKDOWN
      const deleteLocalFile = picgo.getConfig<boolean>(configPaths.settings.deleteLocalFile) || false

      const img = imgs[0]

      if (deleteLocalFile && !task.filePath.startsWith('http')) {
        fs.remove(rawInput[0])
          .then(() => {
            picgo.log.info(`delete local file: ${rawInput[0]}`)
          })
          .catch((err: Error) => {
            picgo.log.error(err)
          })
      }

      const [pasteText, shortUrl] = await pasteTemplate(
        pasteStyle,
        img,
        picgo.getConfig<string>(configPaths.settings.customLink),
      )
      img.shortUrl = shortUrl

      const inserted = await GalleryDB.getInstance().insert(img)

      windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send('uploadFiles')
      if (windowManager.has(IWindowList.SETTING_WINDOW)) {
        windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
      }

      handleCopyUrl(pasteText)
      if (backupImgs && backupImgs.length > 0) {
        await GalleryDB.getInstance().insert(backupImgs[0])
        windowManager.get(IWindowList.TRAY_WINDOW)?.webContents?.send('uploadFiles')
        if (windowManager.has(IWindowList.SETTING_WINDOW)) {
          windowManager.get(IWindowList.SETTING_WINDOW)!.webContents?.send('updateGallery')
        }
      }

      return {
        url: handleUrlEncodeWithSetting(inserted.imgUrl!),
        fullResult: inserted,
      }
    }

    throw new Error('Upload failed - no result returned')
  }

  pauseQueue(): void {
    this.config.isPaused = true
    if (this.taskTimer) {
      clearTimeout(this.taskTimer)
      this.taskTimer = null
    }
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
    await this.processNextTask()
  }

  cancelQueue(): void {
    this.config.isRunning = false
    this.config.isPaused = false

    if (this.taskTimer) {
      clearTimeout(this.taskTimer)
      this.taskTimer = null
    }

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
    this.persist()
    this.notifyTaskUpdate()
  }

  getAllTasks(): IUploadTaskItem[] {
    return [...this.taskQueue]
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
      tasks: [...this.taskQueue],
      config: { ...this.config },
      stats,
    }
  }

  retryTask(taskId: string): boolean {
    const task = this.taskQueue.find(t => t.id === taskId)
    if (task && task.status === UploadTaskStatus.FAILED) {
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
    if (index < this.taskQueue.length - 1 && this.taskQueue[index].status === UploadTaskStatus.PENDING) {
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
      task.priority = priority
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
      this.config.intervalS = Math.max(0.1, settings.intervalS)
    }
    if (settings.autoStart !== undefined) {
      this.config.autoStart = settings.autoStart
    }
    if (settings.pauseOnError !== undefined) {
      this.config.pauseOnError = settings.pauseOnError
    }
    if (settings.maxRetryCount !== undefined) {
      this.config.maxRetryCount = Math.max(0, Math.min(10, settings.maxRetryCount))
    }
    this.persist()
    this.notifyTaskUpdate()
  }

  getSettings(): IUploadTaskQueueConfig {
    return { ...this.config }
  }

  setInterval(intervalS: number): void {
    this.config.intervalS = Math.max(0.1, intervalS) // Minimum 0.1 seconds
    this.persist()
    this.notifyTaskUpdate()
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
    const stats = {
      completed: this.taskQueue.filter(t => t.status === UploadTaskStatus.COMPLETED).length,
      failed: this.taskQueue.filter(t => t.status === UploadTaskStatus.FAILED).length,
    }

    if (stats.completed > 0 || stats.failed > 0) {
      const isShowResultNotification =
        picgo.getConfig<boolean | undefined>(configPaths.settings.uploadResultNotification) === undefined
          ? true
          : !!picgo.getConfig<boolean>(configPaths.settings.uploadResultNotification)

      if (isShowResultNotification) {
        const notification = new Notification({
          title: $t('UPLOAD_TASK_COMPLETED'),
          body: $t('UPLOAD_TASK_COMPLETED_BODY', { completed: stats.completed, failed: stats.failed }),
        })
        notification.show()
      }
    }
  }

  private notifyTaskUpdate(): void {
    const status = this.getQueueStatus()
    windowManager.get(IWindowList.SETTING_WINDOW)?.webContents?.send('uploadTaskQueueUpdate', status)
  }

  private persist(): void {
    try {
      fs.ensureFileSync(this.persistPath)
      fs.writeFileSync(
        this.persistPath,
        JSON.stringify(
          {
            taskQueue: this.taskQueue,
            config: this.config,
          },
          null,
          2,
        ),
      )
    } catch (e) {
      console.error('Failed to persist upload task queue:', e)
    }
  }

  private restore(): void {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = JSON.parse(fs.readFileSync(this.persistPath, { encoding: 'utf-8' }))
        if (data.taskQueue) {
          this.taskQueue = data.taskQueue.map((task: IUploadTaskItem) => ({
            ...task,
            fileSize: task.fileSize || 0,
            retryCount: task.retryCount || 0,
            priority: task.priority ?? UploadTaskPriority.NORMAL,
            status: task.status === UploadTaskStatus.UPLOADING ? UploadTaskStatus.PENDING : task.status,
          }))
        }
        if (data.config) {
          this.config = {
            ...this.config,
            intervalS: data.config.intervalS || 1,
            autoStart: data.config.autoStart || false,
            pauseOnError: data.config.pauseOnError || false,
            maxRetryCount: data.config.maxRetryCount ?? 3,
            isRunning: false,
            isPaused: false,
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore upload task queue:', e)
    }
  }
}

export default UploadTaskQueueManager
