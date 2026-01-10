import { uploadChoosedFiles, uploadClipboardFiles } from 'apis/app/uploader/apis'

import { RPCRouter } from '~/events/rpc/router'
import { IRPCActionType, IRPCType } from '~/utils/enum'
import getPicBeds from '~/utils/getPicBeds'
import UploadTaskQueueManager from '~/utils/uploadTaskQueue'

const uploadRouter = new RPCRouter()

const uploadRoutes = [
  {
    action: IRPCActionType.MAIN_GET_PICBED,
    handler: async () => {
      return getPicBeds()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE,
    handler: async () => {
      uploadClipboardFiles()
    },
  },
  {
    action: IRPCActionType.UPLOAD_CHOOSED_FILES,
    handler: async (evt: IIPCEvent, args: [files: IFileWithPath[]]) => {
      return uploadChoosedFiles(evt.sender, args[0])
    },
  },
  // Upload task queue routes
  {
    action: IRPCActionType.UPLOAD_TASK_ADD,
    handler: async (evt: IIPCEvent, args: [files: IFileWithPath[]]) => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.setWebContents(evt.sender)
      return manager.addTasks(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_START,
    handler: async (evt: IIPCEvent, args: [intervalS?: number]) => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.setWebContents(evt.sender)
      await manager.startQueue(args[0])
      return manager.getQueueStatus()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_PAUSE,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.pauseQueue()
      return manager.getQueueStatus()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_RESUME,
    handler: async (evt: IIPCEvent) => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.setWebContents(evt.sender)
      await manager.resumeQueue()
      return manager.getQueueStatus()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_CANCEL_ALL,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.cancelQueue()
      return manager.getQueueStatus()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_CANCEL_ONE,
    handler: async (_: IIPCEvent, args: [taskId: string]) => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.cancelTask(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_REMOVE_ONE,
    handler: async (_: IIPCEvent, args: [taskId: string]) => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.removeTask(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_CLEAR_FINISHED,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.clearFinishedTasks()
      return manager.getQueueStatus()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_CLEAR_ALL,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.clearAllTasks()
      return manager.getQueueStatus()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_GET_STATUS,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.getQueueStatus()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_SET_INTERVAL,
    handler: async (_: IIPCEvent, args: [intervalS: number]) => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.setInterval(args[0])
      return manager.getInterval()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_GET_INTERVAL,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.getInterval()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_RETRY_ONE,
    handler: async (_: IIPCEvent, args: [taskId: string]) => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.retryTask(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_RETRY_ALL_FAILED,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.retryAllFailed()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_MOVE_UP,
    handler: async (_: IIPCEvent, args: [taskId: string]) => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.moveTaskUp(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_MOVE_DOWN,
    handler: async (_: IIPCEvent, args: [taskId: string]) => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.moveTaskDown(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_SET_PRIORITY,
    handler: async (_: IIPCEvent, args: [taskId: string, priority: number]) => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.setTaskPriority(args[0], args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_UPDATE_SETTINGS,
    handler: async (_: IIPCEvent, args: [settings: any]) => {
      const manager = UploadTaskQueueManager.getInstance()
      manager.updateSettings(args[0])
      return manager.getSettings()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.UPLOAD_TASK_GET_SETTINGS,
    handler: async () => {
      const manager = UploadTaskQueueManager.getInstance()
      return manager.getSettings()
    },
    type: IRPCType.INVOKE,
  },
]

uploadRouter.addBatch(uploadRoutes)

export { uploadRouter }
