import type { Server } from 'node:http'
import os from 'node:os'
import path from 'node:path'

import fs from 'fs-extra'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  root: '',
  key: 'test-key',
  remote: '203.0.113.1',
  server: undefined as Server | undefined,
  handler: vi.fn(),
}))

vi.mock('node:http', async importOriginal => {
  const actual = await importOriginal<typeof import('node:http')>()
  return {
    ...actual,
    default: {
      ...actual,
      createServer: (handler: import('node:http').RequestListener) => {
        state.server = actual.createServer((request, response) => {
          Object.defineProperty(request.socket, 'remoteAddress', { value: state.remote, configurable: true })
          handler(request, response)
        })
        return state.server
      },
    },
  }
})
vi.mock('@core/picgo', () => ({
  default: {
    getConfig: (key: string) =>
      key === 'settings.server' ? { port: 36677, host: '127.0.0.1', enable: false } : state.key,
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('~/apis/core/datastore/dirs', () => ({ dataDir: () => state.root }))
vi.mock('~/server/routerManager', () => ({
  default: { getHandler: () => ({ handler: state.handler }) },
}))
vi.mock('~/server/utils', () => ({
  ensureHTTPLink: (url: string) => url,
  handleResponse: ({ response, body }: { response: import('node:http').ServerResponse; body: unknown }) => {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(body))
  },
}))
vi.mock('~/utils/configPaths', () => ({
  configPaths: { settings: { server: 'settings.server', serverKey: 'settings.serverKey' } },
}))

let baseUrl: string

beforeAll(async () => {
  state.root = await fs.mkdtemp(path.join(os.tmpdir(), 'piclist-server-test-'))
  await import('../src/main/server')
  await new Promise<void>(resolve => state.server!.listen(0, '127.0.0.1', resolve))
  const address = state.server!.address() as import('node:net').AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

beforeEach(() => {
  state.key = 'test-key'
  state.remote = '203.0.113.1'
  state.handler.mockReset().mockImplementation(({ response }) => {
    response.end(JSON.stringify({ success: true }))
  })
})

afterAll(async () => {
  await new Promise<void>(resolve => state.server!.close(() => resolve()))
  await fs.remove(state.root)
})

const multipart = () => {
  const body = new FormData()
  body.append('file', new Blob(['test image']), 'same.png')
  return body
}

describe('server request authentication', () => {
  it('rejects unauthorized multipart requests before writing files', async () => {
    const response = await fetch(`${baseUrl}/upload?key=wrong`, { method: 'POST', body: multipart() })
    expect(await response.json()).toMatchObject({ success: false, message: 'Unauthorized access' })
    expect(state.handler).not.toHaveBeenCalled()
    expect(await fs.readdir(path.join(state.root, 'serverTemp'))).toEqual([])
  })

  it('authenticates before parsing invalid JSON', async () => {
    const response = await fetch(`${baseUrl}/upload?key=wrong`, { method: 'POST', body: '{invalid' })
    expect(await response.json()).toMatchObject({ message: 'Unauthorized access' })
    expect(state.handler).not.toHaveBeenCalled()
  })

  it('does not parse or store multipart heartbeat bodies', async () => {
    const response = await fetch(`${baseUrl}/heartbeat`, { method: 'POST', body: multipart() })
    expect(await response.json()).toEqual({ success: true })
    expect(state.handler.mock.calls[0][0].list).toBeUndefined()
    expect(await fs.readdir(path.join(state.root, 'serverTemp'))).toEqual([])
  })

  it('preserves loopback access even for keys containing query delimiters', async () => {
    state.remote = '::ffff:127.0.0.1'
    state.key = 'test&key=value'
    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: '{}' })
    expect(await response.json()).toEqual({ success: true })
    expect(state.handler.mock.calls[0][0].urlparams.get('key')).toBe(state.key)
  })

  it('accepts a valid key and an unprotected server', async () => {
    const response = await fetch(`${baseUrl}/upload?key=test-key`, { method: 'POST', body: '{}' })
    expect(await response.json()).toEqual({ success: true })
    state.key = ''
    const unprotected = await fetch(`${baseUrl}/upload`, { method: 'POST', body: '{}' })
    expect(await unprotected.json()).toEqual({ success: true })
  })
})
