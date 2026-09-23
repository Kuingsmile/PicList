import { constants } from 'node:fs'
import { open, realpath } from 'node:fs/promises'
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

class FileRequestError extends Error {
  constructor(readonly statusCode: 400 | 403 | 404) {
    super(http.STATUS_CODES[statusCode])
  }
}

function assertWithinRoot(root: string, filePath: string): void {
  const relativePath = path.relative(root, filePath)
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new FileRequestError(403)
  }
}

async function resolvePreviewPath(requestUrl: string | undefined): Promise<string> {
  let pathname: string
  try {
    // Decode exactly once, before resolving dot segments; query parameters are not filenames.
    pathname = decodeURIComponent(requestUrl?.split('?')[0] || '')
  } catch {
    throw new FileRequestError(400)
  }
  if (!pathname.startsWith('/') || pathname.includes('\0')) throw new FileRequestError(400)

  const relativeName = pathname.slice(1)
  if (
    pathname.includes('\\') ||
    path.win32.parse(relativeName).root ||
    (process.platform === 'win32' && relativeName.includes(':'))
  ) {
    // Reject UNC, drive-relative/absolute names, alternate data streams and Windows separators.
    throw new FileRequestError(403)
  }

  const root = path.resolve(imgFilePath)
  const filePath = path.resolve(root, relativeName)
  assertWithinRoot(root, filePath)
  const [realRoot, realFilePath] = await Promise.all([realpath(root), realpath(filePath)])
  // Check symlink/junction targets as well as the lexical path, then open the canonical filename.
  assertWithinRoot(realRoot, realFilePath)
  return realFilePath
}

export function startFileServer() {
  operation = operation.then(async () => {
    if (server?.listening) return
    server = http.createServer(async (req, res) => {
      try {
        const filePath = await resolvePreviewPath(req.url)
        const file = await open(
          filePath,
          constants.O_RDONLY | (constants.O_NOFOLLOW || 0) | (constants.O_NONBLOCK || 0),
        )
        let data: Buffer
        try {
          if (!(await file.stat()).isFile()) throw new FileRequestError(404)
          data = await file.readFile()
        } finally {
          await file.close()
        }
        res.end(data)
      } catch (error) {
        const statusCode = error instanceof FileRequestError ? error.statusCode : 404
        res.writeHead(statusCode)
        res.end(`${statusCode} ${http.STATUS_CODES[statusCode]}`)
      }
    })
    try {
      // Preserve persisted localhost gallery URLs while keeping previews off network interfaces.
      await listenOnce(server, serverPort, '127.0.0.1')
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
