import { appGUILogPath } from '@core/datastore/dirs'
import { getLogger } from '@core/utils/localLogger'

const LOG_PATH = appGUILogPath()

const logger = getLogger(LOG_PATH, 'PicList')

// since the error may occur in picgo-core
// so we can't use the log from picgo

const handleProcessError = (error: unknown) => {
  logger('error', error)
}

process.on('uncaughtException', handleProcessError)
process.on('unhandledRejection', handleProcessError)

// A closed parent pipe must not repeatedly crash logging to stdout or stderr.
function bootstrapEPIPESuppression() {
  let suppressing = false
  function logEPIPEErrorOnce() {
    if (suppressing) {
      return
    }

    suppressing = true
    handleProcessError('Detected EPIPE error; suppressing further EPIPE errors')
  }

  suppressEPIPE(process.stdout, logEPIPEErrorOnce)
  suppressEPIPE(process.stderr, logEPIPEErrorOnce)
}

bootstrapEPIPESuppression()

function suppressEPIPE(stream: NodeJS.WriteStream, callback: () => void) {
  stream.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EPIPE') return callback()

    // Preserve Node's unhandled-error behavior without removing unrelated listeners
    // or losing EPIPE suppression when the error propagates to uncaughtException.
    if (stream.listenerCount('error') === 1) throw error
  })
}
