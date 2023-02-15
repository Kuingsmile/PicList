/* eslint-disable */
import { JSONStore } from '@picgo/store'
import { IJSON } from '@picgo/store/dist/types'
import { ManageApiType, ManageConfigType } from '~/universal/types/manage'

class ManageDB {
  private readonly ctx: ManageApiType
  private readonly db: JSONStore
  constructor (ctx: ManageApiType) {
    this.ctx = ctx
    this.db = new JSONStore(this.ctx.configPath)
    let initParams: IStringKeyMap = {
      picBed: {},
      settings: {},
      currentPicBed: 'placeholder'
    }
    for (let key in initParams) {
      if (!this.db.has(key)) {
        try {
          this.db.set(key, initParams[key])
        } catch (e: any) {
          this.ctx.logger.error(e)
          throw e
        }
      }
    }
  }

  read (flush?: boolean): IJSON {
    return this.db.read(flush)
  }

  get (key: string = ''): any {
    this.read(true)
    return this.db.get(key)
  }

  set (key: string, value: any): void {
    this.read(true)
    return this.db.set(key, value)
  }

  has (key: string): boolean {
    this.read(true)
    return this.db.has(key)
  }

  unset (key: string, value: any): boolean {
    this.read(true)
    return this.db.unset(key, value)
  }

  saveConfig (config: Partial<ManageConfigType>): void {
    Object.keys(config).forEach((name: string) => {
      this.set(name, config[name])
    })
  }

  removeConfig (config: ManageConfigType): void {
    Object.keys(config).forEach((name: string) => {
      this.unset(name, config[name])
    })
  }
}

export default ManageDB
