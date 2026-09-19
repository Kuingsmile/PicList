import type { Server } from 'node:http'
import { request as httpRequest } from 'node:http'
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

describe('multipart upload ownership', () => {
  it('preserves duplicate filenames with separate contents within a request', async () => {
    state.handler.mockImplementation(async ({ response, list }) => {
      expect(list[0]).not.toBe(list[1])
      expect(list.map((file: string) => path.basename(file))).toEqual(['same.png', 'same.png'])
      expect(await Promise.all(list.map((file: string) => fs.readFile(file, 'utf8')))).toEqual(['first', 'second'])
      response.end(JSON.stringify({ success: true }))
    })
    const body = new FormData()
    body.append('file', new Blob(['first']), 'same.png')
    body.append('file', new Blob(['second']), 'same.png')
    const response = await fetch(`${baseUrl}/upload?key=test-key`, { method: 'POST', body })
    expect(await response.json()).toEqual({ success: true })
    await expect.poll(() => fs.readdir(path.join(state.root, 'serverTemp'))).toEqual([])
  })

  it('does not remove files belonging to another active request', async () => {
    let release!: () => void
    let entered!: () => void
    const waiting = new Promise<void>(resolve => (release = resolve))
    const started = new Promise<void>(resolve => (entered = resolve))
    let activePath = ''
    state.handler.mockImplementation(async ({ response, list, urlparams }) => {
      if (urlparams.get('hold')) {
        activePath = list[0]
        entered()
        await waiting
        expect(await fs.readFile(activePath, 'utf8')).toBe('test image')
      } else {
        expect(list[0]).not.toBe(activePath)
      }
      response.end(JSON.stringify({ success: true }))
    })
    const first = fetch(`${baseUrl}/upload?key=test-key&hold=1`, { method: 'POST', body: multipart() })
    await started
    try {
      const second = await fetch(`${baseUrl}/upload?key=test-key`, { method: 'POST', body: multipart() })
      expect(await second.json()).toEqual({ success: true })
      await expect.poll(() => fs.readdir(path.join(state.root, 'serverTemp'))).toHaveLength(1)
      expect(await fs.pathExists(activePath)).toBe(true)
    } finally {
      release()
      await (await first).json()
    }
    await expect.poll(() => fs.readdir(path.join(state.root, 'serverTemp'))).toEqual([])
  })

  it('cleans files when the upload handler rejects', async () => {
    state.handler.mockRejectedValue(new Error('Upload failed'))
    const response = await fetch(`${baseUrl}/upload?key=test-key`, { method: 'POST', body: multipart() })
    expect(await response.json()).toMatchObject({ success: false })
    await expect.poll(() => fs.readdir(path.join(state.root, 'serverTemp'))).toEqual([])
  })

  it('cleans files after a malformed multipart body', async () => {
    const response = await fetch(`${baseUrl}/upload?key=test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary' },
      body: '--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="same.png"\r\n\r\nunfinished',
    })
    expect(await response.json()).toMatchObject({ success: false })
    expect(state.handler).not.toHaveBeenCalled()
    await expect.poll(() => fs.readdir(path.join(state.root, 'serverTemp'))).toEqual([])
  })

  it('cleans a partially received file when the client disconnects', async () => {
    const request = httpRequest(`${baseUrl}/upload?key=test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary' },
    })
    request.on('error', () => {})
    request.write('--test-boundary\r\nContent-Disposition: form-data; name="file"; filename="same.png"\r\n\r\npartial')
    try {
      await expect
        .poll(async () => {
          const dirs = await fs.readdir(path.join(state.root, 'serverTemp'))
          if (!dirs[0]) return false
          const files = await fs.readdir(path.join(state.root, 'serverTemp', dirs[0]))
          if (!files[0]) return false
          return fs.pathExists(path.join(state.root, 'serverTemp', dirs[0], files[0], 'same.png'))
        })
        .toBe(true)
    } finally {
      request.destroy()
    }
    await expect.poll(() => fs.readdir(path.join(state.root, 'serverTemp'))).toEqual([])
    expect(state.handler).not.toHaveBeenCalled()
  })
})
