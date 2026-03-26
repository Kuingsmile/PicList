import { manageConfigBackupPath, manageConfigPath } from '@core/datastore/dirs'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import writeFile from 'write-file-atomic'

import { t } from '~/i18n'
import { notificationList } from '~/utils/notification'

const manageConfigFilePath = manageConfigPath()
const manageConfigFileBackupPath = manageConfigBackupPath()

const errorMsg = {
  broken: t('main.notification.configFileBrokenDefaultTips'),
  brokenButBackup: t('main.notification.configFileBrokenBackupTips'),
}

function manageDbChecker() {
  if (process.type !== 'renderer') {
    if (!fs.existsSync(manageConfigFilePath)) {
      return
    }
    let configFile: string
    const optionsTpl = {
      title: t('main.notification.notice'),
      body: '',
    }
    // config save bak
    try {
      configFile = fs.readFileSync(manageConfigFilePath, { encoding: 'utf-8' })
      JSON.parse(configFile)
    } catch (_e) {
      fs.unlinkSync(manageConfigFilePath)
      if (fs.existsSync(manageConfigFileBackupPath)) {
        try {
          configFile = fs.readFileSync(manageConfigFileBackupPath, {
            encoding: 'utf-8',
          })
          JSON.parse(configFile)
          writeFile.sync(manageConfigFilePath, configFile, {
            encoding: 'utf-8',
          })
          const stats = fs.statSync(manageConfigFileBackupPath)
          optionsTpl.body = `${errorMsg.brokenButBackup}\n${t('main.notification.backupConfigFileVersion', {
            version: dayjs(stats.mtime).format('YYYY-MM-DD HH:mm:ss'),
          })}`
          notificationList.push(optionsTpl)
          return
        } catch (_e) {
          optionsTpl.body = errorMsg.broken
          notificationList.push(optionsTpl)
          return
        }
      }
      optionsTpl.body = errorMsg.broken
      notificationList.push(optionsTpl)
      return
    }
    writeFile.sync(manageConfigFileBackupPath, configFile, {
      encoding: 'utf-8',
    })
  }
}
export { manageDbChecker }
