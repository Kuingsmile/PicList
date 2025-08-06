import path from 'node:path'

import { app, dialog, shell } from 'electron'
import fs from 'fs-extra'

import type { IIPCEvent } from '#/types/rpc'
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import { downloadFileFromUrl } from '~/manage/utils/common'
import { IRPCActionType, IRPCType } from '~/utils/enum'

export default [
  {
    action: IRPCActionType.MANAGE_OPEN_FILE_SELECT_DIALOG,
    handler: async () => {
      const res = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
      })
      return res.canceled ? [] : res.filePaths
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_UPLOAD_TASK_LIST,
    handler: async () => {
      return UpDownTaskQueue.getInstance().getAllUploadTask()
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_DOWNLOAD_TASK_LIST,
    handler: async () => {
      return UpDownTaskQueue.getInstance().getAllDownloadTask()
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_DELETE_UPLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().removeUploadedTask()
    }
  },
  {
    action: IRPCActionType.MANAGE_DELETE_ALL_UPLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().clearUploadTaskQueue()
    }
  },
  {
    action: IRPCActionType.MANAGE_DELETE_DOWNLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().removeDownloadedTask()
    }
  },
  {
    action: IRPCActionType.MANAGE_DELETE_ALL_DOWNLOADED_TASK,
    handler: async () => {
      UpDownTaskQueue.getInstance().clearDownloadTaskQueue()
    }
  },
  {
    action: IRPCActionType.MANAGE_SELECT_DOWNLOAD_FOLDER,
    handler: async () => {
      const res = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })
      return res.filePaths[0]
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_GET_DEFAULT_DOWNLOAD_FOLDER,
    handler: async () => {
      return app.getPath('downloads')
    },
    type: IRPCType.INVOKE
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
    }
  },
  {
    action: IRPCActionType.MANAGE_OPEN_LOCAL_FILE,
    handler: async (_: IIPCEvent, args: [fullPath: string]) => {
      const fullPath = args[0]
      fs.existsSync(fullPath) ? shell.showItemInFolder(fullPath) : shell.openPath(path.dirname(fullPath))
    }
  },
  {
    action: IRPCActionType.MANAGE_DOWNLOAD_FILE_FROM_URL,
    handler: async (_: IIPCEvent, args: [urls: string[]]) => {
      return await downloadFileFromUrl(args[0])
    },
    type: IRPCType.INVOKE
  },
  {
    action: IRPCActionType.MANAGE_CONVERT_PATH_TO_BASE64,
    handler: async (_: IIPCEvent, args: [filePath: string]) => {
      return fs.readFileSync(args[0], 'base64')
    },
    type: IRPCType.INVOKE
  }
]
