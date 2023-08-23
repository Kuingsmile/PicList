import chalk from 'chalk'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import path from 'path'
import util from 'util'
import { ILogType } from '#/types/enum'
import { ILogColor, ILogger } from 'piclist/dist/types'
import { ManageApiType, Undefinable } from '~/universal/types/manage'
import { enforceNumber, isDev } from '#/utils/common'

export class ManageLogger implements ILogger {
  private readonly level = {
    [ILogType.success]: 'green',
    [ILogType.info]: 'blue',
    [ILogType.warn]: 'yellow',
    [ILogType.error]: 'red'
  }

  private readonly ctx: ManageApiType
  private logLevel!: string
  private logPath!: string

  constructor (ctx: ManageApiType) {
    this.ctx = ctx
  }

  private handleLog (type: ILogType, ...msg: ILogArgvTypeWithError[]): void {
    const logHeader = chalk[this.level[type] as ILogColor](
      `[PicList ${type.toUpperCase()}]`
    )
    console.log(logHeader, ...msg)
    this.logLevel = this.ctx.getConfig('settings.logLevel')
    this.logPath =
      this.ctx.getConfig<Undefinable<string>>('settings.logPath') ||
      path.join(this.ctx.baseDir, './manage.log')
    setTimeout(() => {
      try {
        const result = this.checkLogFileIsLarge(this.logPath)
        if (result.isLarge) {
          const warningMsg = `Log file is too large (> ${
            result.logFileSizeLimit! / 1024 / 1024 || '10'
          } MB), recreate log file`
          console.log(chalk.yellow('[PicList WARN]:'), warningMsg)
          this.recreateLogFile(this.logPath)
          msg.unshift(warningMsg)
        }
        this.handleWriteLog(this.logPath, type, ...msg)
      } catch (e) {
        console.error('[PicList Error] on checking log file size', e)
      }
    }, 0)
  }

  private checkLogFileIsLarge (logPath: string): {
    isLarge: boolean
    logFileSize?: number
    logFileSizeLimit?: number
  } {
    if (fs.existsSync(logPath)) {
      const logFileSize = fs.statSync(logPath).size
      const logFileSizeLimit =
        enforceNumber(
          this.ctx.getConfig<Undefinable<number>>(
            'settings.logFileSizeLimit'
          ) || 10
        ) *
        1024 *
        1024
      return {
        isLarge: logFileSize > logFileSizeLimit,
        logFileSize,
        logFileSizeLimit
      }
    }
    fs.ensureFileSync(logPath)
    return {
      isLarge: false
    }
  }

  private recreateLogFile (logPath: string): void {
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath)
      fs.createFileSync(logPath)
    }
  }

  private handleWriteLog (
    logPath: string,
    type: string,
    ...msg: ILogArgvTypeWithError[]
  ): void {
    try {
      if (this.checkLogLevel(type, this.logLevel)) {
        let log = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} [PicList ${type.toUpperCase()}] `
        msg.forEach((item: ILogArgvTypeWithError) => {
          log += this.formatLogItem(item, type)
        })
        log += '\n'
        fs.appendFileSync(logPath, log)
      }
    } catch (e) {
      console.error('[PicList Error] on writing log file', e)
    }
  }

  private formatLogItem (item: ILogArgvTypeWithError, type: string): string {
    let result = ''
    if (item instanceof Error && type === 'error') {
      result += `\n------Error Stack Begin------\n${util.format(item?.stack)}\n-------Error Stack End------- `
    } else {
      if (typeof item === 'object') {
        if (item?.stack) {
          result += `\n------Error Stack Begin------\n${util.format(item.stack)}\n-------Error Stack End------- `
        }
        item = JSON.stringify(item, (key, value) => (key === 'stack' ? undefined : value), 2)
      }
      result += `${item as string} `
    }
    return result
  }

  private checkLogLevel (
    type: string,
    level: undefined | string | string[]
  ): boolean {
    if (level === undefined || level === 'all') {
      return true
    }
    if (Array.isArray(level)) {
      return level.some((item: string) => item === type || item === 'all')
    }
    return type === level
  }

  success (...msq: ILogArgvType[]): void {
    return this.handleLog(ILogType.success, ...msq)
  }

  info (...msq: ILogArgvType[]): void {
    return this.handleLog(ILogType.info, ...msq)
  }

  error (...msq: ILogArgvTypeWithError[]): void {
    return this.handleLog(ILogType.error, ...msq)
  }

  warn (...msq: ILogArgvType[]): void {
    return this.handleLog(ILogType.warn, ...msq)
  }

  debug (...msq: ILogArgvType[]): void {
    if (isDev) {
      this.handleLog(ILogType.info, ...msq)
    }
  }
}

export default ManageLogger
