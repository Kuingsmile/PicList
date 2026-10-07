import { app, dialog, shell } from 'electron'
import fs from 'fs-extra'

import { IRPCActionType, IRPCType } from '~/constants'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import { transferScheduler } from '~/manage/transferScheduler'
import { downloadFileFromUrl } from '~/manage/utils/common'

export default [
  {
    action: IRPCActionType.MANAGE_CANCEL_UPLOAD_TASK,
    handler: async (_: IIPCEvent, args: [id: string]) => transferScheduler.cancel(args[0]),
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG,
    handler: async (_: IIPCEvent, args: [config?: Electron.OpenDialogOptions]) => {
      const res = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        ...args[0],
      })
      return res.canceled ? [] : res.filePaths
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_UPLOAD_TASK_LIST,
    handler: async () => {
      return UpDownTaskQueue.getInstance().getAllUploadTask()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_DOWNLOAD_TASK_LIST,
    handler: async () => {
      return UpDownTaskQueue.getInstance().getAllDownloadTask()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_DELETE_UPLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().removeUploadedTask()
    },
  },
  {
    action: IRPCActionType.MANAGE_DELETE_ALL_UPLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().clearUploadTaskQueue()
    },
  },
  {
    action: IRPCActionType.MANAGE_DELETE_DOWNLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().removeDownloadedTask()
    },
  },
  {
    action: IRPCActionType.MANAGE_DELETE_ALL_DOWNLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().clearDownloadTaskQueue()
    },
  },
  {
    action: IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER,
    handler: async () => {
      const res = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      })
      return res.filePaths[0]
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER,
    handler: async () => {
      return app.getPath('downloads')
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_OPEN_DOWNLOADED_FOLDER,
    handler: async (_: IIPCEvent, args: [path?: string]) => {
      const path = args[0]
      if (path) {
        shell.showItemInFolder(path)
      } else {
        shell.openPath(app.getPath('downloads'))
      }
    },
  },
  {
    action: IRPCActionType.MANAGE_DOWNLOAD_FILE_FROM_URL,
    handler: async (_: IIPCEvent, args: [urls: string[]]) => {
      return await downloadFileFromUrl(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_CONVERT_PATH_TO_BASE64,
    handler: async (_: IIPCEvent, args: [filePath: string]) => {
      return fs.readFileSync(args[0], 'base64')
    },
    type: IRPCType.INVOKE,
  },
]
