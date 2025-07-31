import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'

import { IRPCActionType, IRPCType, IToolboxItemCheckStatus, IToolboxItemType } from '#/types/enum'
export type IGetLatestVersionArgs = [isCheckBetaVersion: boolean]
export type IToolboxCheckArgs = [type: IToolboxItemType]
export type IShowDockIconArgs = [visible: boolean]

export interface IRPCServer {
  start: () => void
  stop: () => void
  use: (routes: IRPCRoutes) => void
}

export type IRPCRoutes = Map<
  IRPCActionType,
  {
    handler: IRPCHandler<any>
    type: IRPCType
  }
>

export type IIPCEvent = IpcMainEvent | IpcMainInvokeEvent

export type IRPCHandler<T> = (event: IIPCEvent, args: any) => Promise<T>

export interface IRPCRouter {
  add<T>(action: IRPCActionType, handler: IRPCHandler<T>, type: IRPCType): IRPCRouter
  routes: () => IRPCRoutes
}

export type IToolboxChecker<T = any> = (event: IpcMainEvent) => Promise<T>

export type IToolboxCheckerMap<T extends IToolboxItemType> =
Record<T, IToolboxChecker>

export type IToolboxFixMap<T extends IToolboxItemType> =
Record<T, IToolboxChecker<IToolboxCheckRes>>

export interface IToolboxCheckRes {
  type: IToolboxItemType
  status: IToolboxItemCheckStatus
  msg?: string
  value?: any
}
