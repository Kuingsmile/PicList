import type { BulkCandidate, BulkInput } from '../../universal/bulkChanges'
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
  get: () => Promise<{ data: GalleryRecord[] }>
  getById: (id: string) => Promise<GalleryRecord | undefined>
  updateById: (id: string, value: { imgUrl: string }) => Promise<boolean>
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
  const { data } = await store.get()
  const byId = new Map(data.map(item => [item.id, item]))
  const selected = new Set(inputs.map(item => item.id))
  const candidates: BulkCandidate[] = inputs.map(item => {
    const record = byId.get(item.id)
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
  const adapter: BulkAdapter = {
    kind: 'gallery-url',
    identity: (_item, key) => galleryUrlKey(key),
    validate: item => validGalleryUrl(item.target),
    source: async item => {
      const record = await store.getById(item.id)
      if (!record || record.imgUrl !== item.source) return undefined
      return { version: JSON.stringify([record.id, record.imgUrl, record.updatedAt, record.type, record.configId]) }
    },
    target: async item => {
      // Read the whole gallery, not the current page/filter. Selected rows are handled by the plan.
      const { data } = await store.get()
      const records = data
        .filter(record => !selected.has(record.id) && galleryUrlKey(record.imgUrl || '') === galleryUrlKey(item.target))
        .map(record => [record.id, record.imgUrl, record.updatedAt])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      return records.length ? { version: JSON.stringify(records) } : undefined
    },
    write: async item => {
      // False is a failed persistence acknowledgement, not a successful Promise.
      if (!(await store.updateById(item.id, { imgUrl: item.target })))
        throw new Error('Gallery update was not confirmed')
    },
  }
  return { candidates, adapter }
}
