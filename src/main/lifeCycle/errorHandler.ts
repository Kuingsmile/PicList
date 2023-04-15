import path from 'path'
import { app } from 'electron'
import { getLogger } from 'apis/core/utils/localLogger'
const STORE_PATH = app.getPath('userData')
const LOG_PATH = path.join(STORE_PATH, 'piclist-gui-local.log')

const logger = getLogger(LOG_PATH, 'PicList')

// since the error may occur in picgo-core
// so we can't use the log from picgo

const handleProcessError = (error: Error | string) => {
  logger('error', error)
}

process.on('uncaughtException', error => {
  handleProcessError(error)
})

process.on('unhandledRejection', (error: any) => {
  handleProcessError(error)
})

// acconrding to https://github.com/Molunerfinn/PicGo/commit/7363be798cfef11e980934e542817ff1d6c04389#diff-896d0db4fbd446798fbffec14d456b4cd98d4c72c46856c770a585fa7ab0926f
function bootstrapEPIPESuppression () {
  let suppressing = false
  function logEPIPEErrorOnce () {
    if (suppressing) {
      return
    }

    suppressing = true
    handleProcessError('Detected EPIPE error; suppressing further EPIPE errors')
  }

  require('epipebomb')(process.stdout, logEPIPEErrorOnce)
  require('epipebomb')(process.stderr, logEPIPEErrorOnce)
}

bootstrapEPIPESuppression()
