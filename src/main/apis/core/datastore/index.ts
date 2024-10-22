import fs from 'fs-extra'
import { DBStore, JSONStore } from '@picgo/store'

import { dbPathChecker, dbPathDir, getGalleryDBPath } from '@core/datastore/dbChecker'

import { T } from '~/i18n'
import { configPaths } from '#/utils/configPaths'
import { IJSON } from '@picgo/store/dist/types'
import { IConfig } from 'piclist'

const STORE_PATH = dbPathDir()

if (!fs.pathExistsSync(STORE_PATH)) {
  fs.mkdirpSync(STORE_PATH)
}
const CONFIG_PATH: string = dbPathChecker()
export const DB_PATH: string = getGalleryDBPath().dbPath

class ConfigStore {
  #db: JSONStore

  constructor() {
    this.#db = new JSONStore(CONFIG_PATH)

    if (!this.#db.has('picBed')) {
      this.#db.set('picBed', {
        current: 'smms', // deprecated
        uploader: 'smms',
        smms: {
          token: ''
        }
      })
    }

    if (!this.#db.has(configPaths.settings.shortKey._path)) {
      this.#db.set(configPaths.settings.shortKey['picgo:upload'], {
        enable: true,
        key: 'CommandOrControl+Alt+P',
        name: 'upload',
        label: T('QUICK_UPLOAD')
      })
    }
    this.read()
  }

  read(flush?: boolean): IJSON {
    return this.#db.read(flush)
  }

  getSingle(key = ''): any {
    if (key === '') {
      return this.#db.read(true)
    }
    this.read(true)
    return this.#db.get(key)
  }

  get(key: string): any
  get(key: string[]): any[]
  get(key: string | string[] = ''): any {
    if (Array.isArray(key)) {
      return key.map(k => this.getSingle(k))
    }
    return this.getSingle(key)
  }

  set(key: string, value: any): void {
    this.read(true)
    return this.#db.set(key, value)
  }

  has(key: string) {
    this.read(true)
    return this.#db.has(key)
  }

  unset(key: string, value: any): boolean {
    this.read(true)
    return this.#db.unset(key, value)
  }

  saveConfig(config: Partial<IConfig>): void {
    Object.keys(config).forEach((name: string) => {
      this.set(name, config[name])
    })
  }

  removeConfig(config: IConfig): void {
    Object.keys(config).forEach((name: string) => {
      this.unset(name, config[name])
    })
  }

  getConfigPath() {
    return CONFIG_PATH
  }
}

const db = new ConfigStore()

export default db

// v2.3.0 add gallery db
class GalleryDB {
  static #instance: DBStore
  private constructor() {
    console.log('init gallery db')
  }

  static getInstance(): DBStore {
    if (!GalleryDB.#instance) {
      GalleryDB.#instance = new DBStore(DB_PATH, 'gallery')
    }
    return GalleryDB.#instance
  }
}

export { GalleryDB }
