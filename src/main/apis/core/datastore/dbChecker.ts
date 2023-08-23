// External dependencies
import fs from 'fs-extra'
import dayjs from 'dayjs'
import path from 'path'

// Electron modules
import { app } from 'electron'

// Custom utilities and modules
import { getLogger } from '../utils/localLogger'

// Custom types/enums

// External utility functions

// External utility functions
import writeFile from 'write-file-atomic'

// Custom types/enums
import { T } from '~/main/i18n'

const STORE_PATH = app.getPath('userData')
const configFilePath = path.join(STORE_PATH, 'data.json')
const configFileBackupPath = path.join(STORE_PATH, 'data.bak.json')
export const defaultConfigPath = configFilePath
let _configFilePath = ''
let hasCheckPath = false

const errorMsg = {
  broken: T('TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_DEFAULT'),
  brokenButBackup: T('TIPS_PICGO_CONFIG_FILE_BROKEN_WITH_BACKUP')
}

/** ensure notification list */
if (!global.notificationList) global.notificationList = []

function dbChecker () {
  if (process.type !== 'renderer') {
    // db save bak
    try {
      const { dbPath, dbBackupPath } = getGalleryDBPath()
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, dbBackupPath)
      }
    } catch (e) {
      console.error(e)
    }

    const configFilePath = dbPathChecker()
    if (!fs.existsSync(configFilePath)) {
      return
    }
    let configFile: string = '{}'
    const optionsTpl = {
      title: T('TIPS_NOTICE'),
      body: ''
    }
    // config save bak
    try {
      configFile = fs.readFileSync(configFilePath, { encoding: 'utf-8' })
      JSON.parse(configFile)
    } catch (e) {
      fs.unlinkSync(configFilePath)
      if (fs.existsSync(configFileBackupPath)) {
        try {
          configFile = fs.readFileSync(configFileBackupPath, { encoding: 'utf-8' })
          JSON.parse(configFile)
          writeFile.sync(configFilePath, configFile, { encoding: 'utf-8' })
          const stats = fs.statSync(configFileBackupPath)
          optionsTpl.body = `${errorMsg.brokenButBackup}\n${T('TIPS_PICGO_BACKUP_FILE_VERSION', {
            v: dayjs(stats.mtime).format('YYYY-MM-DD HH:mm:ss')
          })}`
          global.notificationList?.push(optionsTpl)
          return
        } catch (e) {
          optionsTpl.body = errorMsg.broken
          global.notificationList?.push(optionsTpl)
          return
        }
      }
      optionsTpl.body = errorMsg.broken
      global.notificationList?.push(optionsTpl)
      return
    }
    writeFile.sync(configFileBackupPath, configFile, { encoding: 'utf-8' })
  }
}

/**
 * Get config path
 */
function dbPathChecker (): string {
  if (_configFilePath) {
    return _configFilePath
  }
  _configFilePath = defaultConfigPath
  // if defaultConfig path is not exit
  // do not parse the content of config
  if (!fs.existsSync(defaultConfigPath)) {
    return _configFilePath
  }
  try {
    const configString = fs.readFileSync(defaultConfigPath, { encoding: 'utf-8' })
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
    const piclistLogPath = path.join(STORE_PATH, 'piclist-gui-local.log')
    const logger = getLogger(piclistLogPath, 'PicList')
    if (!hasCheckPath) {
      const optionsTpl = {
        title: T('TIPS_NOTICE'),
        body: T('TIPS_CUSTOM_CONFIG_FILE_PATH_ERROR')
      }
      global.notificationList?.push(optionsTpl)
      hasCheckPath = true
    }
    logger('error', e)
    _configFilePath = defaultConfigPath
    return _configFilePath
  }
}

function dbPathDir () {
  return path.dirname(dbPathChecker())
}

function getGalleryDBPath (): {
  dbPath: string
  dbBackupPath: string
} {
  const configPath = dbPathChecker()
  const dbPath = path.join(path.dirname(configPath), 'piclist.db')
  const dbBackupPath = path.join(path.dirname(dbPath), 'piclist.bak.db')
  return {
    dbPath,
    dbBackupPath
  }
}

export {
  dbChecker,
  dbPathChecker,
  dbPathDir,
  getGalleryDBPath
}
