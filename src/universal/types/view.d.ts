interface ISettingForm {
  updateHelper: boolean
  showPicBedList: string[]
  autoStart: boolean
  rename: boolean
  autoRename: boolean
  uploadNotification: boolean
  uploadResultNotification: boolean
  miniWindowOntop: boolean
  autoCloseMiniWindow: boolean
  autoCloseMainWindow: boolean
  logLevel: string[]
  autoCopyUrl: boolean
  checkBetaUpdate: boolean
  useBuiltinClipboard: boolean
  language: string
  logFileSizeLimit: number,
  deleteCloudFile: boolean,
  isCustomMiniIcon: boolean,
  customMiniIcon: string,
  isHideDock: boolean,
  autoImport: boolean,
  autoImportPicBed: string[],
  encodeOutputURL: boolean,
  isAutoListenClipboard: boolean,
  useShortUrl: boolean,
  shortUrlServer: string,
  yourlsDomain: string,
  yourlsSignature: string,
  deleteLocalFile: boolean,
  serverKey: string
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
