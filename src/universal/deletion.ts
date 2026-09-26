export interface DeleteTarget {
  key: string
  isDir: boolean
  DeleteHash?: string
}

export interface DeleteFailure extends DeleteTarget {
  error: string
}

export interface DeleteResult {
  deleted: string[]
  // A deleted folder marker alone does not confirm deletion of its descendants.
  deletedFolders: string[]
  failed: DeleteFailure[]
}

export function emptyDeleteResult(): DeleteResult {
  return { deleted: [], deletedFolders: [], failed: [] }
}

export function failedDeletion(targets: DeleteTarget[], error = 'Deletion was not confirmed'): DeleteResult {
  return { ...emptyDeleteResult(), failed: targets.map(target => ({ ...target, error })) }
}

export function mergeDeleteResults(results: DeleteResult[]): DeleteResult {
  return {
    deleted: results.flatMap(result => result.deleted),
    deletedFolders: results.flatMap(result => result.deletedFolders),
    failed: results.flatMap(result => result.failed),
  }
}

export function isWithinFolder(key: string, folder: string): boolean {
  return key === folder || key.startsWith(folder.endsWith('/') ? folder : `${folder}/`)
}

export function removeDeletedEntries<T extends { key: string; isDir: boolean }>(
  entries: T[],
  result: DeleteResult,
): T[] {
  const deleted = new Set(result.deleted)
  const failed = new Set(result.failed.map(item => item.key))
  return entries.filter(item => {
    if (failed.has(item.key)) return true
    if (result.deletedFolders.some(folder => isWithinFolder(item.key, folder))) return false
    return item.isDir || !deleted.has(item.key)
  })
}
