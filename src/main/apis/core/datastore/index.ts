import { dataDir, galleryDBPath } from '@core/datastore/dirs'
import { DBStore } from '@piclist/store'

import { type GalleryStore, trackGalleryStore } from '~/services/gallerySync/store'

export const DB_PATH: string = galleryDBPath()

class GalleryDB {
  static #instance: GalleryStore
  private constructor() {
    console.log('init gallery db')
  }

  static getInstance(forceRefresh: boolean = false): GalleryStore {
    if (!GalleryDB.#instance || forceRefresh) {
      GalleryDB.#instance = trackGalleryStore(new DBStore(DB_PATH, 'gallery'), dataDir())
    }
    return GalleryDB.#instance
  }
}

export { GalleryDB }
