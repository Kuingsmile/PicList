import { createHash } from 'node:crypto'

import type { GallerySyncChange, GallerySyncResolution, GallerySyncSource } from '#/types/gallerySync'

export interface RecordValue {
  id: string
  [key: string]: unknown
}
export interface Revision {
  revision: string
  parents: string[]
  ancestors: string[]
  value: RecordValue | null
}
export interface GalleryDocument {
  gallery: RecordValue[]
  __gallery_KEY__: Record<string, number>
  __sync: { version: 1; records: Record<string, Revision> }
}
export interface Candidate extends Revision {
  source: GallerySyncSource
}
export interface MergeEntry {
  id: string
  key: string
  candidates: Candidate[]
  frontier: Candidate[]
  conflict: boolean
}

export class GallerySyncError extends Error {
  snapshotId?: string
  constructor(message: string) {
    super(message)
    this.name = 'GallerySyncError'
  }
}

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const sorted = (values: string[]) => [...new Set(values)].sort()
const isObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const isHash = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

export function revision(value: RecordValue | null, previous: Revision[] = []): Revision {
  const parents = sorted(previous.map(item => item.revision))
  const ancestors = sorted(previous.flatMap(item => [item.revision, ...item.ancestors]))
  return { revision: digest(canonical({ value, parents, ancestors })), parents, ancestors, value }
}

export function documentFrom(records: Record<string, Revision>): GalleryDocument {
  const gallery = Object.keys(records)
    .sort()
    .flatMap(id => (records[id].value ? [records[id].value!] : []))
  return {
    gallery,
    __gallery_KEY__: Object.fromEntries(gallery.map(item => [item.id, 1])),
    __sync: { version: 1, records },
  }
}

// Missing records in an input are not deletions. Only explicit, validated tombstones delete records.
export function validateDocument(input: unknown): GalleryDocument {
  const invalid = () => {
    throw new GallerySyncError('Invalid gallery database. No changes were applied.')
  }
  if (!isObject(input) || !Array.isArray(input.gallery) || !isObject(input.__gallery_KEY__)) return invalid()
  const values = new Map<string, RecordValue>()
  for (const value of input.gallery) {
    if (!isObject(value) || typeof value.id !== 'string' || !value.id || values.has(value.id)) return invalid()
    for (const field of ['createdAt', 'updatedAt']) {
      if (value[field] !== undefined && (typeof value[field] !== 'number' || !Number.isFinite(value[field])))
        return invalid()
    }
    values.set(value.id, value as RecordValue)
  }
  if (
    Object.keys(input.__gallery_KEY__).length !== values.size ||
    [...values.keys()].some(id => !Object.hasOwn(input.__gallery_KEY__, id) || input.__gallery_KEY__[id] !== 1)
  )
    return invalid()
  if (input.__sync === undefined)
    return documentFrom(Object.fromEntries([...values].map(([id, value]) => [id, revision(value)])))
  if (!isObject(input.__sync) || input.__sync.version !== 1 || !isObject(input.__sync.records)) return invalid()
  const records: Record<string, Revision> = Object.create(null)
  for (const [id, entry] of Object.entries(input.__sync.records)) {
    if (
      !id ||
      !isObject(entry) ||
      !isHash(entry.revision) ||
      !Array.isArray(entry.parents) ||
      !Array.isArray(entry.ancestors) ||
      !entry.parents.every(isHash) ||
      !entry.ancestors.every(isHash) ||
      canonical(entry.parents) !== canonical(sorted(entry.parents)) ||
      canonical(entry.ancestors) !== canonical(sorted(entry.ancestors)) ||
      entry.ancestors.includes(entry.revision) ||
      entry.parents.some(parent => !entry.ancestors.includes(parent))
    )
      return invalid()
    const value = values.get(id) ?? null
    if (
      canonical(entry.value) !== canonical(value) ||
      (value && value.id !== id) ||
      entry.revision !== digest(canonical({ value, parents: entry.parents, ancestors: entry.ancestors }))
    )
      return invalid()
    records[id] = { revision: entry.revision, parents: entry.parents, ancestors: entry.ancestors, value }
  }
  if ([...values.keys()].some(id => !Object.hasOwn(records, id))) return invalid()
  return documentFrom(records)
}

// Called only by the gallery store's atomic mutation writer. The before/after difference
// represents a successful user mutation, never a comparison of two sync inputs.
export function recordMutation(before: GalleryDocument, after: { gallery: RecordValue[] }): GalleryDocument {
  const next = validateDocument({
    gallery: after.gallery,
    __gallery_KEY__: Object.fromEntries(after.gallery.map(item => [item.id, 1])),
  })
  const records = Object.assign(Object.create(null), before.__sync.records) as Record<string, Revision>
  for (const [id, entry] of Object.entries(next.__sync.records)) {
    const previous = records[id]
    records[id] =
      previous && canonical(previous.value) === canonical(entry.value)
        ? previous
        : revision(entry.value, previous ? [previous] : [])
  }
  for (const [id, previous] of Object.entries(before.__sync.records)) {
    if (previous.value && !Object.hasOwn(next.__sync.records, id)) records[id] = revision(null, [previous])
  }
  return documentFrom(records)
}

function frontier(candidates: Candidate[]): Candidate[] {
  const unique = [...new Map(candidates.map(item => [item.revision, item])).values()]
  return unique
    .filter(item => !unique.some(other => other.ancestors.includes(item.revision)))
    .sort((a, b) => a.revision.localeCompare(b.revision))
}

function previewDetails(value: RecordValue | null): Record<string, string> {
  const details: Record<string, string> = {}
  for (const field of ['fileName', 'type', 'width', 'height', 'imgUrl', 'createdAt', 'updatedAt']) {
    if (typeof value?.[field] !== 'string' && typeof value?.[field] !== 'number') continue
    if (field === 'imgUrl') {
      try {
        const url = new URL(String(value[field]))
        if (!['https:', 'http:'].includes(url.protocol)) continue
        url.username = ''
        url.password = ''
        url.search = ''
        url.hash = ''
        details[field] = url.toString()
      } catch {
        /* Omit local paths and unrecognized URLs from the preview. */
      }
    } else details[field] = String(value[field])
  }
  return details
}

export function planMerge(inputs: { source: GallerySyncSource; document: GalleryDocument }[], salt: string) {
  const records = new Map<string, Candidate[]>()
  for (const { source, document } of inputs) {
    for (const [id, entry] of Object.entries(document.__sync.records)) {
      records.set(id, [...(records.get(id) ?? []), { ...entry, source }])
    }
  }
  const entries: MergeEntry[] = []
  const changes: GallerySyncChange[] = []
  for (const [id, candidates] of [...records].sort(([a], [b]) => a.localeCompare(b))) {
    const heads = frontier(candidates)
    const conflict = new Set(heads.map(item => canonical(item.value))).size > 1
    const key = digest(`${salt}:${id}`)
    entries.push({ id, key, candidates, frontier: heads, conflict })
    const local = candidates.find(item => item.source === 'local-primary')
    const remote = candidates.find(item => item.source === 'remote-primary')
    const kind = conflict
      ? 'conflict'
      : !heads[0].value
        ? 'deletion'
        : !local?.value || !remote?.value
          ? 'addition'
          : 'update'
    // Tombstones and revisions already present on both sides are a no-op.
    if (
      !conflict &&
      local?.revision === heads[0].revision &&
      remote?.revision === heads[0].revision &&
      heads.length === 1
    )
      continue
    changes.push({
      key,
      kind,
      versions: candidates.map(item => ({
        source: item.source,
        revision: item.revision,
        deleted: !item.value,
        name: typeof item.value?.fileName === 'string' ? item.value.fileName : '',
        details: previewDetails(item.value),
      })),
      ...(conflict && local?.value && remote?.value
        ? {
            legacySuggestion:
              Number(local.value.updatedAt || 0) >= Number(remote.value.updatedAt || 0)
                ? ('keep-local' as const)
                : ('keep-remote' as const),
          }
        : {}),
    })
  }
  return { entries, changes }
}

export function applyMerge(entries: MergeEntry[], resolutions: Record<string, GallerySyncResolution>): GalleryDocument {
  const records: Record<string, Revision> = Object.create(null)
  const copies: [string, Revision][] = []
  for (const entry of entries) {
    const { id, frontier: heads, candidates, conflict, key } = entry
    if (!conflict) {
      records[id] = heads.length === 1 ? heads[0] : revision(heads[0].value, heads)
      continue
    }
    const choice = resolutions[key]
    if (!['keep-local', 'keep-remote', 'preserve-both'].includes(choice))
      throw new GallerySyncError('Choose a resolution for every conflict.')
    if (choice !== 'preserve-both') {
      const side = choice === 'keep-local' ? 'local' : 'remote'
      const sideHeads = frontier(candidates.filter(item => item.source.startsWith(side)))
      const selected =
        candidates.find(
          item => item.source === `${side}-primary` && sideHeads.some(head => head.revision === item.revision),
        ) ?? sideHeads[0]
      if (!selected) throw new GallerySyncError('That side has no version. Choose another resolution.')
      records[id] = revision(selected.value, heads)
    } else {
      // A deletion keeps its original identity. Surviving edits get stable copy IDs.
      const ordered = [...heads].sort(
        (a, b) => Number(!!a.value) - Number(!!b.value) || a.revision.localeCompare(b.revision),
      )
      records[id] = revision(ordered[0].value, heads)
      for (const head of ordered.slice(1)) {
        if (!head.value) continue
        const copyId = `sync-copy-${digest(`${id}:${head.revision}`)}`
        copies.push([copyId, revision({ ...head.value, id: copyId }, heads)])
      }
    }
  }
  for (const [id, copy] of copies) {
    if (Object.hasOwn(records, id) && canonical(records[id].value) !== canonical(copy.value))
      throw new GallerySyncError('A preserved copy ID is already in use.')
    records[id] ??= copy
  }
  // Strip source labels and validate the actual final representation.
  for (const [id, entry] of Object.entries(records)) {
    records[id] = { revision: entry.revision, parents: entry.parents, ancestors: entry.ancestors, value: entry.value }
  }
  return validateDocument(documentFrom(records))
}
