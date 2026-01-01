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

interface IGalleryDB {
  get<T>(filter?: IFilter): Promise<IGetResult<T> | undefined>
  insert<T>(value: T): Promise<IResult<T> | undefined>
  insertMany<T>(value: T[]): Promise<IResult<T>[] | undefined>
  updateById(id: string, value: IObject): Promise<boolean>
  getById<T>(id: string): Promise<IResult<T> | undefined>
  removeById(id: string): Promise<void>
}
