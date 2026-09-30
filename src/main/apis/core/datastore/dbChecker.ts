import { appConfigPath, dataDir } from '@core/datastore/dirs'
import { JSONStore } from '@piclist/store'
import fs from 'fs-extra'

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

export default function dbChecker(): void {
  if (process.type === 'renderer') return

  // Finish interrupted sync recovery before any store reads the gallery.
  recoverGallerySync(dataDir(), value => new JSONStore(appConfigPath()).set('settings.lastSyncTime', value))

  const configFilePath = appConfigPath()
  const configFile = readConfig(configFilePath)
  if (configFile === undefined) return

  if (!isValidConfig(configFile)) {
    fs.unlinkSync(configFilePath)
    notificationList.push({
      title: t('main.notification.notice'),
      body: t('main.notification.configFileBrokenDefaultTips'),
    })
  }
}
