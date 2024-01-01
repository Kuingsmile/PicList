import http from 'http'
import routers from './routerManager'
import {
  handleResponse,
  ensureHTTPLink
} from './utils'
import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import axios from 'axios'
import multer from 'multer'
import { app } from 'electron'
import path from 'path'
import fs from 'fs-extra'

const appPath = app.getPath('userData')
const serverTempDir = path.join(appPath, 'serverTemp')

fs.ensureDirSync(serverTempDir)

const multerStorage = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: (arg0: null, arg1: any) => void) {
    fs.ensureDirSync(serverTempDir)
    cb(null, serverTempDir)
  },
  filename: function (_req: any, file: { originalname: any }, cb: (arg0: null, arg1: any) => void) {
    // eslint-disable-next-line no-control-regex
    if (!/[^\u0000-\u00ff]/.test(file.originalname)) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf8'
      )
    }
    cb(null, file.originalname)
  }
})

const uploadMulter = multer({
  storage: multerStorage
})

class Server {
  private httpServer: http.Server
  private config: IServerConfig

  constructor () {
    let config = picgo.getConfig<IServerConfig>('settings.server')
    const result = this.checkIfConfigIsValid(config)
    if (result) {
      this.config = config
      if (this.config.host === '127.0.0.1') {
        this.config.host = '0.0.0.0'
      }
    } else {
      config = {
        port: 36677,
        host: '0.0.0.0',
        enable: true
      }
      this.config = config
      picgo.saveConfig({
        'settings.server': config
      })
    }
    this.httpServer = http.createServer(this.handleRequest)
  }

  private checkIfConfigIsValid (config: IObj | undefined) {
    return config && config.port && config.host && (config.enable !== undefined)
  }

  private handleRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
    if (request.method === 'OPTIONS') {
      handleResponse({
        response
      })
      return
    }

    if (request.method === 'POST') {
      const [url, query] = request.url!.split('?')
      if (!routers.getHandler(url!)) {
        logger.warn(`[PicList Server] don't support [${url}] url`)
        handleResponse({
          response,
          statusCode: 404,
          body: {
            success: false
          }
        })
      } else {
        if (request.headers['content-type'] && request.headers['content-type'].startsWith('multipart/form-data')) {
          // @ts-ignore
          uploadMulter.any()(request, response, (err: any) => {
            if (err) {
              logger.info('[PicList Server]', err)
              return handleResponse({
                response,
                body: {
                  success: false,
                  message: 'Error processing formData'
                }
              })
            }
            // @ts-ignore
            const list = request.files.map(file => file.path)
            logger.info('[PicList Server] get a formData request')
            const handler = routers.getHandler(url)?.handler
            if (handler) {
              handler({
                list,
                response,
                urlparams: query ? new URLSearchParams(query) : undefined
              })
            }
          })
        } else {
          let body: string = ''
          let postObj: IObj
          request.on('data', chunk => {
            body += chunk
          })
          request.on('end', () => {
            try {
              postObj = (body === '') ? {} : JSON.parse(body)
            } catch (err: any) {
              logger.error('[PicList Server]', err)
              return handleResponse({
                response,
                body: {
                  success: false,
                  message: 'Not sending data in JSON format'
                }
              })
            }
            logger.info('[PicList Server] get the request', body)
            const handler = routers.getHandler(url!)?.handler
            handler!({
              ...postObj,
              response,
              urlparams: query ? new URLSearchParams(query) : undefined
            })
          })
        }
      }
    } else {
      logger.warn(`[PicList Server] don't support [${request.method}] method`)
      response.statusCode = 404
      response.end()
    }
  }

  // port as string is a bug
  private listen = (port: number | string) => {
    logger.info(`[PicList Server] is listening at ${port} of ${this.config.host}`)
    if (typeof port === 'string') {
      port = parseInt(port, 10)
    }
    this.httpServer.listen(port, this.config.host).on('error', async (err: ErrnoException) => {
      if (err.errno === 'EADDRINUSE') {
        try {
          // make sure the system has a PicGo Server instance
          await axios.post(ensureHTTPLink(`${this.config.host}:${port}/heartbeat`))
          this.shutdown(true)
        } catch (e) {
          logger.warn(`[PicList Server] ${port} is busy, trying with port ${(port as number) + 1}`)
          // fix a bug: not write an increase number to config file
          // to solve the auto number problem
          this.listen((port as number) + 1)
        }
      }
    })
  }

  startup () {
    console.log('startup', this.config.enable)
    if (this.config.enable) {
      this.listen(this.config.port)
    }
  }

  shutdown (hasStarted?: boolean) {
    this.httpServer.close()
    if (!hasStarted) {
      logger.info('[PicList Server] shutdown')
    }
  }

  restart () {
    this.config = picgo.getConfig('settings.server')
    if (this.config.host === '127.0.0.1') {
      this.config.host = '0.0.0.0'
    }
    this.shutdown()
    this.startup()
  }
}

export default new Server()
