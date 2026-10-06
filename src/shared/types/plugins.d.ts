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
    date?: string
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
