import path from 'node:path'

import type { DBStore, IGetResult, IObject } from '@piclist/store'
import fs from 'fs-extra'

import { galleryLockHeld, withGalleryLock } from './lock'
import { type GalleryDocument, GallerySyncError, recordMutation, validateDocument } from './model'
import { recoverLocalGallery, stateDir } from './storage'

export interface GalleryStore extends DBStore {
  /** Read a fresh snapshot and keep gallery mutations locked until the operation completes. */
  withSnapshot<T>(operation: (snapshot: IGetResult<IObject>) => Promise<T>): Promise<T>
}

export function trackGalleryStore(store: DBStore, root: string): GalleryStore {
  const adapter = store.getAdapter()
  const read = adapter.read.bind(adapter)
  const write = adapter.write.bind(adapter)
  let before: GalleryDocument | undefined
  adapter.read = async () => {
    try {
      const data = await read()
      before = validateDocument(data)
      return data
    } catch (error) {
      if (!(error instanceof GallerySyncError) || !recoverLocalGallery(root)) throw error
      const data = await read()
      before = validateDocument(data)
      return data
    }
  }
  adapter.write = async data => {
    if (!before) throw new GallerySyncError('Read the gallery before changing it.')
    // Hash exactly what the JSON store will persist, including omitted undefined
    // properties and Buffer/Date toJSON values. Never hash an in-memory object and
    // then persist a different representation of it.
    const serialized = JSON.parse(JSON.stringify(data))
    const next = recordMutation(before, serialized)
    // The store atomically writes records and their revisions/tombstones together.
    data.__sync = next.__sync
    serialized.__sync = next.__sync
    await write(serialized)
    before = next
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
      return (...args: unknown[]) => locked(async () => Reflect.apply(value, target, args))
    },
  }) as GalleryStore
}
