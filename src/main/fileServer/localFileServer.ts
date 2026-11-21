import { realpath, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

import picgo from '@core/picgo'
import logger from '@core/picgo/logger'

import { rpcContracts, RpcError } from '#/rpc'
import { commitConfig } from '~/utils/commitConfig'
import { configPaths } from '~/utils/configPaths'
import { closeServer, listenOnce } from '~/utils/serverLifecycle'

import { createFileHandler } from './serveFiles'

interface Listener {
  server: http.Server
  config: ILocalFileServerConfig
}

let running: Listener | undefined
let pending = Promise.resolve()

export function getLocalFileServerConfig(): ILocalFileServerConfig {
  const saved = picgo.getConfig<ILocalFileServerConfig>(configPaths.settings.localFileServer)
  if (saved) return saved
  // Offer previous settings in the dialog, but require opt-in before serving an old directory again.
  const legacy = picgo.getConfig<{ webServerHost?: string; webServerPort?: number | string; webServerPath?: string }>(
    'settings',
  )
  return {
    enable: false,
    host: legacy?.webServerHost || '127.0.0.1',
    port: Number(legacy?.webServerPort) || 37777,
    root: legacy?.webServerPath || picgo.getConfig<string>('picBed.local.path') || '',
  }
}

function enqueue(operation: () => Promise<void>) {
  const result = pending.then(operation)
  pending = result.catch(() => {})
  return result
}

async function stop() {
  if (!running) return
  const closed = closeServer(running.server)
  running.server.closeAllConnections()
  await closed
  running = undefined
}

async function prepare(config: ILocalFileServerConfig): Promise<Listener> {
  const upload = picgo.getConfig<IServerConfig>(configPaths.settings.server)
  if (
    !config.host.trim() ||
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535 ||
    config.port === 36699 ||
    (upload?.enable && config.port === Number(upload.port))
  ) {
    throw new RpcError('FILE_SERVER_ADDRESS')
  }
  let root: string
  try {
    if (!path.isAbsolute(config.root)) throw new Error()
    root = await realpath(config.root)
    if (!(await stat(root)).isDirectory()) throw new Error()
  } catch {
    throw new RpcError('FILE_SERVER_ROOT')
  }
  const serve = createFileHandler(root, true)
  const host = config.host.includes(':') ? `[${config.host}]` : config.host.toLowerCase()
  const authorities = new Set(
    [host, 'localhost', '127.0.0.1', '[::1]'].flatMap(name =>
      config.port === 80 ? [name, `${name}:80`] : [`${name}:${config.port}`],
    ),
  )
  const server = http.createServer((req, res) => {
    // A web origin resolving to loopback must not gain same-origin access to the shared folder.
    const address = req.socket.localAddress
    if (
      (address === '::1' || address?.startsWith('127.') || address?.startsWith('::ffff:127.')) &&
      !authorities.has(req.headers.host?.toLowerCase() || '')
    ) {
      res.writeHead(403).end()
      return
    }
    serve(req, res)
  })
  return { server, config }
}

async function listen(listener: Listener) {
  try {
    await listenOnce(listener.server, listener.config.port, listener.config.host)
  } catch {
    throw new RpcError('FILE_SERVER_ADDRESS')
  }
  running = listener
}

export function startLocalFileServer() {
  return enqueue(async () => {
    const config = getLocalFileServerConfig()
    if (config.enable !== true || running) return
    rpcContracts.SAVE_LOCAL_FILE_SERVER.args.parse([config])
    await listen(await prepare(config))
  }).catch(error => logger.error('Could not start the local file server', error))
}

export function saveLocalFileServer(config: ILocalFileServerConfig) {
  return enqueue(async () => {
    const next = config.enable ? await prepare(config) : undefined
    const previous = running
    await stop()
    try {
      if (next) await listen(next)
      commitConfig(picgo, { [configPaths.settings.localFileServer]: config })
    } catch (error) {
      await stop()
      if (previous) await listen(previous).catch(err => logger.error('Could not restore the local file server', err))
      throw error
    }
  })
}

export function stopLocalFileServer() {
  return enqueue(stop)
}
