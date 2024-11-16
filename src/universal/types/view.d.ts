interface ISettingForm {
  showUpdateTip: boolean
  autoStart: boolean
  rename: boolean
  autoRename: boolean
  uploadNotification: boolean
  uploadResultNotification: boolean
  miniWindowOntop: boolean
  autoCloseMiniWindow: boolean
  autoCloseMainWindow: boolean
  logLevel: string[]
  autoCopy: boolean
  useBuiltinClipboard: boolean
  logFileSizeLimit: number
  deleteCloudFile: boolean
  isCustomMiniIcon: boolean
  customMiniIcon: string
  isHideDock: boolean
  autoImport: boolean
  autoImportPicBed: string[]
  encodeOutputURL: boolean
  isAutoListenClipboard: boolean
  useShortUrl: boolean
  shortUrlServer: string
  c1nToken: string
  yourlsDomain: string
  yourlsSignature: string
  cfWorkerHost: string
  sinkDomain: string
  sinkToken: string
  deleteLocalFile: boolean
  serverKey: string
  aesPassword: string
  enableWebServer: boolean
  webServerHost: string
  webServerPort: number
  webServerPath: string
  registry: string
  proxy: string
  mainWindowWidth: number
  mainWindowHeight: number
  enableSecondUploader: boolean
}

interface IShortKeyMap {
  [propName: string]: string
}

interface IToolboxItem {
  title: string
  status: import('#/types/enum').IToolboxItemCheckStatus
  msg?: string
  value?: any // for handler
  hasNoFixMethod?: boolean
  handler?: (value: any) => Promise<void> | void
  handlerText?: string
}

type IToolboxMap = {
  [id in import('#/types/enum').IToolboxItemType]: IToolboxItem
}
