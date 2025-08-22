import logger from '@core/picgo/logger'

export const deleteLog = (fileName?: string, type?: string, isSuccess = true, msg?: string) => {
  logger.info(`Delete ${fileName} on ${type} ${isSuccess ? 'successfully' : 'failed'} ${msg ? 'msg: ' + msg : ''}`)
}

export const deleteFailedLog = (fileName: string, type: string, error: any) => {
  deleteLog(fileName, type, false)
  logger.error(error)
}
