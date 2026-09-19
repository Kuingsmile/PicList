import http from 'node:http'
import path from 'node:path'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import axios from 'axios'
import fs from 'fs-extra'
import multer from 'multer'

import { dataDir } from '~/apis/core/datastore/dirs'
import routers from '~/server/routerManager'
import { ensureHTTPLink, handleResponse } from '~/server/utils'
import { configPaths } from '~/utils/configPaths'

const DEFAULT_PORT = 36677
const DEFAULT_HOST = '0.0.0.0'

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
  filename(_req: any, file: { originalname: any }, cb: (arg0: null, arg1: any) => void) {
    if (!/[^\u0000-\u00ff]/.test(file.originalname)) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    }
    cb(null, file.originalname)
  },
})

const uploadMulter = multer({
  storage: multerStorage,
})

async function handleMultipartUpload(
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

class Server {
  #httpServer: http.Server
  #config: IServerConfig

  constructor() {
    this.#config = this.getConfigWithDefaults()
    this.#httpServer = http.createServer(this.#handleRequest)
  }

  getConfigWithDefaults() {
    let config = picgo.getConfig<IServerConfig>(configPaths.settings.server)
    if (!this.#isValidConfig(config)) {
      config = { port: DEFAULT_PORT, host: DEFAULT_HOST, enable: true }
      picgo.saveConfig({ [configPaths.settings.server]: config })
    }
    return config
  }

  #isValidConfig(config: IObj | undefined) {
    return config && config.port && config.host && config.enable !== undefined
  }

  #handleRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
    switch (request.method) {
      case 'OPTIONS':
        handleResponse({ response })
        break
      case 'POST':
        this.#handlePostRequest(request, response)
        break
      case 'GET':
        this.#handleGetRequest(request, response)
        break
      default:
        logger.warn(`[PicList Server] don't support [${request.method}] method`)
        response.statusCode = 405
        response.end()
    }
  }

  #handlePostRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
    const [url, query] = (request.url || '').split('?')
    if (!routers.getHandler(url, 'POST')) {
      logger.warn(`[PicList Server] don't support [${url}] endpoint`)
      handleResponse({
        response,
        statusCode: 404,
        body: {
          success: false,
        },
      })
    } else {
      const remoteAddress = request.socket.remoteAddress || 'unknown'
      logger.info('[PicList Server] get a POST request from IP:', remoteAddress)
      const isLocalRequest =
        remoteAddress === '::1' || remoteAddress === '127.0.0.1' || remoteAddress === '::ffff:127.0.0.1'
      const urlSP = new URLSearchParams(query || '')
      const serverKey = picgo.getConfig<string>(configPaths.settings.serverKey) || ''
      if (isLocalRequest) {
        urlSP.set('key', serverKey)
      }
      if (url === '/upload' && serverKey && urlSP.get('key') !== serverKey) {
        request.resume()
        handleResponse({ response, body: { success: false, message: 'Unauthorized access' } })
        return
      }
      if (url === '/heartbeat') {
        request.resume()
        void routers.getHandler(url, 'POST')!.handler({ response, urlparams: urlSP })
        return
      }
      if (request.headers['content-type'] && request.headers['content-type'].startsWith('multipart/form-data')) {
        void handleMultipartUpload(request, response, routers.getHandler(url, 'POST')!.handler, urlSP)
      } else {
        let body: string = ''
        let postObj: IObj
        request.on('data', chunk => {
          body += chunk
        })
        request.on('end', () => {
          try {
            postObj = body === '' ? {} : JSON.parse(body)
          } catch (_err: any) {
            logger.warn('[PicList Server] invalid JSON request')
            return handleResponse({
              response,
              body: {
                success: false,
                message: 'Not sending data in JSON format',
              },
            })
          }
          const handler = routers.getHandler(url!, 'POST')?.handler
          handler!({
            ...postObj,
            response,
            urlparams: urlSP,
          })
        })
      }
    }
  }

  #handleGetRequest = (_request: http.IncomingMessage, response: http.ServerResponse) => {
    const [url, query] = (_request.url || '').split('?')
    if (!routers.getHandler(url, 'GET')) {
      logger.info(`[PicList Server] don't support [${url}] endpoint`)
      response.statusCode = 404
      response.end()
    } else {
      const handler = routers.getHandler(url, 'GET')?.handler
      if (handler) {
        handler({
          response,
          urlparams: query ? new URLSearchParams(query) : undefined,
        })
      }
    }
  }

  // port as string is a bug
  #listen = (port: number | string) => {
    logger.info(`[PicList Server] is listening at ${port} of ${this.#config.host}`)
    if (typeof port === 'string') {
      port = parseInt(port, 10)
    }
    this.#httpServer.listen(port, this.#config.host).on('error', async (err: ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        try {
          // make sure the system has a PicGo Server instance
          await axios.post(ensureHTTPLink(`${this.#config.host}:${port}/heartbeat`))
          logger.info(`[PicList Server] server is already running at ${port}`)
          this.shutdown(true)
        } catch (_e) {
          logger.warn(`[PicList Server] ${port} is busy, trying with port ${(port as number) + 1}`)
          // fix a bug: not write an increase number to config file
          // to solve the auto number problem
          this.#listen((port as number) + 1)
        }
      } else {
        logger.error('[PicList Server]', err)
      }
    })
  }

  startup() {
    if (this.#config.enable) {
      this.#listen(this.#config.port)
    }
  }

  shutdown(hasStarted?: boolean) {
    this.#httpServer.close()
    if (!hasStarted) {
      logger.info('[PicList Server] shutdown')
    }
  }

  restart() {
    this.shutdown()
    this.#config = this.getConfigWithDefaults()
    this.startup()
  }
}

export default new Server()
