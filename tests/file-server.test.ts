import type { Server } from 'node:http'
import { request as httpRequest } from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'

import fs from 'fs-extra'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  baseDir: '',
  server: undefined as Server | undefined,
  listenPort: 0,
  listenHost: undefined as string | undefined,
}))

vi.mock('node:http', async importOriginal => {
  const actual = await importOriginal<typeof import('node:http')>()
  return {
    ...actual,
    default: {
      ...actual,
      createServer: (handler: import('node:http').RequestListener) => {
        state.server = actual.createServer(handler)
        return state.server
      },
    },
  }
})
vi.mock('@core/picgo', () => ({
  default: {
    get baseDir() {
      return state.baseDir
    },
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { info: vi.fn(), error: vi.fn() } }))
vi.mock('~/utils/serverLifecycle', async () => {
  const lifecycle = await import('../src/main/utils/serverLifecycle')
  return {
    ...lifecycle,
    listenOnce: (server: Server, port: number, host?: string) => {
      state.listenPort = port
      state.listenHost = host
      // Exercise the production handler and listen host without occupying the real gallery port.
      return lifecycle.listenOnce(server, 0, host)
    },
  }
})

const sentinel = 'harmless sibling fixture'
const image = 'harmless gallery fixture'
let preview: typeof import('../src/main/fileServer')
let root: string
let outside: string

beforeAll(async () => {
  state.baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'piclist-preview-test-'))
  root = path.join(state.baseDir, 'imgTemp')
  outside = path.join(state.baseDir, 'imgTemp-private')
  await fs.outputFile(path.join(outside, 'sentinel.txt'), sentinel)
  for (const uploader of ['local', 'sftpplist', 'webdavplist']) {
    await fs.outputFile(path.join(root, uploader, 'legacy.png'), image)
    await fs.outputFile(path.join(root, uploader, 'a'.repeat(64), 'nested', 'photo #100% 中文.png'), image)
  }
  await fs.outputFile(path.join(root, '%2e%2e', 'literal.png'), image)
  preview = await import('../src/main/fileServer')
  await preview.startFileServer()
})

afterAll(async () => {
  await preview?.stopFileServer()
  if (state.baseDir && path.dirname(state.baseDir) === path.resolve(os.tmpdir())) {
    await fs.remove(state.baseDir)
  }
})

function request(requestPath: string, method = 'GET') {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: '127.0.0.1',
        port: (state.server!.address() as AddressInfo).port,
        // Do not use URL/fetch: they normalize away traversal before sending it to the handler.
        path: requestPath,
        method,
        agent: false,
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', chunk => chunks.push(chunk))
        res.on('error', reject)
        res.on('end', () => resolve({ status: res.statusCode!, body: Buffer.concat(chunks).toString() }))
      },
    )
    req.on('error', reject)
    req.end()
  })
}

describe('preview server containment and gallery compatibility', () => {
  it('binds the existing gallery port only to IPv4 loopback', () => {
    expect(state.listenPort).toBe(36699)
    expect(state.listenHost).toBe('127.0.0.1')
    expect((state.server!.address() as AddressInfo).address).toBe('127.0.0.1')
  })

  it('rejects encoded parent traversal to a sibling fixture', async () => {
    expect(await request('/%2e%2e/imgTemp-private/sentinel.txt')).toEqual({ status: 403, body: '403 Forbidden' })
  })

  it.each([
    '/../imgTemp-private/sentinel.txt',
    '/local/%2E%2E/%2e%2e/imgTemp-private/sentinel.txt',
    '/..%2fimgTemp-private%2fsentinel.txt',
    '/%2e%2e%5cimgTemp-private%5csentinel.txt',
    '/..\\imgTemp-private\\sentinel.txt',
    '/C:/sentinel.txt',
    '/C:sentinel.txt',
    '//localhost/share/sentinel.txt',
    '/%5c%5clocalhost%5cshare%5csentinel.txt',
  ])('rejects traversal or rooted path %s', async requestPath => {
    const response = await request(requestPath)
    expect(response.status).toBe(403)
    expect(response.body).not.toContain(sentinel)
  })

  it.each(['/%', '/%GG', '/%E0%A4%A', '/%00.png'])(
    'rejects malformed pathname %s and stays available',
    async requestPath => {
      expect(await request(requestPath)).toEqual({ status: 400, body: '400 Bad Request' })
      expect(await request('/local/legacy.png')).toEqual({ status: 200, body: image })
    },
  )

  it.each(['local', 'sftpplist', 'webdavplist'])('preserves old and current %s gallery URLs', async uploader => {
    expect(await request(`/${uploader}/legacy.png`)).toEqual({ status: 200, body: image })
    const filename = encodeURIComponent('photo #100% 中文.png')
    expect(await request(`/${uploader}/${'a'.repeat(64)}/nested/${filename}?cache=1`)).toEqual({
      status: 200,
      body: image,
    })
  })

  it('decodes the pathname once and ignores the query string', async () => {
    expect(await request('/%252e%252e/literal.png?value=%GG')).toEqual({ status: 200, body: image })
  })

  it.each(['/', '/local/', '/missing.png'])('returns not found for non-files %s', async requestPath => {
    expect(await request(requestPath)).toEqual({ status: 404, body: '404 Not Found' })
  })

  it('blocks directory symlinks or Windows junctions that point outside the root', async () => {
    await fs.symlink(outside, path.join(root, 'outside-link'), process.platform === 'win32' ? 'junction' : 'dir')
    expect(await request('/outside-link/sentinel.txt')).toEqual({ status: 403, body: '403 Forbidden' })
  })

  it('still serves directory symlinks whose targets stay inside the root', async () => {
    await fs.symlink(
      path.join(root, 'local'),
      path.join(root, 'inside-link'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    expect(await request('/inside-link/legacy.png')).toEqual({ status: 200, body: image })
  })

  it('blocks file symlinks that point outside the root', async context => {
    try {
      await fs.symlink(path.join(outside, 'sentinel.txt'), path.join(root, 'outside-file.png'), 'file')
    } catch (error) {
      if (process.platform === 'win32' && (error as NodeJS.ErrnoException).code === 'EPERM') {
        context.skip('File symlinks require Windows Developer Mode or elevation; junction coverage still runs.')
      }
      throw error
    }
    expect(await request('/outside-file.png')).toEqual({ status: 403, body: '403 Forbidden' })
  })
})
