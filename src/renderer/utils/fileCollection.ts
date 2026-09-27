export type FileSortValue = string | number | null | undefined

export interface FileColumn {
  key: string
  label: string
  width: number
  value: (item: any) => FileSortValue
  format?: (item: any) => string
}

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

export function formatCollectionSize(item: Parameters<typeof fileSize>[0]) {
  const size = fileSize(item)
  if (size === undefined) return '—'
  if (size === 0) return '0 B'
  const unit = Math.max(0, Math.min(4, Math.floor(Math.log(size) / Math.log(1024))))
  return `${Number((size / 1024 ** unit).toFixed(unit ? 1 : 0))} ${['B', 'KB', 'MB', 'GB', 'TB'][unit]}`
}

export function formatCollectionDate(item: Record<string, any>) {
  const date = fileDate(item)
  return date === undefined ? item.formatedTime || '—' : new Date(date).toLocaleString()
}
