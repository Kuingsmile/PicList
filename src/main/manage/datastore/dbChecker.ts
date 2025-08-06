import path from 'node:path'

import { getLogger } from '@core/utils/localLogger'
import dayjs from 'dayjs'
import { app } from 'electron'
import fs from 'fs-extra'
import writeFile from 'write-file-atomic'

import { notificationList } from '~/utils/notification'
import { T as $t } from '~/i18n'

const STORE_PATH = app.getPath('userData')
const manageConfigFilePath = path.join(STORE_PATH, 'manage.json')
export const defaultManageConfigPath = manageConfigFilePath
const manageConfigFileBackupPath = path.join(STORE_PATH, 'manage.bak.json')
let _configFilePath = ''
let hasCheckPath = false

const errorMsg = {
  broken: $t('TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_DEFAULT'),
  brokenButBackup: $t('TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_BACKUP')
}

function manageDbChecker () {
  if (process.type !== 'renderer') {
    const manageConfigFilePath = managePathChecker()
    if (!fs.existsSync(manageConfigFilePath)) {
      return
    }
    let configFile: string = '{}'
    const optionsTpl = {
      title: $t('TIPS_NOTICE'),
      body: ''
    }
    // config save bak
    try {
      configFile = fs.readFileSync(manageConfigFilePath, { encoding: 'utf-8' })
      JSON.parse(configFile)
    } catch (e) {
      fs.unlinkSync(manageConfigFilePath)
      if (fs.existsSync(manageConfigFileBackupPath)) {
        try {
          configFile = fs.readFileSync(manageConfigFileBackupPath, {
            encoding: 'utf-8'
          })
          JSON.parse(configFile)
          writeFile.sync(manageConfigFilePath, configFile, {
            encoding: 'utf-8'
          })
          const stats = fs.statSync(manageConfigFileBackupPath)
          optionsTpl.body = `${errorMsg.brokenButBackup}\n${$t('TIPS_PICGO_BACKUP_FILE_VERSION', {
            v: dayjs(stats.mtime).format('YYYY-MM-DD HH:mm:ss')
          })}`
          notificationList.push(optionsTpl)
          return
        } catch (e) {
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
      encoding: 'utf-8'
    })
  }
}

/**
 * Get manage config path
 */
function managePathChecker (): string {
  if (_configFilePath) {
    return _configFilePath
  }
  // defaultConfigPath
  _configFilePath = defaultManageConfigPath
  // if defaultConfig path is not exit
  // do not parse the content of config
  if (!fs.existsSync(defaultManageConfigPath)) {
    return _configFilePath
  }
  try {
    const configString = fs.readFileSync(defaultManageConfigPath, {
      encoding: 'utf-8'
    })
    const config = JSON.parse(configString)
    const userConfigPath: string = config.configPath || ''
    if (userConfigPath) {
      if (fs.existsSync(userConfigPath) && userConfigPath.endsWith('.json')) {
        _configFilePath = userConfigPath
        return _configFilePath
      }
    }
    return _configFilePath
  } catch (e) {
    const manageLogPath = path.join(STORE_PATH, 'manage-gui-local.log')
    const logger = getLogger(manageLogPath, 'Manage')
    if (!hasCheckPath) {
      const optionsTpl = {
        title: $t('TIPS_NOTICE'),
        body: $t('TIPS_CUSTOM_CONFIG_FILE_PATH_ERROR')
      }
      notificationList?.push(optionsTpl)
      hasCheckPath = true
    }
    logger('error', e)
    _configFilePath = defaultManageConfigPath
    return _configFilePath
  }
}

function managePathDir () {
  return path.dirname(managePathChecker())
}

export { manageDbChecker, managePathChecker, managePathDir }
