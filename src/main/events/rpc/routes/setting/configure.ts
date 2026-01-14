import path from 'node:path'

import { dataDir } from '@core/datastore/dirs'
import logger from '@core/picgo/logger'
import { app } from 'electron'
import fs from 'fs-extra'

import { IRPCActionType, IRPCType } from '~/utils/enum'
import { downloadFile, syncGallery, uploadFile } from '~/utils/syncSettings'

const STORE_PATH = dataDir()

const commonConfigList = ['data.json', 'data.bak.json']
const manageConfigList = ['manage.json', 'manage.bak.json']

export default [
  {
    action: IRPCActionType.CONFIGURE_MIGRATE_FROM_PICGO,
    handler: async () => {
      const picGoConfigPath = app.getPath('userData').replace('piclist', 'picgo')
      const files = ['data.json', 'data.bak.json', 'picgo.db', 'picgo.bak.db']
      try {
        await Promise.all(
          files.map(async file => {
            const sourcePath = path.join(picGoConfigPath, file)
            const targetPath = path.join(STORE_PATH, file.replace('picgo', 'piclist'))
            await fs.copy(sourcePath, targetPath, { overwrite: true })
          }),
        )
        return true
      } catch (err: any) {
        logger.error(err)
        throw new Error('Migrate failed')
      }
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_UPLOAD_COMMON_CONFIG,
    handler: async () => {
      return await uploadFile(commonConfigList)
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_UPLOAD_MANAGE_CONFIG,
    handler: async () => {
      return await uploadFile(manageConfigList)
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_SYNC_GALLERY_DB,
    handler: async () => {
      return await syncGallery()
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_UPLOAD_ALL_CONFIG,
    handler: async () => {
      return await uploadFile([...commonConfigList, ...manageConfigList])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_DOWNLOAD_COMMON_CONFIG,
    handler: async () => {
      return await downloadFile(commonConfigList)
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_DOWNLOAD_MANAGE_CONFIG,
    handler: async () => {
      return await downloadFile(manageConfigList)
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_DOWNLOAD_ALL_CONFIG,
    handler: async () => {
      return await downloadFile([...commonConfigList, ...manageConfigList])
    },
    type: IRPCType.INVOKE,
  },
]
