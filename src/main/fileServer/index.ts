import { realpath } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import fs from 'fs-extra'

import { closeServer, listenOnce } from '~/utils/serverLifecycle'

import { createFileHandler } from './serveFiles'

export const imgFilePath = path.join(picgo.baseDir, 'imgTemp')
fs.ensureDirSync(imgFilePath)

const serverPort = 36699

let server: http.Server | undefined
let operation: Promise<void> = Promise.resolve()

export function startFileServer() {
  operation = operation.then(async () => {
    if (server?.listening) return
    try {
      server = http.createServer(createFileHandler(await realpath(imgFilePath)))
      // Preserve persisted localhost gallery URLs while keeping previews off network interfaces.
      await listenOnce(server, serverPort, '127.0.0.1')
      logger.info(`File server is running, http://localhost:${serverPort}`)
    } catch (error) {
      if (server) await closeServer(server)
      server = undefined
      logger.error(`File server could not start on port ${serverPort}`, error as Error)
    }
  })
  return operation
}

export function stopFileServer() {
  operation = operation.then(async () => {
    if (!server) return
    await closeServer(server)
    server = undefined
    logger.info('File server is stopped')
  })
  return operation
}
