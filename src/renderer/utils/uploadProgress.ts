// A window can own several uploads at once. A completed job must not clear another's progress.
export function createUploadProgressTracker() {
  const active = new Map<string, number>()
  let failed = false
  return (event: IUploadProgress) => {
    if (event.status === 'uploading') {
      if (active.size === 0) failed = false
      active.set(event.jobId, event.progress)
    } else {
      active.delete(event.jobId)
      failed ||= event.status === 'failed' || event.status === 'timeout'
    }
    const progress = active.size
      ? Math.round([...active.values()].reduce((sum, value) => sum + value, 0) / active.size)
      : 100
    return { progress, failed }
  }
}
