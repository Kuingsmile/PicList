export interface UploadProgressState {
  progress: number
  failed: boolean
  cancelled: boolean
  activeCount: number
  indeterminate: boolean
  phase: 'preparing' | 'uploading' | 'finalizing'
  destination: 'primary' | 'secondary'
  transferredBytes: number
  totalBytes: number | null
  completedFiles: number
  totalFiles: number
}

// Retain settled jobs until the batch ends, so a small completed job cannot reset a larger upload.
export function createUploadProgressTracker() {
  const jobs = new Map<string, IUploadProgress>()
  return (event: IUploadProgress): UploadProgressState => {
    if (event.status === 'uploading' && ![...jobs.values()].some(job => job.status === 'uploading')) jobs.clear()
    jobs.set(event.jobId, event)
    const all = [...jobs.values()]
    const active = all.filter(job => job.status === 'uploading')
    const hasByteTotals = all.every(job => typeof job.totalBytes === 'number' && job.totalBytes > 0)
    const totalBytes = hasByteTotals ? all.reduce((sum, job) => sum + job.totalBytes!, 0) : null
    const transferredBytes = all.reduce(
      (sum, job) => sum + Math.min(job.transferredBytes ?? 0, job.totalBytes ?? Infinity),
      0,
    )
    const indeterminate =
      active.length > 0 &&
      (active.some(job => job.indeterminate) || (all.some(job => job.totalBytes !== undefined) && !hasByteTotals))
    const percentage = totalBytes
      ? (transferredBytes / totalBytes) * 100
      : all.reduce((sum, job) => sum + Math.max(0, job.progress), 0) / all.length
    const phase = active.some(job => !job.phase || job.phase === 'uploading')
      ? 'uploading'
      : active.some(job => job.phase === 'preparing')
        ? 'preparing'
        : 'finalizing'
    return {
      progress: active.length ? Math.min(100, Math.floor(percentage)) : 100,
      failed: all.some(job => job.status === 'failed' || job.status === 'timeout'),
      cancelled: all.some(job => job.status === 'cancelled'),
      activeCount: active.length,
      indeterminate,
      phase,
      destination: active.some(job => job.destination === 'secondary') ? 'secondary' : 'primary',
      transferredBytes,
      totalBytes,
      completedFiles: all.reduce((sum, job) => sum + (job.completedFiles ?? 0), 0),
      totalFiles: all.reduce((sum, job) => sum + (job.totalFiles ?? 0), 0),
    }
  }
}
