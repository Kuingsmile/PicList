export type UploadTaskStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled' | 'paused'

// Renderer snapshots contain presentation data only, never provider results or configuration.
export interface UploadTask {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  status: UploadTaskStatus
  progress: number
  phase?: 'preparing' | 'uploading' | 'finalizing'
  indeterminate?: boolean
  destination?: 'primary' | 'secondary'
  transferredBytes?: number
  totalBytes?: number | null
  error?: string
  failureStage?: 'transfer' | 'finalization'
  remoteCompleted?: boolean
  interrupted?: boolean
  sourceRequired?: boolean
  createdAt: number
  startedAt?: number
  completedAt?: number
  retryCount: number
  priority: number
  uploadSpeed?: number
  uploadDuration?: number
}

export interface UploadTaskQueueConfig {
  intervalS: number
  isRunning: boolean
  isPaused: boolean
  autoStart: boolean
  pauseOnError: boolean
  maxRetryCount: number
}

export interface UploadTaskQueueStats {
  total: number
  pending: number
  completed: number
  failed: number
  cancelled: number
  uploading: number
  totalSize: number
  completedSize: number
  transferredSize: number
  avgSpeed: number
  estimatedTimeMs: number
  progress: number
}

export interface UploadTaskQueueStatus {
  revision: number
  tasks: UploadTask[]
  config: UploadTaskQueueConfig
  stats: UploadTaskQueueStats
}
