import { beforeEach, describe, expect, it, vi } from 'vitest'

import UpyunApi from '../src/main/manage/apis/upyun'
import { listFromProvider } from './listingTestUtils'

const state = vi.hoisted(() => ({ listDir: vi.fn(), send: vi.fn() }))

vi.mock('upyun', () => ({
  default: {
    Service: class {},
    Client: class {
      listDir = state.listDir
    },
  },
}))
vi.mock('apis/app/window/windowManager', () => ({
  default: { get: () => ({ webContents: { send: state.send } }) },
}))
vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events')
  return { ipcMain: new EventEmitter() }
})
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: {} }))
vi.mock('~/manage/utils/common', () => ({}))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/utils/common', () => ({ isImage: () => false }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/static', () => ({
  cancelDownloadLoadingFileList: 'cancelDownloadLoadingFileList',
  refreshDownloadFileTransferList: 'refreshDownloadFileTransferList',
}))

const api = new UpyunApi('test-bucket', 'test-operator', 'test-password', { error: vi.fn() } as never)
const config = { bucketName: 'test-bucket', customUrl: 'https://cdn.example.test', cancelToken: 'test-download' }
const file = (name: string) => ({ name, type: 'N', size: 10, time: '1700000000' })
const folder = (name: string) => ({ name, type: 'F' })

function mockDirectories(directories: Record<string, { name: string; type: string }[]>) {
  const visited = new Set<string>()
  state.listDir.mockImplementation(async (key: string) => {
    // Upyun accepts paths with or without a leading slash.
    const directory = `/${key.replace(/^\/+/, '')}`
    const entries = directories[directory]
    if (!entries) throw new Error(`Unexpected directory: ${directory}`)
    if (visited.has(directory)) throw new Error(`Directory visited twice: ${directory}`)
    visited.add(directory)
    return { files: entries, next: api.stopMarker }
  })
}

function expectFiles(keys: string[]) {
  expect(state.send).toHaveBeenLastCalledWith(
    'refreshDownloadFileTransferList',
    expect.objectContaining({
      fullList: keys.map(key => expect.objectContaining({ key, url: `${config.customUrl}/${key}` })),
      success: true,
      finished: true,
    }),
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Upyun recursive enumeration', () => {
  it.each(['/root/', '/root'])('keeps the current parent across three directory levels from %s', async prefix => {
    mockDirectories({
      '/root/': [file('top.png'), folder('child')],
      '/root/child/': [file('middle.png'), folder('grand')],
      '/root/child/grand/': [file('photo.png')],
    })

    await listFromProvider(api, 'getBucketListRecursively', { ...config, prefix }, state.send)

    expect(state.listDir.mock.calls).toEqual([
      ['/root/', { limit: 10000, iter: '' }],
      ['/root/child/', { limit: 10000, iter: '' }],
      ['/root/child/grand/', { limit: 10000, iter: '' }],
    ])
    expectFiles(['root/top.png', 'root/child/middle.png', 'root/child/grand/photo.png'])
  })

  it('visits repeated names under different parents and ancestors exactly once', async () => {
    mockDirectories({
      '/root/': [folder('left'), folder('right'), folder('shared')],
      '/root/left/': [folder('shared')],
      '/root/right/': [folder('shared')],
      '/root/shared/': [file('root.png'), folder('shared')],
      '/root/left/shared/': [file('left.png')],
      '/root/right/shared/': [file('right.png')],
      '/root/shared/shared/': [file('nested.png')],
    })

    await listFromProvider(api, 'getBucketListRecursively', { ...config, prefix: '/root/' }, state.send)

    expect(state.listDir.mock.calls.map(([key]) => key)).toEqual([
      '/root/',
      '/root/left/',
      '/root/right/',
      '/root/shared/',
      '/root/left/shared/',
      '/root/right/shared/',
      '/root/shared/shared/',
    ])
    expectFiles([
      'root/shared/root.png',
      'root/left/shared/left.png',
      'root/right/shared/right.png',
      'root/shared/shared/nested.png',
    ])
  })

  it('formats file keys and URLs consistently when starting at the bucket root', async () => {
    mockDirectories({
      '/': [file('top.png'), folder('child')],
      '/child/': [folder('grand')],
      '/child/grand/': [file('photo.png')],
    })

    await listFromProvider(api, 'getBucketListRecursively', { ...config, prefix: '/' }, state.send)

    expect(state.listDir.mock.calls.map(([key]) => key)).toEqual(['/', '/child/', '/child/grand/'])
    expectFiles(['top.png', 'child/grand/photo.png'])
  })

  it('uses each directory pagination marker before traversing its children', async () => {
    state.listDir
      .mockResolvedValueOnce({ files: [file('top.png')], next: 'root-page-2' })
      .mockResolvedValueOnce({ files: [folder('child')], next: api.stopMarker })
      .mockResolvedValueOnce({ files: [file('middle.png')], next: 'child-page-2' })
      .mockResolvedValueOnce({ files: [folder('grand')], next: api.stopMarker })
      .mockResolvedValueOnce({ files: [file('photo.png')], next: api.stopMarker })

    await listFromProvider(api, 'getBucketListRecursively', { ...config, prefix: '/root/' }, state.send)

    expect(state.listDir.mock.calls).toEqual([
      ['/root/', { limit: 10000, iter: '' }],
      ['/root/', { limit: 10000, iter: 'root-page-2' }],
      ['/root/child/', { limit: 10000, iter: '' }],
      ['/root/child/', { limit: 10000, iter: 'child-page-2' }],
      ['/root/child/grand/', { limit: 10000, iter: '' }],
    ])
    expectFiles(['root/top.png', 'root/child/middle.png', 'root/child/grand/photo.png'])
  })
})
