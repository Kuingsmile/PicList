import path from 'node:path'

import type { DBStore } from '@piclist/store'
import fs from 'fs-extra'

import { galleryLockHeld, withGalleryLock } from './lock'
import { type GalleryDocument, GallerySyncError, recordMutation, validateDocument } from './model'
import { stateDir } from './storage'

export function trackGalleryStore(store: DBStore, root: string): DBStore {
  const adapter = store.getAdapter()
  const read = adapter.read.bind(adapter)
  const write = adapter.write.bind(adapter)
  let before: GalleryDocument | undefined
  adapter.read = async () => {
    const data = await read()
    before = validateDocument(data)
    return data
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
  return new Proxy(store, {
    get(target, property) {
      const value = Reflect.get(target, property)
      if (typeof value !== 'function') return value
      if (property === 'getAdapter') return value.bind(target)
      return (...args: unknown[]) => {
        const nested = galleryLockHeld()
        return withGalleryLock(async () => {
          if (!nested && fs.existsSync(path.join(stateDir(root), 'pending.json'))) {
            throw new GallerySyncError('Gallery recovery is required before editing. Retry gallery sync.')
          }
          return Reflect.apply(value, target, args)
        })
      }
    },
  })
}
