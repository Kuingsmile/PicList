type IGetLatestVersionArgs = [isCheckBetaVersion: boolean]
type IToolboxCheckArgs = [type: string]
type IShowDockIconArgs = [visible: boolean]

interface IRPCServer {
  start: () => void
  stop: () => void
  use: (routes: IRPCRoutes) => void
}

type IRPCRoutes = Map<
  string,
  {
    handler: IRPCHandler<any>
    type: string
  }
>

type IIPCEvent = import('electron').IpcMainEvent | import('electron').IpcMainInvokeEvent

type IRPCHandler<T> = (event: IIPCEvent, args: any) => Promise<T>

interface IRPCRouter {
  add<T>(action: string, handler: IRPCHandler<T>, type: string): IRPCRouter
  routes: () => IRPCRoutes
}

type IToolboxChecker<T = any> = (event: import('electron').IpcMainEvent) => Promise<T>

type IToolboxCheckerMap<T extends string> = Record<T, IToolboxChecker>

type IToolboxFixMap<T extends string> = Record<T, IToolboxChecker<IToolboxCheckRes>>

interface IToolboxCheckRes {
  type: string
  status: string
  msg?: string
  value?: any
}
