import type { UploadTask, UploadTaskQueueConfig, UploadTaskQueueStats } from '../types/uploadTask'

export function getUploadTaskStats(tasks: UploadTask[], config: UploadTaskQueueConfig): UploadTaskQueueStats {
  const stats: UploadTaskQueueStats = {
    total: tasks.length,
    pending: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    uploading: 0,
    totalSize: 0,
    completedSize: 0,
    transferredSize: 0,
    avgSpeed: 0,
    estimatedTimeMs: 0,
    progress: 0,
  }
  let completedBytes = 0
  let completedDuration = 0
  let activeSpeed = 0
  let completedFraction = 0
  let remainingSize = 0
  let knownSizes = true
  for (const task of tasks) {
    if (task.status === 'paused') stats.pending++
    else stats[task.status]++
    if (task.status === 'cancelled') continue
    const size = Math.max(0, task.fileSize || 0)
    knownSizes &&= size > 0
    stats.totalSize += size
    const fraction = task.status === 'completed' ? 1 : task.status === 'uploading' ? task.progress / 100 : 0
    completedFraction += fraction
    stats.transferredSize += size * fraction
    if (task.status === 'completed') {
      stats.completedSize += size
      if (size > 0 && task.uploadDuration && task.uploadDuration > 0) {
        completedBytes += size
        completedDuration += task.uploadDuration
      }
    }
    if (task.status === 'uploading') activeSpeed += task.uploadSpeed || 0
    if (['pending', 'uploading', 'paused'].includes(task.status)) remainingSize += size * (1 - fraction)
  }
  stats.avgSpeed = Math.round(activeSpeed || (completedDuration ? (completedBytes / completedDuration) * 1000 : 0))
  const activeTotal = stats.total - stats.cancelled
  const fraction =
    knownSizes && stats.totalSize ? stats.transferredSize / stats.totalSize : completedFraction / activeTotal
  stats.progress = activeTotal ? Math.min(stats.completed === activeTotal ? 100 : 99, Math.round(fraction * 100)) : 0
  // Paused queues and queues with unknown source sizes do not have a useful ETA.
  if (knownSizes && config.isRunning && !config.isPaused && stats.avgSpeed > 0) {
    const intervals = Math.max(0, stats.pending - (stats.uploading ? 0 : 1))
    stats.estimatedTimeMs = Math.round((remainingSize / stats.avgSpeed) * 1000 + intervals * config.intervalS * 1000)
  }
  stats.transferredSize = Math.round(stats.transferredSize)
  return stats
}
