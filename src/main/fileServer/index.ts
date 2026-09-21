import http from 'node:http'
import path from 'node:path'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import fs from 'fs-extra'

import { closeServer, listenOnce } from '~/utils/serverLifecycle'

export const imgFilePath = path.join(picgo.baseDir, 'imgTemp')
fs.ensureDirSync(imgFilePath)

const serverPort = 36699

let server: http.Server | undefined
let operation: Promise<void> = Promise.resolve()

export function startFileServer() {
  operation = operation.then(async () => {
    if (server?.listening) return
    server = http.createServer((req, res) => {
      const requestPath = req.url?.split('?')[0]
      const filePath = path.join(imgFilePath, decodeURIComponent(requestPath as string))

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404)
          res.end('404 Not Found')
        } else {
          res.end(data)
        }
      })
    })
    try {
      await listenOnce(server, serverPort)
      logger.info(`File server is running, http://localhost:${serverPort}`)
    } catch (error) {
      await closeServer(server)
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
