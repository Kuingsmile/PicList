import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

export type IGetLatestVersionArgs = [isCheckBetaVersion: boolean]
export type IToolboxCheckArgs = [type: string]
export type IShowDockIconArgs = [visible: boolean]

export interface IRPCServer {
  start: () => void
  stop: () => void
  use: (routes: IRPCRoutes) => void
}

export type IRPCRoutes = Map<
  string,
  {
    handler: IRPCHandler<any>
    type: string
  }
>

export type IIPCEvent = IpcMainEvent | IpcMainInvokeEvent

export type IRPCHandler<T> = (event: IIPCEvent, args: any) => Promise<T>

export interface IRPCRouter {
  add<T>(action: string, handler: IRPCHandler<T>, type: string): IRPCRouter
  routes: () => IRPCRoutes
}

export type IToolboxChecker<T = any> = (event: IpcMainEvent) => Promise<T>

export type IToolboxCheckerMap<T extends string> = Record<T, IToolboxChecker>

export type IToolboxFixMap<T extends string> = Record<T, IToolboxChecker<IToolboxCheckRes>>

export interface IToolboxCheckRes {
  type: string
  status: string
  msg?: string
  value?: any
}
