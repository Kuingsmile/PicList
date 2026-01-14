import path from 'node:path'

import { getLogger } from '@core/utils/localLogger'
import { app } from 'electron'
import fs from 'fs-extra'

import { T as $t } from '~/i18n'
import { notificationList } from '~/utils/notification'

let _configFilePath = ''
let _manageConfigFilePath = ''
let hasCheckPath = false
let hasCheckManagePath = false

export function isPortable() {
  return fs.existsSync(path.join(exeDir(), 'PORTABLE'))
}

export function exePath() {
  return app.getPath('exe')
}

export function exeDir() {
  return path.dirname(exePath())
}

export function userDataDir() {
  return app.getPath('userData')
}

export function dataDir() {
  const configDir = path.dirname(appConfigPath())
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirsSync(configDir)
    }
  } catch (_e) {}
  return configDir
}

export function defaultDir() {
  if (isPortable()) return path.join(exeDir(), 'data')
  return userDataDir()
}

export function defaultConfigPath() {
  if (isPortable()) {
    return path.join(exeDir(), 'data', 'data.json')
  }
  return path.join(userDataDir(), 'data.json')
}

export function defaultManageConfigPath() {
  if (isPortable()) {
    return path.join(exeDir(), 'data', 'manage.json')
  }
  return path.join(userDataDir(), 'manage.json')
}

export function appConfigPath() {
  if (_configFilePath) return _configFilePath
  _configFilePath = defaultConfigPath()
  if (!fs.existsSync(_configFilePath)) return _configFilePath
  try {
    const configString = fs.readFileSync(_configFilePath, {
      encoding: 'utf-8',
    })
    const config = JSON.parse(configString)
    // extract custom data dir
    const userConfigPath: string = config.configPath || ''
    if (userConfigPath) {
      if (fs.existsSync(userConfigPath) && userConfigPath.endsWith('.json')) {
        _configFilePath = userConfigPath
        return _configFilePath
      }
    }
    return _configFilePath
  } catch (e) {
    const piclistLogPath = appGUILogPath()
    const logger = getLogger(piclistLogPath, 'PicList')
    if (!hasCheckPath) {
      const optionsTpl = {
        title: $t('TIPS_NOTICE'),
        body: $t('TIPS_CUSTOM_CONFIG_FILE_PATH_ERROR'),
      }
      notificationList.push(optionsTpl)
      hasCheckPath = true
    }
    logger('error', e)
    _configFilePath = defaultConfigPath()
    return _configFilePath
  }
}

export function themesDir() {
  return path.join(defaultDir(), 'themes')
}

export function appConfigBackupPath() {
  return path.join(dataDir(), 'data.bak.json')
}

export function galleryDBPath() {
  return path.join(dataDir(), 'piclist.db')
}

export function galleryDBBackupPath() {
  return path.join(dataDir(), 'piclist.bak.db')
}

export function manageConfigPath() {
  if (_manageConfigFilePath) return _manageConfigFilePath
  _manageConfigFilePath = defaultManageConfigPath()
  if (!fs.existsSync(_manageConfigFilePath)) return _manageConfigFilePath
  try {
    const configString = fs.readFileSync(_manageConfigFilePath, {
      encoding: 'utf-8',
    })
    const config = JSON.parse(configString)
    const userConfigPath: string = config.configPath || ''
    if (userConfigPath) {
      if (fs.existsSync(userConfigPath) && userConfigPath.endsWith('.json')) {
        _manageConfigFilePath = userConfigPath
        return _manageConfigFilePath
      }
    }
    return _manageConfigFilePath
  } catch (e) {
    const manageLogPath = manageGUILogPath()
    const logger = getLogger(manageLogPath, 'Manage')
    if (!hasCheckManagePath) {
      const optionsTpl = {
        title: $t('TIPS_NOTICE'),
        body: $t('TIPS_CUSTOM_CONFIG_FILE_PATH_ERROR'),
      }
      notificationList.push(optionsTpl)
      hasCheckManagePath = true
    }
    logger('error', e)
    _manageConfigFilePath = defaultManageConfigPath()
    return _manageConfigFilePath
  }
}

export function manageConfigBackupPath() {
  return path.join(dataDir(), 'manage.bak.json')
}

export function appLogPath() {
  return path.join(defaultDir(), 'piclist.log')
}

export function appGUILogPath() {
  return path.join(defaultDir(), 'piclist-gui-local.log')
}

export function manageGUILogPath() {
  return path.join(defaultDir(), 'manage-gui-local.log')
}

export function manageLogPath() {
  return path.join(defaultDir(), 'manage.log')
}
