import { galleryDBPath } from '@core/datastore/dirs'
import { DBStore } from '@piclist/store'

export const DB_PATH: string = galleryDBPath()

// v2.3.0 add gallery db
class GalleryDB {
  static #instance: DBStore
  private constructor() {
    console.log('init gallery db')
  }

  static getInstance(forceRefresh: boolean = false): DBStore {
    if (!GalleryDB.#instance || forceRefresh) {
      GalleryDB.#instance = new DBStore(DB_PATH, 'gallery')
    }
    return GalleryDB.#instance
  }
}

export { GalleryDB }
