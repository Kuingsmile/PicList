import path from 'node:path'

import { dataDir } from '@core/datastore/dirs'
import logger from '@core/picgo/logger'
import { app, dialog } from 'electron'
import fs from 'fs-extra'

import type { GallerySyncRequest } from '#/types/gallerySync'
import { IRPCActionType, IRPCType } from '~/utils/enum'
import { GallerySyncError } from '~/utils/gallerySync/model'
import {
  downloadFile,
  exportGallerySyncSnapshot,
  exportGallerySyncSummary,
  syncGallery,
  uploadFile,
} from '~/utils/syncSettings'

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
        throw new Error('Migrate failed', { cause: err })
      }
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.CONFIGURE_MIGRATE_FROM_PICLIST_INSTALLATION,
    handler: async () => {
      const configDir = app.getPath('userData')
      const files = [
        'data.json',
        'data.bak.json',
        'manage.json',
        'manage.bak.json',
        'piclist.db',
        'piclist.bak.db',
        'taskQueue.json',
        'UpDownTaskQueue.json',
        'packages.json',
      ]
      const folders = [
        'themes',
        'piclistTemp',
        'serverTemp',
        'i18n',
        'i18n-cli',
        'piclist-clipboard-images',
        'imgTemp',
        'node_modules',
      ]
      try {
        await Promise.all(
          files.map(async file => {
            const sourcePath = path.join(configDir, file)
            const targetPath = path.join(STORE_PATH, file)
            await fs.copy(sourcePath, targetPath, { overwrite: true })
          }),
        )
        await Promise.all(
          folders.map(async folder => {
            const sourcePath = path.join(configDir, folder)
            const targetPath = path.join(STORE_PATH, folder)
            await fs.copy(sourcePath, targetPath, { overwrite: true })
          }),
        )
      } catch (err: any) {
        logger.error(err)
        throw new Error('Migrate failed', { cause: err })
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
    handler: async (_: IIPCEvent, args: [GallerySyncRequest?] = []) => {
      const request = args[0] ?? { action: 'preview' }
      try {
        if (request.action === 'export-summary' || request.action === 'export-rollback') {
          const summary = request.action === 'export-summary'
          const content = summary
            ? exportGallerySyncSummary(request.planId)
            : exportGallerySyncSnapshot(request.snapshotId)
          const result = await dialog.showSaveDialog({
            defaultPath: summary ? 'gallery-sync-summary.json' : 'gallery-rollback.json.gz',
            filters: [
              {
                name: summary ? 'Redacted sync summary' : 'Full gallery rollback snapshot',
                extensions: [summary ? 'json' : 'gz'],
              },
            ],
          })
          if (result.canceled || !result.filePath) return false
          await fs.writeFile(result.filePath, content)
          return true
        }
        return await syncGallery(request)
      } catch (error) {
        return {
          error: error instanceof GallerySyncError ? error.message : 'Gallery sync or export failed.',
          snapshotId: error instanceof GallerySyncError ? error.snapshotId : undefined,
        }
      }
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
