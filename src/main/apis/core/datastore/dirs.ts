import path from 'node:path'

import { getLogger } from '@core/utils/localLogger'
import { app } from 'electron'
import fs from 'fs-extra'

import { t } from '~/i18n'
import { notificationList } from '~/utils/notification'

let _configFilePath = ''
let _manageConfigFilePath = ''

function resolveConfigPath(defaultPath: string, getLogPath: () => string, logType: string): string {
  if (!fs.existsSync(defaultPath)) return defaultPath

  try {
    const config: { configPath?: unknown } | null = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'))
    const customPath = config?.configPath
    if (typeof customPath === 'string' && customPath.endsWith('.json') && fs.existsSync(customPath)) {
      return customPath
    }
  } catch (_e) {
    notificationList.push({
      title: t('main.notification.notice'),
      body: t('main.notification.customConfigFilePathError'),
    })
    // JSON parse errors can include configuration contents, so do not log the original error.
    getLogger(getLogPath(), logType)('error', 'Failed to read configuration path; using the default path.')
  }

  return defaultPath
}

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
    fs.ensureDirSync(configDir)
  } catch (_e) {}
  return configDir
}

export function defaultDir() {
  if (isPortable()) return path.join(exeDir(), 'data')
  return userDataDir()
}

export function scriptsDir() {
  return path.join(dataDir(), 'scripts')
}

export function defaultConfigPath() {
  return path.join(defaultDir(), 'data.json')
}

export function defaultManageConfigPath() {
  return path.join(defaultDir(), 'manage.json')
}

export function appConfigPath() {
  if (_configFilePath) return _configFilePath
  // Seed the cache before resolving, so error reporting can safely re-enter this getter.
  _configFilePath = defaultConfigPath()
  _configFilePath = resolveConfigPath(_configFilePath, appGUILogPath, 'PicList')
  return _configFilePath
}

export function themesDir() {
  return path.join(defaultDir(), 'themes')
}

export function galleryDBPath() {
  return path.join(dataDir(), 'piclist.db')
}

export function manageConfigPath() {
  if (_manageConfigFilePath) return _manageConfigFilePath
  _manageConfigFilePath = defaultManageConfigPath()
  _manageConfigFilePath = resolveConfigPath(_manageConfigFilePath, manageGUILogPath, 'Manage')
  return _manageConfigFilePath
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
