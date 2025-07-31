import http from 'node:http'
import path from 'node:path'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'
import fs from 'fs-extra'

import { IStringKeyMap } from '#/types/types'
import { encodeFilePath } from '#/utils/common'
import { configPaths } from '#/utils/configPaths'

const defaultPath = process.platform === 'win32' ? 'C:\\Users' : '/'

function generateDirectoryListingHtml (files: any[], requestPath: any) {
  let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><h1>Directory Listing</h1><ul>'
  files.forEach((file: string) => {
    const filePath = path.join(requestPath, file)
    html += `<li><a href="${encodeFilePath(filePath)}">${file}</a></li>`
  })
  html += '</ul></body></html>'
  return html
}

function serveDirectory (res: http.ServerResponse, filePath: fs.PathLike, requestPath: any) {
  fs.readdir(filePath, (err, files) => {
    if (err) {
      res.writeHead(500)
      res.end('Error listing directory contents')
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(generateDirectoryListingHtml(files, requestPath))
    }
  })
}

function serveFile (res: http.ServerResponse, filePath: fs.PathLike) {
  const readStream = fs.createReadStream(filePath)
  readStream.pipe(res)
  readStream.on('error', () => {
    res.writeHead(500)
    res.end('Error reading file')
  })
}

class WebServer {
  #server!: http.Server
  #config!: IStringKeyMap

  constructor () {
    this.loadConfig()
    this.initServer()
  }

  loadConfig (): void {
    this.#config = {
      enableWebServer: picgo.getConfig<boolean>(configPaths.settings.enableWebServer) || false,
      webServerHost: picgo.getConfig<string>(configPaths.settings.webServerHost) || '0.0.0.0',
      webServerPort: picgo.getConfig<number>(configPaths.settings.webServerPort) || 37777,
      webServerPath: picgo.getConfig<string>(configPaths.settings.webServerPath) || defaultPath
    }
  }

  initServer (): void {
    this.#server = http.createServer((req, res) => {
      const requestPath = req.url?.split('?')[0]
      const filePath = path.join(this.#config.webServerPath, decodeURIComponent(requestPath || ''))

      try {
        const stats = fs.statSync(filePath)
        if (stats.isDirectory()) {
          serveDirectory(res, filePath, requestPath)
        } else {
          serveFile(res, filePath)
        }
      } catch (err) {
        res.writeHead(404)
        res.end('404 Not Found')
      }
    })
  }

  start () {
    if (this.#config.enableWebServer) {
      this.#server
        .listen(
          this.#config.webServerPort === 36699 ? 37777 : this.#config.webServerPort,
          this.#config.webServerHost,
          () => {
            logger.info(
              `Web server is running at http://${this.#config.webServerHost}:${this.#config.webServerPort}, root path is ${this.#config.webServerPath}`
            )
          }
        )
        .on('error', err => {
          logger.error(err)
        })
    } else {
      logger.info('Web server is not enabled')
    }
  }

  stop () {
    this.#server.close(() => {
      logger.info('Web server is stopped')
    })
  }

  restart () {
    this.stop()
    this.loadConfig()
    this.initServer()
    this.start()
  }
}

export default new WebServer()
