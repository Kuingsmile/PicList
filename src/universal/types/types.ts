import type { ServerResponse } from 'node:http'

import type { PicGo } from 'piclist'

export type IObj = Record<string, any>

export type IObjT<T> = Record<string, T>

export interface ErrnoException extends Error {
  errno?: number | string
  code?: string
  path?: string
  syscall?: string
  stack?: string
}

export type ILogType = 'success' | 'info' | 'warn' | 'error'

// Server
export type IHttpResponse = ServerResponse

export interface IServerCTX {
  response: IHttpResponse
  [propName: string]: any
}

export type routeHandler = (ctx: IServerCTX) => Promise<void>

export interface IServerConfig {
  port: number | string
  host: string
  enable: boolean
}

// Sync

export interface ISyncConfig {
  type: string
  file?: string
  username: string
  repo: string
  branch: string
  token: string
  endpoint?: string
  proxy?: string
  interval?: number
  // WebDAV specific fields
  webdavEndpoint?: string
  webdavUsername?: string
  webdavPassword?: string
  webdavAuthType?: 'basic' | 'digest'
  webdavSslEnabled?: boolean
  webdavSavePath?: string
}

// Image && PicBed
export interface ImgInfo {
  buffer?: Buffer
  base64Image?: string
  fileName?: string
  width?: number
  height?: number
  extname?: string
  imgUrl?: string
  id?: string
  type?: string
  [propName: string]: any
}

export interface IGalleryItem extends ImgInfo {
  src: string
  key: string
  intro: string
}

export interface IPicBedType {
  type: string
  name: string
  visible: boolean
}

// Config Settings
export interface IShortKeyConfig {
  enable: boolean
  key: string // 按键
  name: string
  label: string
  from?: string
}

export interface IPluginShortKeyConfig {
  key: string
  name: string
  label: string
  handle: IShortKeyHandler
}

export type IShortKeyConfigs = Record<string, IShortKeyConfig>

export interface IOldShortKeyConfigs {
  upload: string
}

export interface IKeyCommandType {
  key: string
  command: string
}

// Main process
export interface IBrowserWindowOptions {
  height: number
  width: number
  show: boolean
  fullscreenable: boolean
  resizable: boolean
  webPreferences: {
    preload?: string
    sandbox?: boolean
    nodeIntegration: boolean
    nodeIntegrationInWorker: boolean
    contextIsolation: boolean
    backgroundThrottling: boolean
    webSecurity?: boolean
  }
  vibrancy?: string | any
  frame?: boolean
  center?: boolean
  title?: string
  titleBarStyle?: string | any
  backgroundColor?: string
  autoHideMenuBar?: boolean
  transparent?: boolean
  icon?: string
  skipTaskbar?: boolean
  alwaysOnTop?: boolean
  [propName: string]: any
}

export interface IFileWithPath {
  path: string
  name?: string
}

export interface IBounds {
  x: number
  y: number
}

// PicGo Types
export type ICtx = PicGo
export interface IPicGoPlugin {
  name: string
  fullName: string
  author: string
  description: string
  logo: string
  version: string | number
  gui: boolean
  config:
    | {
        plugin: IPluginMenuConfig
        uploader: IPluginMenuConfig
        transformer: IPluginMenuConfig
        [index: string]: IPluginMenuConfig
      }
    | Record<string, any>
  enabled?: boolean
  homepage: string
  guiMenu?: any[]
  ing: boolean
  hasInstall?: boolean
  [propName: string]: any
}

export interface IPicGoPluginConfig {
  name: string
  type: string
  required: boolean
  default?: any
  alias?: string
  choices?: {
    name?: string
    value?: any
  }[]
  /** support markdown */
  tips?: string
  [propName: string]: any
}

export interface IPicGoPluginOriginConfig {
  name: string
  type: string
  required: boolean
  default?: any
  alias?: string
  choices?:
    | {
        name?: string
        value?: any
      }[]
    | (() => {
        name?: string
        value?: any
      }[])
  [propName: string]: any
}

export interface IPluginMenuConfig {
  name: string
  fullName?: string
  config: any[]
}

export interface INPMSearchResult {
  data: {
    objects: INPMSearchResultObject[]
  }
}

export interface INPMSearchResultObject {
  package: {
    name: string
    scope: string
    version: string
    description: string
    keywords: string[]
    author: {
      name: string
    }
    publisher: {
      username: string
    }
    links: {
      npm: string
      homepage: string
    }
  }
}

export type IDispose = () => void

// GuiApi
export interface IGuiApi {
  showInputBox: (options: IShowInputBoxOption) => Promise<string>
  showFileExplorer: (options: IShowFileExplorerOption) => Promise<string[]>
  upload: (input: IUploadOption) => Promise<ImgInfo[]>
  showNotification: (options?: IShowNotificationOption) => void
  showMessageBox: (options?: IShowMessageBoxOption) => Promise<IShowMessageBoxResult>
}

export interface IShowInputBoxOption {
  value?: string
  title: string
  placeholder: string
  multiLine?: boolean
}

export type IShowFileExplorerOption = IObj

export type IUploadOption = string[]

export interface IShowNotificationOption {
  title: string
  body: string
  // icon?: string | import('electron').NativeImage
}

export interface IPrivateShowNotificationOption extends IShowNotificationOption {
  /**
   * click notification to copy the body
   */
  clickToCopy?: boolean
  copyContent?: string // something to copy
  clickFn?: () => void
}

export interface IShowMessageBoxOption {
  title: string
  message: string
  type: string
  buttons: string[]
}

export interface IShowMessageBoxResult {
  result: number
  checkboxChecked: boolean
}

export interface IShortKeyHandlerObj {
  handle: IShortKeyHandler
  key: string
  label: string
}

export type IShortKeyHandler = (ctx: ICtx, guiApi?: IGuiApi) => Promise<void | ICtx>

export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export interface shortKeyHandlerMap {
  from: string
  handle: IShortKeyHandler
}

export interface ILocalConfig {
  path: string
  customUrl?: string
  webPath?: string
}

export interface IAliYunConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  area: string
  path?: string
  webPath?: string
  customUrl?: string
  options?: string
}

export interface IGitHubConfig {
  repo: string
  token: string
  path?: string
  customUrl?: string
  branch: string
}

export interface IImgurConfig {
  clientId?: string
  proxy?: string
  username?: string
  accessToken?: string
  album?: string
}

export interface IQiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  url: string
  area: 'z0' | 'z1' | 'z2' | 'na0' | 'as0' | string
  options?: string
  path?: string
}

export interface ISMMSConfig {
  token: string
  backupDomain?: string
}

export interface ITcYunConfig {
  secretId: string
  secretKey: string
  bucket: string
  appId: string
  endpoint: string
  area: string
  path?: string
  webPath?: string
  customUrl?: string
  version: 'v4' | 'v5'
  options?: string
  slim?: boolean
}

export interface IUpYunConfig {
  bucket: string
  operator: string
  password: string
  options?: string
  path?: string
  url: string
  antiLeechToken?: string
  expireTime?: number
  endpoint?: string
}

export interface IWebdavPlistConfig {
  host: string
  sslEnabled: boolean
  username: string
  password: string
  path?: string
  webpath?: string
  customUrl?: string
  authType: string
  options?: string
}

export interface ISftpPlistConfig {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
  uploadPath?: string
  customUrl?: string
  webPath?: string
  fileUser?: string
  fileMode?: string
  dirMode?: string
}

export interface IPicListConfig {
  host: string
  port?: number
  picbed?: string
  configName?: string
  serverKey?: string
}

export interface ILskyConfig {
  version: string
  host: string
  token: string
  strategyId: string
  albumId: string
  permission: IStringKeyMap
}

export interface IAwsS3PListUserConfig {
  accessKeyID: string
  secretAccessKey: string
  bucketName: string
  uploadPath: string
  region?: string
  endpoint?: string
  proxy?: string
  urlPrefix?: string
  pathStyleAccess?: boolean
  rejectUnauthorized?: boolean
  acl?: string
  disableBucketPrefixToURL?: boolean | string
}

export type ILoggerType = string | Error | boolean | number | undefined

export interface IAppNotification {
  title: string
  body: string
  icon?: string
}

export type IStringKeyMap = Record<string, any>

export type ILogArgvType = string | number

export type ILogArgvTypeWithError = ILogArgvType | Error

export interface IMiniWindowPos {
  x: number
  y: number
  height: number
  width: number
}

export type PromiseResType<T> = T extends Promise<infer R> ? R : T

export interface II18nItem {
  label: string
  value: string
}

export interface IRemoteNotice {
  version: number
  list: {
    versions: string[] // matched picgo version
    actions: IRemoteNoticeAction[]
    versionMatch?: 'exact' | 'gte' | 'lte'
  }[]
}

export interface IRemoteNoticeAction {
  type: string
  // trigger time
  hooks: string[]
  id: string
  // trigger count: always or once; default: once
  triggerCount: string

  data?: {
    title?: string
    content?: string
    desc?: string // action desc
    buttons?: IRemoteNoticeButton[]
    url?: string
    copyToClipboard?: string
    options: any // for other case
  }
}

export interface IRemoteNoticeButton {
  label: string
  labelEN?: string
  type: 'confirm' | 'cancel' | 'other'
  action: IRemoteNoticeAction
}

export type IRemoteNoticeLocalCountStorage = Record<string, true | number>

export interface IUploaderListItemMetaInfo {
  _id: string
  _configName: string
  _updatedAt: number
  _createdAt: number
}

export type IUploaderConfig = Record<string, IUploaderConfigItem>

export interface IUploaderConfigItem {
  configList: IUploaderConfigListItem[]
  defaultId: string
}

export type IUploaderConfigListItem = IStringKeyMap & IUploaderListItemMetaInfo

export type ICheckBoxValueType = boolean | string | number

export interface IHTTPProxy {
  host: string
  port: number
  protocol: string
}
