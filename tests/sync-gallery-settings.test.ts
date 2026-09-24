import os from 'node:os'
import path from 'node:path'

import fs from 'fs-extra'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { encode } from '../src/main/utils/gallerySync/storage'
import { BUNDLE_NAME } from '../src/main/utils/gallerySync/transport'

const state = vi.hoisted(() => ({
  root: '',
  watermark: 8,
  generation: 0,
  files: new Map<string, { data: Buffer; etag: string }>(),
  put: vi.fn(),
  refresh: vi.fn(),
  save: vi.fn(),
  log: vi.fn(),
}))
vi.mock('@core/datastore', () => ({ GalleryDB: { getInstance: () => ({ refresh: state.refresh }) } }))
vi.mock('@core/datastore/dirs', () => ({ dataDir: () => state.root }))
vi.mock('@core/picgo', () => ({
  default: {
    getConfig: (key: string) =>
      key === 'settings.lastSyncTime'
        ? state.watermark
        : {
            type: 'webdav',
            webdavEndpoint: 'https://example.invalid',
            webdavUsername: 'test',
            webdavPassword: 'test',
            webdavAuthType: 'basic',
            webdavSslEnabled: true,
            webdavSavePath: '',
          },
    saveConfig: state.save,
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { info: state.log, error: state.log } }))
vi.mock('~/utils/common', () => ({ formatEndpoint: (value: string) => value }))
vi.mock('~/utils/configPaths', () => ({
  configPaths: { settings: { sync: 'settings.sync', lastSyncTime: 'settings.lastSyncTime' } },
}))
vi.mock('webdav', () => ({
  AuthType: {},
  createClient: () => ({
    putFileContents: state.put,
    createDirectory: vi.fn(),
    getFileContents: async (name: string) => {
      const file = state.files.get(name)
      if (!file) throw Object.assign(new Error('missing'), { status: 404 })
      return { data: file.data, headers: { etag: file.etag }, status: 200 }
    },
  }),
}))

let settings: typeof import('../src/main/utils/syncSettings')
beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  state.root = fs.mkdtempSync(path.join(os.tmpdir(), 'piclist-sync-facade-'))
  state.files.clear()
  state.watermark = 8
  state.generation = 0
  const contents = encode({ gallery: [{ id: 'local' }], __gallery_KEY__: { local: 1 } })
  for (const file of ['piclist.db', 'piclist.bak.db']) fs.writeFileSync(path.join(state.root, file), contents)
  state.put.mockImplementation(async (name: string, content: Buffer, options: { headers: Record<string, string> }) => {
    if (options.headers['If-Match'] && state.files.get(name)?.etag !== options.headers['If-Match']) return false
    if (options.headers['If-None-Match'] === '*' && state.files.has(name)) return false
    state.files.set(name, { data: Buffer.from(content), etag: `"${++state.generation}"` })
    return true
  })
  state.save.mockImplementation((value: Record<string, number>) => {
    state.watermark = value['settings.lastSyncTime']
  })
  settings = await import('../src/main/utils/syncSettings')
})
afterEach(() => fs.removeSync(state.root))

it('syncGallery defaults to a dry run and only publishes after an explicit reviewed apply', async () => {
  const before = fs.readFileSync(path.join(state.root, 'piclist.db'))
  const plan = await settings.syncGallery()
  expect(plan).toHaveProperty('counts.addition', 1)
  expect(state.put).not.toHaveBeenCalled()
  expect(state.save).not.toHaveBeenCalled()
  expect(fs.readFileSync(path.join(state.root, 'piclist.db'))).toEqual(before)
  if (!plan || !('id' in plan)) throw new Error('Expected a plan')
  const result = await settings.syncGallery({ action: 'apply', planId: plan.id, resolutions: {} })
  expect(result).toHaveProperty('snapshotId', plan.id)
  expect(state.files.has(BUNDLE_NAME)).toBe(true)
  expect(state.put).toHaveBeenCalledOnce()
  expect(state.save).toHaveBeenCalledOnce()
  expect(state.refresh).toHaveBeenCalledOnce()
  expect(await settings.syncGallery({ action: 'list-snapshots' })).toEqual([
    expect.objectContaining({ id: plan.id, status: 'committed' }),
  ])
})

it('propagates a false WebDAV upload through the facade without reporting success or touching live data', async () => {
  const plan = await settings.syncGallery()
  if (!plan || !('id' in plan)) throw new Error('Expected a plan')
  const before = fs.readFileSync(path.join(state.root, 'piclist.db'))
  state.put.mockResolvedValueOnce(false)
  await expect(settings.syncGallery({ action: 'apply', planId: plan.id, resolutions: {} })).rejects.toThrow(
    'upload did not succeed',
  )
  expect(fs.readFileSync(path.join(state.root, 'piclist.db'))).toEqual(before)
  expect(state.save).not.toHaveBeenCalled()
  expect(state.refresh).not.toHaveBeenCalled()
  expect(state.log).not.toHaveBeenCalled()
  const retry = await settings.syncGallery()
  expect(retry).toHaveProperty('counts.addition', 1)
  if (retry && 'id' in retry) await settings.syncGallery({ action: 'cancel', planId: retry.id })
})
