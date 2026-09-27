interface UploadMetadata {
  accountId?: string
  alias?: string
  provider?: string
  targetFileBucket?: string
  targetFilePath: string
  status: string
  progress: number
}

/** Match opaque object keys in their account/bucket scope, never by basename. */
export function fileTaskStates(tasks: UploadMetadata[], accountId: string, provider: string, bucket: string) {
  const states = new Map<string, { status: string; progress: number }>()
  for (const task of tasks) {
    if (
      (task.accountId ?? task.alias) !== accountId ||
      task.provider !== provider ||
      (task.targetFileBucket ?? '') !== bucket
    )
      continue
    const previous = states.get(task.targetFilePath)
    const active = (status: string) => ['queuing', 'uploading', 'paused'].includes(status)
    // Keep an active transfer ahead of older completed history for the same key.
    if (previous && active(previous.status) && !active(task.status)) continue
    states.set(task.targetFilePath, { status: task.status, progress: task.progress })
  }
  return states
}
