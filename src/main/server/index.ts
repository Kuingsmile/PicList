import http from 'node:http'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import axios from 'axios'

import { handleJsonRequest, handleMultipartUpload } from '~/server/requestBody'
import routers from '~/server/routerManager'
import { ensureHTTPLink, handleResponse } from '~/server/utils'
import { configPaths } from '~/utils/configPaths'
import { closeServer, listenOnce } from '~/utils/serverLifecycle'

const DEFAULT_PORT = 36677
const DEFAULT_HOST = '0.0.0.0'
const MAX_PORT_ATTEMPTS = 10

class Server {
  #httpServer: http.Server
  #config: IServerConfig
  #pendingOperation: Promise<void> = Promise.resolve()
  // Invalidates pending listen attempts when shutdown or restart is requested.
  #lifecycleGeneration = 0

  constructor() {
    this.#config = this.getConfigWithDefaults()
    this.#httpServer = http.createServer(this.#handleRequest)
  }

  getConfigWithDefaults(): IServerConfig {
    let config = picgo.getConfig<IServerConfig>(configPaths.settings.server)
    if (!this.#isValidConfig(config)) {
      config = { port: DEFAULT_PORT, host: DEFAULT_HOST, enable: true }
      picgo.saveConfig({ [configPaths.settings.server]: config })
    }
    return config
  }

  #isValidConfig(config: IServerConfig | undefined): config is IServerConfig {
    return !!config && config.port !== undefined && !!config.host && config.enable !== undefined
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

  #isLoopback(remoteAddress: string) {
    return remoteAddress === '::1' || remoteAddress === '127.0.0.1' || remoteAddress === '::ffff:127.0.0.1'
  }

  #handlePostRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
    const [url, query] = (request.url || '').split('?')
    const route = routers.getHandler(url, 'POST')
    if (!route) {
      logger.warn(`[PicList Server] don't support [${url}] endpoint`)
      handleResponse({
        response,
        statusCode: 404,
        body: {
          success: false,
        },
      })
      return
    }
    const remoteAddress = request.socket.remoteAddress || 'unknown'
    logger.info('[PicList Server] get a POST request from IP:', remoteAddress)
    const urlparams = new URLSearchParams(query || '')
    const serverKey = picgo.getConfig<string>(configPaths.settings.serverKey) || ''
    if (this.#isLoopback(remoteAddress)) {
      urlparams.set('key', serverKey)
    }
    if (url === '/upload' && serverKey && urlparams.get('key') !== serverKey) {
      request.resume()
      handleResponse({ response, body: { success: false, message: 'Unauthorized access' } })
      return
    }
    if (url === '/heartbeat') {
      request.resume()
      void route.handler({ response, urlparams })
      return
    }
    const isMultipart = request.headers['content-type']?.startsWith('multipart/form-data')
    if (isMultipart) {
      void handleMultipartUpload(request, response, route.handler, urlparams)
    } else {
      handleJsonRequest(request, response, route.handler, urlparams)
    }
  }

  #handleGetRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
    const [url, query] = (request.url || '').split('?')
    const route = routers.getHandler(url, 'GET')
    if (!route) {
      logger.info(`[PicList Server] don't support [${url}] endpoint`)
      response.statusCode = 404
      response.end()
      return
    }
    void route.handler({
      response,
      urlparams: query ? new URLSearchParams(query) : undefined,
    })
  }

  #listen = async (generation: number) => {
    if (!this.#config.enable || this.#httpServer.listening || generation !== this.#lifecycleGeneration) return
    const firstPort = Number(this.#config.port)
    if (!Number.isInteger(firstPort) || firstPort < 1 || firstPort > 65535) {
      logger.error('[PicList Server] invalid port; expected an integer from 1 to 65535')
      return
    }
    const host = this.#config.host
    for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS && firstPort + attempt <= 65535; attempt++) {
      if (generation !== this.#lifecycleGeneration) return
      const port = firstPort + attempt
      try {
        await listenOnce(this.#httpServer, port, host)
        logger.info(`[PicList Server] is listening at ${port} of ${host}`)
        return
      } catch (error) {
        await closeServer(this.#httpServer)
        if (generation !== this.#lifecycleGeneration) return
        if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE') {
          logger.error('[PicList Server]', error as Error)
          return
        }
        const probeHost = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '::1' : host
        try {
          const response = await axios.post(
            ensureHTTPLink(`${probeHost.includes(':') ? `[${probeHost}]` : probeHost}:${port}/heartbeat`),
            undefined,
            { timeout: 1000, proxy: false },
          )
          if (response.data?.success === true && response.data?.result === 'alive') {
            logger.info(`[PicList Server] server is already running at ${port}`)
            return
          }
        } catch (_error) {
          // The occupied port belongs to another service or does not answer in time.
        }
        logger.warn(`[PicList Server] ${port} is busy`)
      }
    }
    logger.error(`[PicList Server] unable to start after bounded port retries from ${firstPort}`)
  }

  #enqueueLifecycleOperation(operation: () => Promise<void>) {
    this.#pendingOperation = this.#pendingOperation.then(operation).catch(error => {
      logger.error('[PicList Server]', error)
    })
    return this.#pendingOperation
  }

  getStatus() {
    const address = this.#httpServer.address()
    return {
      enabled: !!this.#config.enable,
      listening: this.#httpServer.listening,
      host: this.#config.host,
      configuredPort: Number(this.#config.port),
      port: address && typeof address === 'object' ? address.port : undefined,
    }
  }

  startup() {
    const generation = this.#lifecycleGeneration
    return this.#enqueueLifecycleOperation(() => this.#listen(generation))
  }

  shutdown(hasStarted?: boolean) {
    this.#lifecycleGeneration++
    return this.#enqueueLifecycleOperation(async () => {
      await closeServer(this.#httpServer)
      if (!hasStarted) logger.info('[PicList Server] shutdown')
    })
  }

  restart() {
    const generation = ++this.#lifecycleGeneration
    return this.#enqueueLifecycleOperation(async () => {
      await closeServer(this.#httpServer)
      this.#httpServer = http.createServer(this.#handleRequest)
      this.#config = this.getConfigWithDefaults()
      await this.#listen(generation)
    })
  }
}

export default new Server()
