import { appConfigBackupPath, appConfigPath, dataDir, galleryDBBackupPath, galleryDBPath } from '@core/datastore/dirs'
import { JSONStore } from '@piclist/store'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import writeFile from 'write-file-atomic'

import { t } from '~/i18n'
import { recoverGallerySync } from '~/utils/gallerySync/storage'
import { notificationList } from '~/utils/notification'

function readConfig(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

function isValidConfig(content: string): boolean {
  try {
    JSON.parse(content)
    return true
  } catch {
    return false
  }
}

function backupGallery(): void {
  try {
    const dbPath = galleryDBPath()
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, galleryDBBackupPath())
    }
  } catch (error) {
    console.error(error)
  }
}

function restoreConfig(configFilePath: string, configFileBackupPath: string): void {
  const backup = readConfig(configFileBackupPath)
  let body: string

  if (backup !== undefined && isValidConfig(backup)) {
    const { mtime } = fs.statSync(configFileBackupPath)
    // Keep the original file until the validated backup is atomically installed.
    writeFile.sync(configFilePath, backup, { encoding: 'utf-8' })
    body = `${t('main.notification.configFileBrokenBackupTips')}\n${t('main.notification.backupConfigFileVersion', {
      version: dayjs(mtime).format('YYYY-MM-DD HH:mm:ss'),
    })}`
  } else {
    fs.unlinkSync(configFilePath)
    body = t('main.notification.configFileBrokenDefaultTips')
  }

  notificationList.push({ title: t('main.notification.notice'), body })
}

export default function dbChecker(): void {
  if (process.type === 'renderer') return

  // Recovery must finish before replacing the gallery's startup backup.
  recoverGallerySync(dataDir(), value => new JSONStore(appConfigPath()).set('settings.lastSyncTime', value))
  backupGallery()

  const configFilePath = appConfigPath()
  const configFile = readConfig(configFilePath)
  if (configFile === undefined) return

  const configFileBackupPath = appConfigBackupPath()
  if (!isValidConfig(configFile)) {
    restoreConfig(configFilePath, configFileBackupPath)
    return
  }

  writeFile.sync(configFileBackupPath, configFile, { encoding: 'utf-8' })
}
