import { type DeleteResult, emptyDeleteResult, failedDeletion, mergeDeleteResults } from '../../../universal/deletion'

const unconfirmed = 'The provider did not confirm deletion of this key'

// Never serialize/log SDK errors: they can include signed requests and credentials.
export function deletionError(error: any): string {
  const code = error?.Code || error?.code || error?.name
  const status =
    error?.$metadata?.httpStatusCode ||
    error?.statusCode ||
    error?.status ||
    error?.res?.statusCode ||
    error?.res?.status
  const reason = typeof code === 'string' && /^[\w.-]{1,80}$/.test(code) ? code : 'DeleteRequestFailed'
  return `${reason}${typeof status === 'number' ? ` (HTTP ${status})` : ''}`
}

export function failedKeys(keys: string[], error: string): DeleteResult {
  return failedDeletion(
    keys.map(key => ({ key, isDir: false })),
    error,
  )
}

/** Verbose S3/COS responses and OSS's confirmed-deletion list. Missing results fail closed. */
export function keyedDeleteResult(keys: string[], deleted: unknown, errors: unknown = []): DeleteResult {
  const result = emptyDeleteResult()
  const confirmed = new Set(
    (Array.isArray(deleted) ? deleted : []).map(item => (typeof item === 'string' ? item : item?.Key)),
  )
  const failures = new Map((Array.isArray(errors) ? errors : []).map(item => [item?.Key, item] as const))
  for (const key of keys) {
    const error = failures.get(key)
    if (!error && confirmed.has(key)) {
      result.deleted.push(key)
    } else {
      const reason = error
        ? [error.Code, error.Message].filter(value => typeof value === 'string' && value).join(': ')
        : ''
      result.failed.push({ key, isDir: false, error: reason || unconfirmed })
    }
  }
  return result
}

/** Qiniu's response is positional, including when the overall status is 298. */
export function qiniuDeleteResult(keys: string[], body: unknown): DeleteResult {
  const result = emptyDeleteResult()
  const entries = Array.isArray(body) ? body : []
  for (const [index, key] of keys.entries()) {
    const entry = entries[index]
    if (entry?.code === 200) {
      result.deleted.push(key)
    } else {
      const reason = typeof entry?.data?.error === 'string' ? entry.data.error : unconfirmed
      result.failed.push({ key, isDir: false, error: entry?.code ? `${entry.code}: ${reason}` : reason })
    }
  }
  return result
}

export async function deleteInBatches(
  keys: string[],
  deleteBatch: (keys: string[]) => Promise<DeleteResult>,
): Promise<DeleteResult> {
  const uniqueKeys = [...new Set(keys)]
  const results: DeleteResult[] = []
  // S3, OSS, COS and Qiniu all allow at most 1,000 objects per delete request.
  for (let start = 0; start < uniqueKeys.length; start += 1000) {
    const batch = uniqueKeys.slice(start, start + 1000)
    try {
      results.push(await deleteBatch(batch))
    } catch (error) {
      results.push(failedKeys(batch, deletionError(error)))
    }
  }
  return mergeDeleteResults(results)
}

interface DeleteListingPage {
  keys: string[]
  nextMarker?: string
}

export async function deleteListedFolder(
  key: string,
  listPage: (prefix: string, marker?: string) => Promise<DeleteListingPage>,
  deleteKeys: (keys: string[]) => Promise<DeleteResult>,
): Promise<DeleteResult> {
  const prefix = key.endsWith('/') ? key : `${key}/`
  const keys = new Set<string>()
  const markers = new Set<string>()
  let marker: string | undefined
  try {
    // Finish the inventory before mutating it, so continuation tokens stay valid.
    do {
      const page = await listPage(prefix, marker)
      for (const objectKey of page.keys) {
        if (typeof objectKey !== 'string' || !objectKey.startsWith(prefix)) {
          throw Object.assign(new Error(), { code: 'InvalidListingResponse' })
        }
        keys.add(objectKey)
      }
      marker = page.nextMarker
      if (marker) {
        if (markers.has(marker)) throw Object.assign(new Error(), { code: 'InvalidContinuationToken' })
        markers.add(marker)
      }
    } while (marker)
  } catch (error) {
    // No deletes have started. Retrying this failed inventory cannot resend successful deletes.
    return failedDeletion([{ key, isDir: true }], `Could not list folder: ${deletionError(error)}`)
  }
  let result: DeleteResult
  try {
    result = await deleteKeys([...keys])
  } catch (error) {
    result = failedKeys([...keys], deletionError(error))
  }
  if (result.failed.length === 0) result.deletedFolders.push(key)
  return result
}

export function nextDeleteMarker(truncated: boolean, marker: unknown): string | undefined {
  if (!truncated) return undefined
  if (typeof marker !== 'string' || !marker) {
    throw Object.assign(new Error(), { code: 'MissingContinuationToken' })
  }
  return marker
}
