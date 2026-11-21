import { randomUUID } from 'node:crypto'
import fs from 'node:fs'

import { type IJSON, JSONStore, StoreError } from '@piclist/store'

import { t } from '~/i18n'
import { notificationList } from '~/utils/notifications'

export function readConfigFile(filePath: string): IJSON {
  return new JSONStore<IJSON>(filePath).read()
}

export function checkConfigFile(filePath: string): void {
  try {
    readConfigFile(filePath)
  } catch (error) {
    if (!(error instanceof StoreError && error.code === 'INVALID_STORE')) throw error

    // Move the actual file so a backup of a symlinked config retains its contents.
    const originalPath = fs.realpathSync(filePath)
    const backupPath = `${originalPath}.broken-${randomUUID()}.bak`
    fs.renameSync(originalPath, backupPath)
    notificationList.push({
      title: t('main.notification.notice'),
      body: t('main.notification.configFileBrokenDefaultTips', { path: backupPath }),
    })
  }
}
