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

interface IAppNotification {
  title: string
  body: string
  icon?: string
}

type IStringKeyMap = Record<string, any>

type ILogArgvType = string | number

type ILogArgvTypeWithError = ILogArgvType | Error

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

interface IAppInfo {
  version: string
  electron: string
  chrome: string
  node: string
  v8: string
  platform: string
  arch: string
  osName: string
  osRelease: string
  isPortable: boolean
  language: string
  dataDir: string
  configPath: string
  logPath: string
}

interface IUpdateCheckResult {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
}
