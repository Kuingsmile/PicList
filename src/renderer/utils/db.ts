import { IRPCActionType } from '#/types/enum'
import { IGalleryDB } from '#/types/extra-vue'

interface IFilter {
  orderBy?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

interface IGetResult<T> {
  total: number
  data: IResult<T>[]
}
interface IObject {
  id?: string
  [propName: string]: any
}

 type IResult<T> = T & {
   id: string
   createdAt: number
   updatedAt: number
 }

export class GalleryDB implements IGalleryDB {
  async #actionHandler<T>(method: IRPCActionType, ...args: any[]): Promise<T | undefined> {
    return await window.electron.triggerRPC<T>(method, ...args)
  }

  async get<T>(filter?: IFilter): Promise<IGetResult<T> | undefined> {
    return await this.#actionHandler<IGetResult<T>>(IRPCActionType.GALLERY_GET_DB, filter)
  }

  async insert<T>(value: T): Promise<IResult<T> | undefined> {
    return await this.#actionHandler<IResult<T>>(IRPCActionType.GALLERY_INSERT_DB, value)
  }

  async insertMany<T>(value: T[]): Promise<IResult<T>[] | undefined> {
    return await this.#actionHandler<IResult<T>[]>(IRPCActionType.GALLERY_INSERT_DB_BATCH, value)
  }

  async updateById (id: string, value: IObject): Promise<boolean> {
    return (await this.#actionHandler<boolean>(IRPCActionType.GALLERY_UPDATE_BY_ID_DB, id, value)) || false
  }

  async getById<T>(id: string): Promise<IResult<T> | undefined> {
    return await this.#actionHandler<IResult<T> | undefined>(IRPCActionType.GALLERY_GET_BY_ID_DB, id)
  }

  async removeById (id: string): Promise<void> {
    return await this.#actionHandler<void>(IRPCActionType.GALLERY_REMOVE_BY_ID_DB, id)
  }
}

export default new GalleryDB()
