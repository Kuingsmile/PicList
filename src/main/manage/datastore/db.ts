import { type IJSON, JSONStore } from '@piclist/store'

class ManageDB {
  readonly #ctx: IManageApiType
  readonly #db: JSONStore
  constructor(ctx: IManageApiType) {
    this.#ctx = ctx
    this.#db = new JSONStore(this.#ctx.configPath)
    const initParams: IStringKeyMap = {
      picBed: {},
      settings: {},
    }
    for (const key in initParams) {
      if (!this.#db.has(key)) {
        try {
          this.#db.set(key, initParams[key])
        } catch (e: any) {
          this.#ctx.logger.error(e)
          throw e
        }
      }
    }
  }

  read(flush?: boolean): IJSON {
    return this.#db.read(flush)
  }

  get(key: string = ''): any {
    this.#db.refresh()
    return this.#db.get(key)
  }

  set(key: string, value: any): void {
    return this.#db.set(key, value)
  }

  has(key: string): boolean {
    this.#db.refresh()
    return this.#db.has(key)
  }

  unset(key: string, value?: any): boolean {
    return this.#db.unset(key, value)
  }

  saveConfig(config: Partial<IManageConfigType>): void {
    this.#db.setMany(config)
  }

  removeConfig(config: IManageConfigType): void {
    Object.keys(config).forEach((name: string) => {
      this.unset(name, config[name])
    })
  }
}

export default ManageDB
