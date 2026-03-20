import { appConfigBackupPath, appConfigPath, galleryDBBackupPath, galleryDBPath } from '@core/datastore/dirs'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import writeFile from 'write-file-atomic'

import { T as $t } from '~/i18n'
import { notificationList } from '~/utils/notification'

const configFileBackupPath = appConfigBackupPath()

const errorMsg = {
  broken: $t('TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_DEFAULT'),
  brokenButBackup: $t('TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_BACKUP'),
}

function dbChecker() {
  if (process.type !== 'renderer') {
    // db save bak
    try {
      const dbPath = galleryDBPath()
      const dbBackupPath = galleryDBBackupPath()
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, dbBackupPath)
      }
    } catch (e) {
      console.error(e)
    }

    const configFilePath = appConfigPath()
    if (!fs.existsSync(configFilePath)) {
      return
    }
    let configFile: string
    const optionsTpl = {
      title: $t('TIPS_NOTICE'),
      body: '',
    }
    // config save bak
    try {
      configFile = fs.readFileSync(configFilePath, { encoding: 'utf-8' })
      JSON.parse(configFile)
    } catch (_e) {
      fs.unlinkSync(configFilePath)
      if (fs.existsSync(configFileBackupPath)) {
        try {
          configFile = fs.readFileSync(configFileBackupPath, {
            encoding: 'utf-8',
          })
          JSON.parse(configFile)
          writeFile.sync(configFilePath, configFile, { encoding: 'utf-8' })
          const stats = fs.statSync(configFileBackupPath)
          optionsTpl.body = `${errorMsg.brokenButBackup}\n${$t('TIPS_PICGO_BACKUP_FILE_VERSION', {
            v: dayjs(stats.mtime).format('YYYY-MM-DD HH:mm:ss'),
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
    writeFile.sync(configFileBackupPath, configFile, { encoding: 'utf-8' })
  }
}

export { dbChecker }
