type IObj = Record<string, any>

type IObjT<T> = Record<string, T>

interface ErrnoException extends Error {
  errno?: number | string
  code?: string
  path?: string
  syscall?: string
  stack?: string
}

type IDispose = () => void

type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type ILoggerType = string | Error | boolean | number | undefined

interface IAppNotification {
  title: string
  body: string
  icon?: string
}

type IStringKeyMap = Record<string, any>

type ILogArgvType = string | number

type ILogArgvTypeWithError = ILogArgvType | Error

type PromiseResType<T> = T extends Promise<infer R> ? R : T

interface II18nItem {
  label: string
  value: string
}

type ICheckBoxValueType = boolean | string | number

interface IHTTPProxy {
  host: string
  port: number
  protocol: string
}

interface IToolboxCheckRes {
  type: string
  status: string
  msg?: string
  value?: any
}
