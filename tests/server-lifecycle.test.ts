import { EventEmitter } from 'node:events'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  config: { port: 36677 as number | string, host: '127.0.0.1', enable: true },
  busy: 0,
  attempts: [] as number[],
  order: [] as string[],
  instances: [] as EventEmitter[],
  heartbeat: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}))

class FakeServer extends EventEmitter {
  listening = false

  listen(port: number) {
    expect(this.listenerCount('error')).toBe(1)
    expect(this.listenerCount('listening')).toBe(1)
    state.attempts.push(port)
    state.order.push('listen')
    queueMicrotask(() => {
      if (state.busy-- > 0) {
        this.emit('error', Object.assign(new Error('occupied'), { code: 'EADDRINUSE' }))
      } else {
        this.listening = true
        this.emit('listening')
      }
    })
    return this
  }

  close(callback: () => void) {
    queueMicrotask(() => {
      this.listening = false
      state.order.push('closed')
      callback()
    })
  }
}

vi.mock('node:http', () => ({
  default: {
    createServer: () => {
      const server = new FakeServer()
      state.instances.push(server)
      return server
    },
  },
}))
vi.mock('axios', () => ({ default: { post: state.heartbeat } }))
vi.mock('fs-extra', () => ({ default: { ensureDirSync: vi.fn() } }))
vi.mock('@core/picgo', () => ({ default: { baseDir: '/test', getConfig: () => state.config } }))
vi.mock('@core/picgo/logger', () => ({ default: { info: state.info, warn: vi.fn(), error: state.error } }))
vi.mock('~/apis/core/datastore/dirs', () => ({ dataDir: () => '/test' }))
vi.mock('~/server/routerManager', () => ({ default: {} }))
vi.mock('~/server/utils', () => ({ ensureHTTPLink: (url: string) => `http://${url}`, handleResponse: vi.fn() }))
vi.mock('~/utils/configPaths', () => ({ configPaths: { settings: { server: 'server' } } }))
vi.mock('~/utils/serverLifecycle', () => import('../src/main/utils/serverLifecycle'))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  state.config = { port: 36677, host: '127.0.0.1', enable: true }
  state.busy = 0
  state.attempts = []
  state.order = []
  state.instances = []
  state.heartbeat.mockRejectedValue(new Error('not a PicList server'))
})

describe('API server lifecycle', () => {
  it('retries sequentially, caps attempts, and removes temporary listeners', async () => {
    state.busy = 100
    const { default: server } = await import('../src/main/server')
    await server.startup()
    expect(state.attempts).toEqual(Array.from({ length: 10 }, (_, index) => 36677 + index))
    expect(state.heartbeat).toHaveBeenCalledTimes(10)
    expect(state.instances[0].listenerCount('error')).toBe(0)
    expect(state.instances[0].listenerCount('listening')).toBe(0)
    expect(state.info).not.toHaveBeenCalled()
    expect(state.error).toHaveBeenCalledOnce()
  })

  it('logs success only after listening and makes concurrent startup idempotent', async () => {
    state.busy = 2
    const { default: server } = await import('../src/main/server')
    await Promise.all([server.startup(), server.startup()])
    expect(state.attempts).toEqual([36677, 36678, 36679])
    expect(state.info).toHaveBeenCalledExactlyOnceWith('[PicList Server] is listening at 36679 of 127.0.0.1')
    await server.shutdown()
  })

  it('waits for close and creates a new server on restart', async () => {
    const { default: server } = await import('../src/main/server')
    await server.startup()
    state.config.port = 37777
    await server.restart()
    expect(state.attempts).toEqual([36677, 37777])
    expect(state.order).toEqual(['listen', 'closed', 'listen'])
    expect(state.instances).toHaveLength(2)
    await server.shutdown()
  })

  it('stops retrying when shutdown is requested during a heartbeat', async () => {
    state.busy = 100
    let respond!: (value: unknown) => void
    state.heartbeat.mockImplementation(() => new Promise(resolve => (respond = resolve)))
    const { default: server } = await import('../src/main/server')
    const starting = server.startup()
    await vi.waitFor(() => expect(state.heartbeat).toHaveBeenCalledOnce())
    const stopping = server.shutdown()
    respond({ data: {} })
    await Promise.all([starting, stopping])
    expect(state.attempts).toEqual([36677])
  })

  it('requires the PicList heartbeat response and bounds the probe timeout', async () => {
    state.busy = 1
    state.heartbeat.mockResolvedValue({ data: { success: true, result: 'alive' } })
    const { default: server } = await import('../src/main/server')
    await server.startup()
    expect(state.attempts).toEqual([36677])
    expect(state.heartbeat).toHaveBeenCalledWith('http://127.0.0.1:36677/heartbeat', undefined, {
      timeout: 1000,
      proxy: false,
    })
  })

  it('does not exceed the highest TCP port', async () => {
    state.config.port = '65535'
    state.busy = 100
    const { default: server } = await import('../src/main/server')
    await server.startup()
    expect(state.attempts).toEqual([65535])
  })

  it.each([0, -1, 65536, 'not-a-port', 1.5])('rejects invalid port %s before listening', async port => {
    state.config.port = port
    const { default: server } = await import('../src/main/server')
    await server.startup()
    expect(state.attempts).toEqual([])
    expect(state.error).toHaveBeenCalledOnce()
  })
})

describe('file server lifecycle', () => {
  it('starts only once and supports repeated stop and restart calls', async () => {
    const server = await import('../src/main/fileServer')
    await server.stopFileServer()
    await Promise.all([server.startFileServer(), server.startFileServer()])
    expect(state.attempts).toEqual([36699])
    await Promise.all([server.stopFileServer(), server.stopFileServer()])
    await server.startFileServer()
    expect(state.order).toEqual(['listen', 'closed', 'listen'])
    await server.stopFileServer()
  })

  it('closes a failed attempt and permits a later retry without changing its fixed URL', async () => {
    state.busy = 1
    const server = await import('../src/main/fileServer')
    await server.startFileServer()
    expect(state.info).not.toHaveBeenCalled()
    expect(state.error).toHaveBeenCalledOnce()
    expect(state.instances[0].listenerCount('error')).toBe(0)
    await server.startFileServer()
    expect(state.attempts).toEqual([36699, 36699])
    await server.stopFileServer()
  })
})
