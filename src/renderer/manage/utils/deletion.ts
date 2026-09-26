import { type DeleteFailure, type DeleteResult, type DeleteTarget, isWithinFolder } from '../../../universal/deletion'

export interface DeletionState {
  failed: DeleteFailure[]
  pendingFolders: string[]
}

export function applyDeletionResult(state: DeletionState, targets: DeleteTarget[], result: DeleteResult): DeleteResult {
  const retriedKeys = new Set(targets.filter(target => !target.isDir).map(target => target.key))
  const retriedFolders = targets.filter(target => target.isDir).map(target => target.key)
  const remaining = state.failed.filter(
    failure =>
      !(!failure.isDir && retriedKeys.has(failure.key)) &&
      !retriedFolders.some(folder => isWithinFolder(failure.key, folder)),
  )
  state.failed = [
    ...new Map([...remaining, ...result.failed].map(item => [`${item.isDir}:${item.key}`, item])).values(),
  ]
  const folders = new Set([...state.pendingFolders, ...retriedFolders])
  const completed = [...folders].filter(folder => !state.failed.some(item => isWithinFolder(item.key, folder)))
  state.pendingFolders = [...folders].filter(folder => !completed.includes(folder))
  return { ...result, deletedFolders: [...new Set([...result.deletedFolders, ...completed])] }
}

export function retryDeletionTargets(state: DeletionState): DeleteTarget[] {
  // In particular, failed descendants are exact object keys, not their original selected folders.
  return state.failed.map(({ key, isDir, DeleteHash }) => ({ key, isDir, DeleteHash }))
}
