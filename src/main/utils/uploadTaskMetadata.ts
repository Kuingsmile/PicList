import path from 'node:path'

import { checkpointSource, isRecord, retainTaskHistory } from './taskCheckpoint'
import { isUploadFinalization } from './uploadFinalizer'
import type { IUploadTaskItem, IUploadTaskQueueConfig } from './uploadTaskQueue'

export interface UploadQueueCheckpoint {
  taskQueue: IUploadTaskItem[]
  config: Pick<IUploadTaskQueueConfig, 'intervalS' | 'autoStart' | 'pauseOnError' | 'maxRetryCount'>
}

export const retainUploadHistory = (tasks: IUploadTaskItem[]): IUploadTaskItem[] =>
  retainTaskHistory(
    tasks,
    task =>
      ['completed', 'cancelled', 'failed'].includes(task.status) &&
      !(task.status === 'failed' && (task.remoteCompleted || task.failureStage === 'finalization')),
    task => task.completedAt,
  )

export function uploadTaskMetadata(task: IUploadTaskItem): IUploadTaskItem {
  const filePath = checkpointSource(task.filePath) || ''
  let fileName = task.fileName
  if (/^https?:\/\//i.test(task.filePath)) {
    try {
      fileName = path.posix.basename(new URL(task.filePath).pathname) || 'download'
    } catch {
      fileName = 'download'
    }
  }
  return {
    id: task.id,
    fileName,
    filePath,
    fileSize: task.fileSize,
    status: task.status,
    progress: task.status === 'completed' ? 100 : 0,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    retryCount: task.retryCount,
    priority: task.priority,
    failureStage: task.failureStage,
    finalizationId: task.finalizationId,
    remoteCompleted: !!task.finalization || task.remoteCompleted,
    interrupted: task.interrupted,
    sourceRequired: !filePath || task.sourceRequired,
    // Raw provider errors, results (including fullResult.config), and finalization contexts never belong here.
  }
}

export function decodeUploadCheckpoint(value: unknown, legacy: boolean): UploadQueueCheckpoint {
  if (!isRecord(value) || !Array.isArray(value.taskQueue) || (value.config !== undefined && !isRecord(value.config))) {
    throw new Error('Invalid upload checkpoint')
  }
  const ids = new Set<string>()
  const number = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
  const taskQueue = value.taskQueue.map((task: unknown): IUploadTaskItem => {
    if (
      !isRecord(task) ||
      typeof task.id !== 'string' ||
      !task.id ||
      ids.has(task.id) ||
      typeof task.fileName !== 'string' ||
      typeof task.filePath !== 'string' ||
      !['pending', 'uploading', 'completed', 'failed', 'cancelled', 'paused'].includes(task.status) ||
      (task.finalizationId !== undefined &&
        (typeof task.finalizationId !== 'string' || !/^[\w-]+$/.test(task.finalizationId)))
    ) {
      throw new Error('Invalid upload task')
    }
    ids.add(task.id)
    const restored = uploadTaskMetadata({
      id: task.id,
      fileName: task.fileName,
      filePath: task.filePath,
      fileSize: number(task.fileSize, 0),
      status: task.status,
      progress: 0,
      createdAt: number(task.createdAt, Date.now()),
      completedAt: number(task.completedAt, Date.now()),
      retryCount: Math.min(10, Math.floor(number(task.retryCount, 0))),
      priority: Math.min(2, Math.floor(number(task.priority, 1))),
      failureStage: ['transfer', 'finalization'].includes(task.failureStage) ? task.failureStage : undefined,
      finalizationId: task.finalizationId,
      remoteCompleted: task.remoteCompleted === true || (legacy && task.finalization !== undefined),
      interrupted: task.interrupted === true,
      sourceRequired: task.sourceRequired === true,
    })
    if (legacy && task.finalization !== undefined) {
      // Migrate the legacy inline result to the journal before dropping it from the checkpoint.
      if (
        !isUploadFinalization(task.finalization) ||
        (task.finalizationId && task.finalizationId !== task.finalization.id)
      ) {
        throw new Error('Invalid legacy upload finalization')
      }
      restored.finalization = task.finalization
      restored.finalizationId = task.finalization.id
    }
    if (['pending', 'uploading', 'paused'].includes(task.status)) restored.completedAt = undefined
    if (['uploading', 'paused'].includes(task.status)) {
      restored.status = 'pending'
      restored.interrupted = true
    }
    if (restored.interrupted)
      restored.error = 'Interrupted; retry will restart the transfer or finish its saved remote result.'
    if (
      restored.sourceRequired &&
      !['completed', 'cancelled'].includes(restored.status) &&
      !restored.remoteCompleted &&
      !restored.finalizationId
    ) {
      restored.status = 'failed'
      restored.error = 'The source must be selected again before retrying.'
    }
    if (restored.status === 'failed' && !restored.error) {
      restored.error =
        restored.remoteCompleted || restored.failureStage === 'finalization'
          ? 'Remote upload completed; retry finalization without uploading again.'
          : 'Upload failed; retry is available.'
    }
    return restored
  })
  const config = value.config || {}
  return {
    taskQueue: retainUploadHistory(taskQueue),
    config: {
      intervalS: Math.max(0.1, number(config.intervalS, 1)),
      maxRetryCount: Math.min(10, Math.floor(number(config.maxRetryCount, 3))),
      autoStart: config.autoStart === true,
      pauseOnError: config.pauseOnError === true,
    },
  }
}
