import { manageConfigPath } from '@core/datastore/dirs'
import fs from 'fs-extra'

import { t } from '~/i18n'
import { notificationList } from '~/utils/notification'

function manageDbChecker() {
  if (process.type === 'renderer') return

  const configFilePath = manageConfigPath()
  let configFile: string
  try {
    configFile = fs.readFileSync(configFilePath, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
    throw error
  }

  try {
    JSON.parse(configFile)
  } catch {
    fs.unlinkSync(configFilePath)
    notificationList.push({
      title: t('main.notification.notice'),
      body: t('main.notification.configFileBrokenDefaultTips'),
    })
  }
}
export { manageDbChecker }
