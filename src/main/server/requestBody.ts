import http from 'node:http'
import path from 'node:path'

import logger from '@core/picgo/logger'
import fs from 'fs-extra'
import multer from 'multer'

import { dataDir } from '~/apis/core/datastore/dirs'
import { handleResponse } from '~/server/utils'

const serverTempDir = path.join(dataDir(), 'serverTemp')
const uploadDirectory = Symbol('uploadDirectory')

type MultipartRequest = http.IncomingMessage & {
  [uploadDirectory]?: string
  files?: { path: string }[]
}

fs.ensureDirSync(serverTempDir)

const multerStorage = multer.diskStorage({
  destination(req, _file, cb) {
    try {
      const directory = (req as unknown as MultipartRequest)[uploadDirectory]
      if (!directory) throw new Error('Missing request upload directory')
      cb(null, fs.mkdtempSync(path.join(directory, 'file-')))
    } catch (error) {
      cb(error as Error, '')
    }
  },
  filename(_req, file, cb) {
    if (!/[^\u0000-\u00ff]/.test(file.originalname)) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    }
    cb(null, file.originalname)
  },
})

const uploadMulter = multer({
  storage: multerStorage,
})

export async function handleMultipartUpload(
  request: MultipartRequest,
  response: http.ServerResponse,
  handler: routeHandler,
  urlparams: URLSearchParams,
): Promise<void> {
  let requestTempDir: string | undefined
  try {
    requestTempDir = await fs.mkdtemp(path.join(serverTempDir, 'request-'))
    request[uploadDirectory] = requestTempDir
    if (request.destroyed || response.destroyed) return
    await new Promise<void>((resolve, reject) => {
      // @ts-expect-error multer only uses the underlying Node request and response
      uploadMulter.any()(request, response, error => (error ? reject(error) : resolve()))
    })
    if (request.aborted || response.destroyed) return
    await handler({ list: (request.files || []).map(file => file.path), response, urlparams })
  } catch (_error) {
    if (!response.destroyed && !response.headersSent) {
      handleResponse({ response, body: { success: false, message: 'Error processing formData' } })
    }
  } finally {
    if (requestTempDir) {
      try {
        await fs.remove(requestTempDir)
      } catch (_error) {
        logger.warn('[PicList Server] temporary upload cleanup failed')
      }
    }
  }
}

export function handleJsonRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  handler: routeHandler,
  urlparams: URLSearchParams,
): void {
  let body = ''
  request.on('data', chunk => {
    body += chunk
  })
  request.on('end', () => {
    let parsedBody: IObj
    try {
      parsedBody = body === '' ? {} : JSON.parse(body)
    } catch (_error) {
      logger.warn('[PicList Server] invalid JSON request')
      return handleResponse({
        response,
        body: {
          success: false,
          message: 'Not sending data in JSON format',
        },
      })
    }
    void handler({
      ...parsedBody,
      response,
      urlparams,
    })
  })
}
