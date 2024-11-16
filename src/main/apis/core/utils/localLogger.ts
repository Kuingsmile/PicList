import fs from 'fs-extra'
import dayjs from 'dayjs'
import util from 'util'

const MB = 1024 * 1024
const DEFAULT_LOG_FILE_SIZE_LIMIT = 10 * MB

interface CheckLogFileResult {
  isLarge: boolean
  logFileSize?: number
  logFileSizeLimit?: number
}

const checkLogFileIsLarge = (logPath: string): CheckLogFileResult => {
  try {
    if (fs.existsSync(logPath)) {
      const logFileSize = fs.statSync(logPath).size
      return {
        isLarge: logFileSize > DEFAULT_LOG_FILE_SIZE_LIMIT,
        logFileSize,
        logFileSizeLimit: DEFAULT_LOG_FILE_SIZE_LIMIT
      }
    }
    return { isLarge: false }
  } catch (e) {
    console.log(e)
    return { isLarge: true }
  }
}

const recreateLogFile = (logPath: string): void => {
  try {
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath)
      fs.createFileSync(logPath)
    }
  } catch (e) {
    console.log(e)
  }
}

/**
 * for local log before piclist inited
 */
const getLogger = (logPath: string, logType: string) => {
  let hasUncathcedError = false
  try {
    fs.ensureFileSync(logPath)
    if (checkLogFileIsLarge(logPath).isLarge) {
      recreateLogFile(logPath)
    }
  } catch (e) {
    console.log(e)
    hasUncathcedError = true
  }
  return (type: string, ...msg: any[]) => {
    if (hasUncathcedError) {
      if (checkLogFileIsLarge(logPath).isLarge) {
        recreateLogFile(logPath)
      }
      return
    }
    try {
      let log = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} [${logType} ${type.toUpperCase()}] `
      msg.forEach((item: ILogArgvTypeWithError) => {
        if (typeof item === 'object' && type === 'error') {
          log += `\n------Error Stack Begin------\n${util.format(item.stack)}\n-------Error Stack End------- `
        } else {
          if (typeof item === 'object') {
            item = JSON.stringify(item)
          }
          log += `${item} `
        }
      })
      log += '\n'
      console.log(log)
      // A synchronized approach to avoid log msg sequence errors
      if (checkLogFileIsLarge(logPath).isLarge) {
        recreateLogFile(logPath)
      }
      if (!hasUncathcedError) {
        fs.appendFileSync(logPath, log)
      }
    } catch (e) {
      console.log(e)
      hasUncathcedError = true
    }
  }
}

export { getLogger }
