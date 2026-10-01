import type { BulkCandidate, BulkInput } from '../../shared/bulkChanges'
import type { BulkAdapter } from './session'

interface GalleryRecord {
  id: string
  imgUrl?: string
  type?: string
  configId?: string
  bucket?: string
  bucketName?: string
  updatedAt?: number
}

export interface BulkGalleryStore {
  withSnapshot: <T>(operation: (snapshot: { data: GalleryRecord[] }) => Promise<T>) => Promise<T>
  updateMany: (items: { id: string; imgUrl: string }[]) => Promise<{ total: number; success: number }>
}

export function galleryUrlKey(value: string): string {
  try {
    return new URL(value).href
  } catch {
    return value
  }
}

export function validGalleryUrl(value: string): boolean {
  if (!value || value.trim() !== value || /[\u0000-\u0020\u007f]/u.test(value)) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'file:'].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}

export async function createGalleryAdapter(inputs: readonly BulkInput[], store: BulkGalleryStore) {
  const selected = new Set(inputs.map(item => item.id))
  const targetKeys = new Set(inputs.map(item => galleryUrlKey(item.target)))
  const indexSnapshot = (data: GalleryRecord[]) => {
    const byId = new Map<string, GalleryRecord>()
    const targets = new Map<string, [string, string | undefined, number | undefined][]>()
    // Scan the entire gallery once, including rows outside the current page/filter.
    for (const record of data) {
      if (selected.has(record.id)) {
        // Detach the scalar fields used by checks from the store's live records.
        byId.set(record.id, { ...record })
        continue
      }
      const key = galleryUrlKey(record.imgUrl || '')
      if (!targetKeys.has(key)) continue
      let records = targets.get(key)
      if (!records) targets.set(key, (records = []))
      records.push([record.id, record.imgUrl, record.updatedAt])
    }
    const byTarget = new Map(
      [...targets].map(([key, records]) => [
        key,
        { version: JSON.stringify(records.sort((a, b) => a[0].localeCompare(b[0]))) },
      ]),
    )
    return { byId, byTarget }
  }
  let snapshot = await store.withSnapshot(async ({ data }) => indexSnapshot(data))
  const candidates: BulkCandidate[] = inputs.map(item => {
    const record = snapshot.byId.get(item.id)
    return {
      ...item,
      context: {
        provider: record?.type || 'gallery',
        accountId: typeof record?.configId === 'string' ? record.configId : '',
        bucketName: typeof record?.bucket === 'string' ? record.bucket : record?.bucketName || '',
        region: '',
      },
    }
  })
  const writeMany: NonNullable<BulkAdapter['writeMany']> = async items => {
    if (!items.length) return
    const result = await store.updateMany(items.map(item => ({ id: item.id, imgUrl: item.target })))
    // A resolved Promise alone is not a successful persistence acknowledgement.
    if (result.total !== items.length || result.success !== items.length) {
      throw new Error('Gallery update was not confirmed')
    }
  }
  const adapter: BulkAdapter = {
    kind: 'gallery-url',
    identity: (_item, key) => galleryUrlKey(key),
    validate: item => validGalleryUrl(item.target),
    withCommit: operation =>
      store.withSnapshot(async ({ data }) => {
        snapshot = indexSnapshot(data)
        return operation()
      }),
    source: async item => {
      const record = snapshot.byId.get(item.id)
      if (!record || record.imgUrl !== item.source) return undefined
      return { version: JSON.stringify([record.id, record.imgUrl, record.updatedAt, record.type, record.configId]) }
    },
    target: async item => snapshot.byTarget.get(galleryUrlKey(item.target)),
    write: item => writeMany([item], false),
    writeMany,
  }
  return { candidates, adapter }
}
