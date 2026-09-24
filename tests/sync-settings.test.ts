import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadFile } from '../src/main/utils/syncSettings'

const state = vi.hoisted(() => ({
  files: new Map<string, string>(),
  put: vi.fn(),
  mkdir: vi.fn(),
}))
vi.mock('@core/datastore', () => ({ GalleryDB: {} }))
vi.mock('@core/datastore/dirs', () => ({ dataDir: () => '/test-config' }))
vi.mock('@core/picgo', () => ({
  default: {
    getConfig: () => ({
      type: 'webdav',
      webdavEndpoint: 'https://example.invalid',
      webdavUsername: 'test',
      webdavPassword: 'test',
      webdavAuthType: 'basic',
      webdavSslEnabled: true,
      webdavSavePath: 'piclist',
    }),
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { info: vi.fn(), error: vi.fn() } }))
vi.mock('~/utils/common', () => ({ formatEndpoint: (value: string) => value, extractData: vi.fn(), zipData: vi.fn() }))
vi.mock('~/utils/configPaths', () => ({ configPaths: { settings: {} } }))
vi.mock('webdav', () => ({
  AuthType: {},
  createClient: () => ({ putFileContents: state.put, createDirectory: state.mkdir }),
}))
vi.mock('fs-extra', () => ({
  default: {
    existsSync: (file: string) => state.files.has(path.basename(file)),
    readFileSync: (file: string, options?: { encoding: string }) => {
      const content = Buffer.from(state.files.get(path.basename(file))!)
      return options?.encoding === 'base64' ? content.toString('base64') : content
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  state.files.clear()
  state.put.mockResolvedValue(true)
})

describe('configuration sync backups', () => {
  it('uploads all four expected files even before local startup backups exist', async () => {
    state.files.set('data.json', '{"settings":{}}')
    state.files.set('manage.json', '{"picBed":{}}')
    expect(await uploadFile(['data.json', 'data.bak.json', 'manage.json', 'manage.bak.json'])).toBe(4)
    expect(state.put.mock.calls.map(([file, buffer]) => [file, buffer.toString()])).toEqual([
      ['piclist/data.json', '{"settings":{}}'],
      ['piclist/data.bak.json', '{"settings":{}}'],
      ['piclist/manage.json', '{"picBed":{}}'],
      ['piclist/manage.bak.json', '{"picBed":{}}'],
    ])
    expect(state.files.size).toBe(2)
  })

  it('preserves the contents of an existing backup', async () => {
    state.files.set('data.json', '{"current":true}')
    state.files.set('data.bak.json', '{"previous":true}')
    expect(await uploadFile(['data.bak.json'])).toBe(1)
    expect(state.put.mock.calls[0][1].toString()).toBe('{"previous":true}')
  })

  it('does not report success when neither the primary nor the backup exists', async () => {
    expect(await uploadFile(['data.json', 'data.bak.json'])).toBe(0)
    expect(state.put).not.toHaveBeenCalled()
  })

  it('still reports a real WebDAV write failure', async () => {
    state.files.set('data.json', '{}')
    state.put.mockRejectedValue(new Error('write failed'))
    expect(await uploadFile(['data.bak.json'])).toBe(0)
  })

  it('does not count a false WebDAV result as a successful write', async () => {
    state.files.set('data.json', '{}')
    state.put.mockResolvedValue(false)
    expect(await uploadFile(['data.json'])).toBe(0)
  })
})
