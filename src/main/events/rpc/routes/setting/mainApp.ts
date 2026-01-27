import path from 'node:path'

import { appGUILogPath, appLogPath, dataDir, manageLogPath, scriptsDir } from '@core/datastore/dirs'
import picgo from '@core/picgo'
import { IpcMainEvent, shell } from 'electron'
import fs from 'fs-extra'

import logger from '~/apis/core/picgo/logger'
import { isAutoStartEnabled, setAutoStart } from '~/utils/autoStart'
import { getDirectoryTree } from '~/utils/common'
import { IRPCActionType, IRPCType } from '~/utils/enum'
import { runScript } from '~/utils/runScript'

const STORE_PATH = dataDir()

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
      let abFilePath = path.join(STORE_PATH, args[0])
      switch (args[0]) {
        case 'piclist.log':
          abFilePath = appLogPath()
          break
        case 'piclist-gui-local.log':
          abFilePath = appGUILogPath()
          break
        case 'manage.log':
          abFilePath = manageLogPath()
          break
        default:
          abFilePath = path.join(STORE_PATH, args[0])
      }
      if (!fs.existsSync(abFilePath)) {
        fs.writeFileSync(abFilePath, '')
      }
      shell.openPath(abFilePath)
    },
  },
  {
    action: IRPCActionType.READ_FILE_CONTENT,
    handler: async (_: IIPCEvent, args: [fileName: string]) => {
      const abFilePath = path.join(STORE_PATH, args[0])
      if (!fs.existsSync(abFilePath)) {
        fs.writeFileSync(abFilePath, '')
      }
      return fs.readFileSync(abFilePath, 'utf-8')
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.WRITE_FILE_CONTENT,
    handler: async (_: IIPCEvent, args: [fileName: string, content: string]) => {
      const abFilePath = path.join(STORE_PATH, args[0])
      fs.ensureDirSync(path.dirname(abFilePath))
      fs.writeFileSync(abFilePath, args[1], 'utf-8')
    },
  },
  {
    action: IRPCActionType.RUN_SCRIPT_FILE,
    handler: async (_: IIPCEvent, args: [fileName: string[]]) => {
      const abFilePath = path.join(scriptsDir(), ...args[0])
      if (!fs.existsSync(abFilePath)) {
        throw new Error('Script file does not exist')
      }
      const scriptContent = fs.readFileSync(abFilePath, 'utf-8')
      try {
        await runScript(picgo, scriptContent, {})
        logger.info(`Script ${args[0].join('/')} executed successfully`)
        return 'Script executed successfully'
      } catch (e) {
        return Error(`Script execution failed: ${e}`)
      }
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CREATE_SCRIPTS_FILE,
    handler: async (_: IIPCEvent, args: [fileName: string[], content: string]) => {
      const abFilePath = path.join(scriptsDir(), ...args[0])
      fs.ensureDirSync(path.dirname(abFilePath))
      fs.writeFileSync(abFilePath, args[1], 'utf-8')
    },
  },
  {
    action: IRPCActionType.READ_SCRIPTS_FILE,
    handler: async (_: IIPCEvent, args: [fileName: string[]]) => {
      const abFilePath = path.join(scriptsDir(), ...args[0])
      if (!fs.existsSync(abFilePath)) {
        return null
      }
      return fs.readFileSync(abFilePath, 'utf-8')
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.LIST_SCRIPTS_FILES,
    handler: async (_: IIPCEvent, args: [dirPath: string[]]) => {
      const dir = scriptsDir()
      const targetDir = path.join(dir, ...(args[0] || []))

      if (!(await fs.pathExists(targetDir))) {
        return {}
      }

      try {
        return await getDirectoryTree(targetDir)
      } catch (error) {
        console.error('Failed to list scripts:', error)
        return {}
      }
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.WRITE_SCRIPT_FILE,
    handler: async (_: IIPCEvent, args: [fileName: string[], content: string]) => {
      const abFilePath = path.join(scriptsDir(), ...args[0])
      fs.ensureDirSync(path.dirname(abFilePath))
      fs.writeFileSync(abFilePath, args[1], 'utf-8')
    },
  },
  {
    action: IRPCActionType.DELETE_SCRIPTS_FILE,
    handler: async (_: IIPCEvent, args: [fileName: string[]]) => {
      const abFilePath = path.join(scriptsDir(), ...args[0])
      if (fs.existsSync(abFilePath)) {
        fs.unlinkSync(abFilePath)
      }
    },
  },
  {
    action: IRPCActionType.GET_FILES_STAT,
    handler: async (_: IIPCEvent, [filePaths, type]: [string[][], 'scripts' | 'config']) => {
      const basePath = type === 'scripts' ? scriptsDir() : STORE_PATH
      const result: IObj[] = []
      const statPromises = filePaths.map(async filePath => {
        const absolutePath = path.join(basePath, ...filePath)
        try {
          return await fs.promises.stat(absolutePath)
        } catch {
          return undefined
        }
      })
      const statsResults = await Promise.all(statPromises)

      for (const [index, item] of filePaths.entries()) {
        result.push({
          fileName: item[item.length - 1],
          stats: statsResults[index],
          category: item.length > 1 ? item.slice(0, -1).join('.') : '',
          filePath: item,
        })
      }
      return result
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.PICLIST_OPEN_DIRECTORY,
    handler: async (_: IIPCEvent, args: [dirPath?: string, inStorePath?: boolean]) => {
      let [dirPath] = args
      const [inStorePath = true] = args
      if (inStorePath) {
        dirPath = path.join(STORE_PATH, dirPath || '')
      }
      if (!dirPath) {
        return
      }
      fs.ensureDirSync(dirPath)
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
