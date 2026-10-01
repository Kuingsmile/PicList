interface IFileWithPath {
  path: string
  name?: string
}

interface IUploadTarget {
  type: string
  name: string
  configId: string
  configName: string
}

interface IuploadReturnCtxResult {
  ctx: import('piclist').IPicGo | undefined
  backupCtx: import('piclist').IPicGo | undefined
  sourceInputs?: string[]
}

interface IUploadProgress {
  jobId: string
  progress: number
  status: 'uploading' | 'completed' | 'failed' | 'cancelled' | 'timeout'
  phase?: 'preparing' | 'uploading' | 'finalizing'
  indeterminate?: boolean
  destination?: 'primary' | 'secondary'
  transferredBytes?: number
  totalBytes?: number | null
  completedFiles?: number
  totalFiles?: number
}

// Optional second argument from newer cores; older plugins can still emit numeric progress.
interface ICoreUploadProgress {
  phase: 'preparing' | 'uploading' | 'finalizing' | 'completed' | 'failed'
  progress: number | null
  destination: 'primary' | 'secondary'
  transferredBytes: number
  totalBytes: number | null
  completedFiles: number
  totalFiles: number
}

interface IRenameRequest {
  jobId: string
  dialogId: string
  fileName: string
  originalName: string
}

interface IRenameResponse {
  jobId: string
  dialogId: string
  name: string | null
}
