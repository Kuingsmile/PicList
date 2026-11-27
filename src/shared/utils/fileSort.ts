export type FileSortValue = string | number | null | undefined

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Missing metadata stays last in either direction; ties retain inventory order. */
export function compareFileValues(a: FileSortValue, b: FileSortValue, ascending = true) {
  const missing = (value: FileSortValue) =>
    value === undefined || value === null || value === '' || (typeof value === 'number' && !Number.isFinite(value))
  if (missing(a)) return missing(b) ? 0 : 1
  if (missing(b)) return -1
  const result = typeof a === 'number' && typeof b === 'number' ? a - b : collator.compare(String(a), String(b))
  return ascending ? result : -result
}

export function fileType(item: { fileName?: string; extname?: string; isDir?: boolean }) {
  if (item.isDir) return undefined
  const name = item.fileName?.split(/[\\/]/).pop() ?? ''
  return (
    (item.extname || (name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.') + 1) : ''))
      .replace(/^\./, '')
      .toUpperCase() || undefined
  )
}

export function fileSize(item: { fileSize?: unknown; size?: unknown; isDir?: boolean }) {
  if (item.isDir) return undefined
  const value = item.fileSize ?? item.size
  if (value === undefined || value === null || value === '') return undefined
  const size = Number(value)
  return Number.isFinite(size) && size >= 0 ? size : undefined
}

export function fileDate(item: Record<string, any>) {
  if (item.isDir) return undefined
  // Prefer raw timestamps over the provider's localized display string.
  const raw =
    item.updatedAt ??
    item.lastModified ??
    item.LastModified ??
    item.mtime ??
    item.lastmod ??
    item.createdAt ??
    (item.putTime ? Math.floor(Number(item.putTime) / 10000) : undefined) ??
    (item.datetime ? Number(item.datetime) * 1000 : undefined) ??
    (item.created_at ? Number(item.created_at) * 1000 : undefined) ??
    (item.time ? Number(item.time) * 1000 : undefined) ??
    item.formatedTime
  if (raw === undefined || raw === null || raw === '') return undefined
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : undefined
}
