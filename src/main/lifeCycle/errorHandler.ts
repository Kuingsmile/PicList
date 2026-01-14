import { appGUILogPath } from '@core/datastore/dirs'
import { getLogger } from '@core/utils/localLogger'

const LOG_PATH = appGUILogPath()

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
function bootstrapEPIPESuppression() {
  let suppressing = false
  function logEPIPEErrorOnce() {
    if (suppressing) {
      return
    }

    suppressing = true
    handleProcessError('Detected EPIPE error; suppressing further EPIPE errors')
  }

  epipeBomb(process.stdout, logEPIPEErrorOnce)
  epipeBomb(process.stderr, logEPIPEErrorOnce)
}

bootstrapEPIPESuppression()

function epipeBomb(stream: any, callback: any) {
  if (stream === null) stream = process.stdout
  if (callback === null) callback = process.exit

  function epipeFilter(err: any) {
    if (err.code === 'EPIPE') return callback()

    // If there's more than one error handler (ie, us),
    // then the error won't be bubbled up anyway
    if (stream.listeners('error').length <= 1) {
      stream.removeAllListeners() // Pretend we were never here
      stream.emit('error', err) // Then emit as if we were never here
      stream.on('error', epipeFilter) // Then reattach, ready for the next error!
    }
  }

  stream.on('error', epipeFilter)
}
