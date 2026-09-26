import { checkpointSource, isRecord, retainTaskHistory } from '~/utils/taskCheckpoint'

export interface ManagementCheckpoint {
  uploadTaskQueue: IUploadTask[]
  downloadTaskQueue: IDownloadTask[]
}

const activeStatuses = ['queuing', 'uploading', 'downloading', 'paused']
const terminalStatuses = ['uploaded', 'downloaded', 'failed', 'canceled']
const safeReasons = [
  'interrupted',
  'file',
  'unsupported',
  'size',
  'memory',
  'provider',
  'aborted',
  'request',
  'timeout',
  'http',
  'response',
]

export const retainManagementHistory = <T extends IUploadTask | IDownloadTask>(tasks: T[]): T[] =>
  retainTaskHistory(
    tasks,
    task => terminalStatuses.includes(task.status),
    task => task.completedAt,
  )

// Explicit allowlist: SDK responses, clients, sourceConfig, reseumConfig, signed URLs and cancel tokens are runtime only.
export function managementTaskMetadata<T extends IUploadTask | IDownloadTask>(task: T): T {
  const metadata: Record<string, unknown> = {
    id: task.id,
    status: task.status,
    progress: ['uploaded', 'downloaded'].includes(task.status) ? 100 : 0,
  }
  for (const key of [
    'sourceFileName',
    'sourceFilePath',
    'targetFilePath',
    'targetFileBucket',
    'targetFileRegion',
    'provider',
    'accountId',
    'alias',
    'finishTime',
  ]) {
    if (typeof task[key] === 'string') metadata[key] = checkpointSource(task[key]) ?? ''
  }
  for (const key of ['createdAt', 'completedAt', 'interruptedAt']) {
    if (typeof task[key] === 'number' && Number.isFinite(task[key])) metadata[key] = task[key]
  }
  if (isRecord(task.response)) {
    metadata.response = {
      success: task.status === 'uploaded' || task.status === 'downloaded',
      ...(safeReasons.includes(task.response.reason) ? { reason: task.response.reason } : {}),
      ...(typeof task.response.skipped === 'boolean' ? { skipped: task.response.skipped } : {}),
    }
  }
  if (task.retryable === true) metadata.retryable = true
  return metadata as T
}

export function decodeManagementCheckpoint(value: unknown): ManagementCheckpoint {
  if (!isRecord(value) || !Array.isArray(value.uploadTaskQueue) || !Array.isArray(value.downloadTaskQueue)) {
    throw new Error('Invalid management checkpoint')
  }
  const restore = <T extends IUploadTask | IDownloadTask>(tasks: unknown[], upload: boolean): T[] => {
    const ids = new Set<string>()
    const statuses = [
      'queuing',
      'paused',
      'failed',
      'canceled',
      ...(upload ? ['uploading', 'uploaded'] : ['downloading', 'downloaded']),
    ]
    return retainManagementHistory(
      tasks.map(task => {
        if (
          !isRecord(task) ||
          typeof task.id !== 'string' ||
          !task.id ||
          !statuses.includes(task.status) ||
          ids.has(task.id) ||
          (upload && ['sourceFilePath', 'sourceFileName', 'targetFilePath'].some(key => typeof task[key] !== 'string'))
        ) {
          throw new Error('Invalid management task')
        }
        ids.add(task.id)
        const restored = managementTaskMetadata(task as T)
        if (activeStatuses.includes(task.status)) {
          restored.status = 'failed'
          restored.progress = 0
          restored.response = { success: false, reason: 'interrupted' }
          restored.retryable = true
          restored.interruptedAt = Date.now()
          restored.completedAt = restored.interruptedAt
          restored.finishTime = new Date(restored.interruptedAt).toLocaleString()
        } else {
          // Give legacy history without numeric timestamps a bounded lifetime.
          restored.completedAt ??= Date.now()
        }
        return restored
      }),
    )
  }
  return {
    uploadTaskQueue: restore<IUploadTask>(value.uploadTaskQueue, true),
    downloadTaskQueue: restore<IDownloadTask>(value.downloadTaskQueue, false),
  }
}
