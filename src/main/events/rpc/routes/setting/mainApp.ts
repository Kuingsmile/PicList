import path from 'node:path'

import { dbPathDir } from '@core/datastore/dbChecker'
import picgo from '@core/picgo'
import { IpcMainEvent, shell } from 'electron'
import fs from 'fs-extra'

import { isAutoStartEnabled, setAutoStart } from '~/utils/autoStart'
import { IRPCActionType, IRPCType } from '~/utils/enum'

const STORE_PATH = dbPathDir()

export default [
  {
    action: IRPCActionType.PICLIST_GET_CONFIG,
    handler: async (_: IIPCEvent, args: [key?: string]) => {
      return picgo.getConfig(args[0])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.PICLIST_GET_CONFIG_SYNC,
    handler: async (event: IIPCEvent, args: [key?: string]) => {
      const result = picgo.getConfig(args[0])
      const eventInstance = event as IpcMainEvent
      eventInstance.returnValue = result
    },
  },
  {
    action: IRPCActionType.PICLIST_SAVE_CONFIG,
    handler: async (_: IIPCEvent, args: [data: IObj]) => {
      picgo.saveConfig(args[0])
    },
  },
  {
    action: IRPCActionType.PICLIST_OPEN_FILE,
    handler: async (_: IIPCEvent, args: [fileName: string]) => {
      const abFilePath = path.join(STORE_PATH, args[0])
      if (!fs.existsSync(abFilePath)) {
        fs.writeFileSync(abFilePath, '')
      }
      shell.openPath(abFilePath)
    },
  },
  {
    action: IRPCActionType.PICLIST_OPEN_DIRECTORY,
    handler: async (_: IIPCEvent, args: [dirPath?: string, inStorePath?: boolean]) => {
      let [dirPath] = args
      const [inStorePath = true] = args
      if (inStorePath) {
        dirPath = path.join(STORE_PATH, dirPath || '')
      }
      if (!dirPath || !fs.existsSync(dirPath)) {
        return
      }
      shell.openPath(dirPath)
    },
  },
  {
    action: IRPCActionType.PICLIST_AUTO_START,
    handler: async (_: IIPCEvent, args: [val: boolean]) => {
      await setAutoStart(args[0])
    },
  },
  {
    action: IRPCActionType.PICLIST_AUTO_START_STATUS,
    handler: async (_: IIPCEvent) => {
      return await isAutoStartEnabled()
    },
    type: IRPCType.INVOKE,
  },
]
