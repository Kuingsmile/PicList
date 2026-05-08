type IObj = Record<string, any>

type IObjT<T> = Record<string, T>

interface ErrnoException extends Error {
  errno?: number | string
  code?: string
  path?: string
  syscall?: string
  stack?: string
}

// Server
type IHttpResponse = import('node:http').ServerResponse

interface IServerCTX {
  response: IHttpResponse
  [propName: string]: any
}

type routeHandler = (ctx: IServerCTX) => Promise<void>

interface IServerConfig {
  port: number | string
  host: string
  enable: boolean
}

// Sync

interface ISyncConfig {
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
interface ImgInfo {
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

interface IGalleryItem extends ImgInfo {
  src: string
  key: string
  intro: string
}

interface IPicBedType {
  type: string
  name: string
  visible: boolean
}

// Config Settings
interface IShortKeyConfig {
  enable: boolean
  key: string // 按键
  name: string
  label: string
  from?: string
}

interface IPluginShortKeyConfig {
  key: string
  name: string
  label: string
  handle: IShortKeyHandler
}

type IShortKeyConfigs = Record<string, IShortKeyConfig>

interface IKeyCommandType {
  key: string
  command: string
}

// Main process
interface IBrowserWindowOptions {
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

interface IFileWithPath {
  path: string
  name?: string
}

interface IBounds {
  x: number
  y: number
}

// PicGo Types
type ICtx = import('piclist').PicGo
interface IPicGoPlugin {
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

interface IPicGoPluginConfig {
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

interface IPicGoPluginOriginConfig {
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

interface IPluginMenuConfig {
  name: string
  fullName?: string
  config: any[]
}

interface INPMSearchResultObject {
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

type IDispose = () => void

// GuiApi
interface IGuiApi {
  showInputBox: (options: IShowInputBoxOption) => Promise<string>
  showFileExplorer: (options: IShowFileExplorerOption) => Promise<string[]>
  upload: (input: IUploadOption) => Promise<ImgInfo[]>
  showNotification: (options?: IShowNotificationOption) => void
  showMessageBox: (options?: IShowMessageBoxOption) => Promise<IShowMessageBoxResult>
}

interface IShowInputBoxOption {
  value?: string
  title: string
  placeholder: string
  multiLine?: boolean
}

type IShowFileExplorerOption = IObj

type IUploadOption = string[]

interface IShowNotificationOption {
  title: string
  body: string
  // icon?: string | import('electron').NativeImage
}

interface IPrivateShowNotificationOption extends IShowNotificationOption {
  /**
   * click notification to copy the body
   */
  clickToCopy?: boolean
  copyContent?: string // something to copy
  clickFn?: () => void
}

interface IShowMessageBoxOption {
  title: string
  message: string
  type: string
  buttons: string[]
}

interface IShowMessageBoxResult {
  result: number
  checkboxChecked: boolean
}

type IShortKeyHandler = (ctx: ICtx, guiApi?: IGuiApi) => Promise<void | ICtx>

type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

interface ILocalConfig {
  path: string
  customUrl?: string
  webPath?: string
}

interface IAliYunConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  area: string
  path?: string
  webPath?: string
  customUrl?: string
  options?: string
}

interface IGitHubConfig {
  repo: string
  token: string
  path?: string
  webPath?: string
  customUrl?: string
  branch: string
}

interface IImgurConfig {
  clientId?: string
  proxy?: string
  username?: string
  accessToken?: string
  album?: string
}

interface IQiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  url: string
  area: 'z0' | 'z1' | 'z2' | 'na0' | 'as0' | string
  options?: string
  path?: string
}

interface ISMMSConfig {
  token: string
}

interface ITcYunConfig {
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

interface IUpYunConfig {
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

interface IWebdavPlistConfig {
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

interface ISftpPlistConfig {
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

interface IPicListConfig {
  host: string
  port?: number
  picbed?: string
  configName?: string
  serverKey?: string
}

interface ILskyConfig {
  version: string
  host: string
  token: string
  strategyId: string
  albumId: string
  permission: IStringKeyMap
}

interface IAwsS3PListUserConfig {
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

type ILoggerType = string | Error | boolean | number | undefined

interface IAppNotification {
  title: string
  body: string
  icon?: string
}

type IStringKeyMap = Record<string, any>

type ILogArgvType = string | number

type ILogArgvTypeWithError = ILogArgvType | Error

interface IMiniWindowPos {
  x: number
  y: number
  height: number
  width: number
}

type PromiseResType<T> = T extends Promise<infer R> ? R : T

interface II18nItem {
  label: string
  value: string
}

interface IRemoteNotice {
  version: number
  list: {
    versions: string[] // matched picgo version
    actions: IRemoteNoticeAction[]
    versionMatch?: 'exact' | 'gte' | 'lte'
  }[]
}

interface IRemoteNoticeAction {
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

interface IRemoteNoticeButton {
  label: string
  labelEN?: string
  type: 'confirm' | 'cancel' | 'other'
  action: IRemoteNoticeAction
}

type IRemoteNoticeLocalCountStorage = Record<string, true | number>

interface IUploaderListItemMetaInfo {
  _id: string
  _configName: string
  _updatedAt: number
  _createdAt: number
}

type IUploaderConfig = Record<string, IUploaderConfigItem>

interface IUploaderConfigItem {
  configList: IUploaderConfigListItem[]
  defaultId: string
}

type IUploaderConfigListItem = IStringKeyMap & IUploaderListItemMetaInfo

type ICheckBoxValueType = boolean | string | number

interface IHTTPProxy {
  host: string
  port: number
  protocol: string
}

interface IGalleryDBGalleryItem {
  id: string
  updatedAt?: number
  [propName: string]: any
}
interface IGalleryDBFile {
  gallery: IGalleryDBGalleryItem[]
  __gallery_KEY__: Record<string, number>
}

interface IBuildInListItem {
  id: string
  compress?: Partial<import('piclist').IBuildInCompressOptionsTreated>
  watermark?: Partial<import('piclist').IBuildInWaterMarkOptionsTreated>
  skipProcess?: import('piclist').IBuildInSkipProcessOptions
  rename?: {
    enable?: boolean
    format?: string
  }
  // settings.autoRename
  autoRename?: boolean
  // settings.rename
  manualRename?: boolean
}

interface IFavoritePicbedItem {
  id: string
  type: string
  configName: string
}

interface IuploadReturnCtxResult {
  ctx: import('piclist').IPicGo | undefined
  backupCtx: import('piclist').IPicGo | undefined
}

type IScriptLifecycle =
  | 'onSoftwareOpen'
  | 'onSoftwareClose'
  | 'preProcess'
  | 'beforeTransform'
  | 'transform'
  | 'beforeUpload'
  | 'upload'
  | 'afterUpload'
  | 'onUploadSuccess'
  | 'onGalleryRemove'
  | 'manualTrigger'
  | 'uploader.advancedplist'
