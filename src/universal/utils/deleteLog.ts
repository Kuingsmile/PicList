import { ILogType, IRPCActionType } from '#/types/enum'

export const deleteLog = (fileName?: string, type?: string, isSuccess = true, msg?: string) => {
  window.electron.sendRPC(
    IRPCActionType.GALLERY_LOG_DELETE_MSG,
    msg || `Delete ${fileName} on ${type} success`,
    isSuccess ? ILogType.success : ILogType.error
  )
}

export const deleteFailedLog = (fileName: string, type: string, error: any) => {
  deleteLog(fileName, type, false)
  window.electron.sendRPC(IRPCActionType.GALLERY_LOG_DELETE_MSG, error, ILogType.error)
}
