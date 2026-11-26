import { AsyncLocalStorage } from 'node:async_hooks'
import path from 'node:path'

import type { DBStore, IGetResult, IObject } from '@piclist/store'
import fs from 'fs-extra'

import { hasBackupPayload, withoutBackupPayload } from '~/services/uploads/backupPayload'

import { cleanupGallery } from './cleanup'
import { galleryLockHeld, withGalleryLock } from './lock'
import { type GalleryDocument, GallerySyncError, recordMutation, type Revision, validateDocument } from './model'
import { recoverLocalGallery, stateDir } from './storage'

export interface GalleryStore extends DBStore {
  /** Read a fresh snapshot and keep gallery mutations locked until the operation completes. */
  withSnapshot<T>(operation: (snapshot: IGetResult<IObject>) => Promise<T>): Promise<T>
}

function mutationIds(method: PropertyKey, args: any[]): Set<string> | undefined {
  let ids: unknown[]
  switch (method) {
    case 'insert':
      ids = [args[0].id]
      break
    case 'insertMany':
    case 'updateMany':
      ids = args[0].map((item: IObject) => item.id)
      break
    case 'updateById':
    case 'removeById':
      ids = [args[0]]
      break
    case 'removeMany':
      ids = args[0]
      break
    // Overwrite and direct adapter writes can change every record.
    default:
      return undefined
  }
  return new Set(ids.filter((id): id is string => typeof id === 'string'))
}

export function trackGalleryStore(store: DBStore, root: string): GalleryStore {
  const adapter = store.getAdapter()
  const read = adapter.read.bind(adapter)
  const write = adapter.write.bind(adapter)
  let before: GalleryDocument | undefined
  const mutations = new AsyncLocalStorage<Set<string>>()
  let verified = new Map<string, Revision>()
  const remember = (document: GalleryDocument) => {
    const next = new Map<string, Revision>()
    for (const [id, record] of Object.entries(document.__sync.records)) {
      const known = verified.get(id)
      // Public store reads return live objects. Cache a private copy only for new revisions.
      next.set(id, known?.revision === record.revision ? known : structuredClone(record))
    }
    verified = next
    before = document
  }
  adapter.read = async () => {
    let data = await read()
    // An older writer can introduce plugin payloads again while PicList is running.
    if (data.gallery.some(hasBackupPayload)) {
      await cleanupGallery(root)
      data = await read()
    }
    try {
      remember(validateDocument(data, verified))
    } catch (error) {
      if (!(error instanceof GallerySyncError) || !recoverLocalGallery(root)) throw error
      data = await read()
      remember(validateDocument(data))
    }
    return data
  }
  adapter.write = async data => {
    if (!before) throw new GallerySyncError('Read the gallery before changing it.')
    // Hash exactly what the JSON store will persist, including omitted undefined
    // properties and Buffer/Date toJSON values. Never hash an in-memory object and
    // then persist a different representation of it.
    const gallery = data.gallery.map(withoutBackupPayload)
    const dirty = mutations.getStore()
    // A raw adapter client can change its last read in place, including __sync.
    const baseline = dirty
      ? before
      : { ...before, __sync: { version: 1 as const, records: structuredClone(Object.fromEntries(verified)) } }
    const next = recordMutation(baseline, { gallery }, dirty)
    // The store atomically writes records and their revisions/tombstones together.
    await write({ ...data, ...next })
    data.__sync = next.__sync
    data.gallery = gallery
    remember(next)
  }
  const locked = <T>(operation: () => Promise<T>): Promise<T> => {
    const nested = galleryLockHeld()
    return withGalleryLock(async () => {
      if (!nested && fs.existsSync(path.join(stateDir(root), 'pending.json'))) {
        throw new GallerySyncError('Gallery recovery is required before editing. Retry gallery sync.')
      }
      return operation()
    })
  }
  return new Proxy(store, {
    get(target, property) {
      if (property === 'withSnapshot') {
        return <T>(operation: (snapshot: IGetResult<IObject>) => Promise<T>) =>
          locked(async () => {
            await target.refresh()
            return operation(await target.get())
          })
      }
      const value = Reflect.get(target, property)
      if (typeof value !== 'function') return value
      if (property === 'getAdapter') return value.bind(target)
      return (...args: unknown[]) =>
        locked(async () => {
          const dirty = mutationIds(property, args)
          const operation = () => Reflect.apply(value, target, args)
          return dirty ? mutations.run(dirty, operation) : operation()
        })
    },
  }) as GalleryStore
}
