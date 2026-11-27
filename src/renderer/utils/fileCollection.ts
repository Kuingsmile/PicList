import { fileDate, fileSize, type FileSortValue } from '#/utils/fileSort'

export { compareFileValues, fileDate, fileSize, type FileSortValue, fileType } from '#/utils/fileSort'

export interface FileColumn<T> {
  key: string
  label: string
  width: number
  value: (item: T) => FileSortValue
  format?: (item: T) => string
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
