import { galleryTagKey, normalizeGalleryTags } from './galleryTags'
import { compareFileValues, fileDate, type FileSortValue, fileType } from './utils/fileSort'

export const GALLERY_READ_LIMIT = 256
export type GallerySortField = 'name' | 'tags' | 'time' | 'ext' | 'provider' | 'check'

export interface GalleryQuery {
  name: string
  url: string
  providers: string[]
  tag: string | null
  start: number
  end: number
  sort: GallerySortField
  ascending: boolean
  providerNames: Record<string, string>
  selected: string[]
}

/** The scroller needs a stable ordered ID for every match. It resolves visible records separately. */
export function queryGallery(records: ImgInfo[], query: GalleryQuery, searchHits?: Set<string>) {
  const providers = new Set(query.providers)
  const selected = new Set(query.selected)
  const tag = query.tag && galleryTagKey(query.tag)
  const labels = new Map<string, string>()
  const matches: { item: ImgInfo; value: FileSortValue }[] = []
  for (const item of records) {
    const tags = normalizeGalleryTags(item.galleryTags)
    for (const label of tags) {
      const key = galleryTagKey(label)
      if (!labels.has(key)) labels.set(key, label)
    }
    if (providers.size && !providers.has(item.type ?? '')) continue
    if (searchHits && !searchHits.has(item.id!)) continue
    if (tag === '' && tags.length) continue
    if (tag && !tags.some(label => galleryTagKey(label) === tag)) continue
    if (query.start !== -Infinity || query.end !== Infinity) {
      const time = new Date(item.updatedAt).getTime()
      if (!(time >= query.start && time < query.end)) continue
    }
    let value: FileSortValue
    switch (query.sort) {
      case 'name':
        value = item.fileName
        break
      case 'time':
        value = fileDate(item)
        break
      case 'ext':
        value = fileType(item)
        break
      case 'tags':
        value = tags.join(', ')
        break
      case 'provider':
        value = query.providerNames[item.type ?? ''] || item.type
        break
      case 'check':
        value = Number(selected.has(item.id!))
        break
    }
    matches.push({ item, value })
  }
  matches.sort(
    (a, b) =>
      compareFileValues(a.value, b.value, query.sort === 'check' ? false : query.ascending) ||
      b.item.createdAt - a.item.createdAt,
  )
  const ids = matches.map(({ item }) => item.id!)
  return {
    ids,
    total: records.length,
    tags: [...labels.values()].sort((a, b) => a.localeCompare(b)),
  }
}
