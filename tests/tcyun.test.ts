import { beforeEach, describe, expect, it, vi } from 'vitest'

import TcyunApi from '../src/main/manage/apis/tcyun'

const state = vi.hoisted(() => ({
  batches: [] as string[][],
  taskIds: new Set<string>(),
  uploadFiles: vi.fn(),
  queue: { getUploadTask: vi.fn(), addUploadTask: vi.fn(), updateUploadTask: vi.fn() },
}))

vi.mock('cos-nodejs-sdk-v5', () => ({
  default: class {
    uploadFiles = state.uploadFiles
  },
}))
vi.mock('apis/app/window/windowManager', () => ({ default: {} }))
vi.mock('electron', () => ({ ipcMain: {} }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: { getInstance: () => state.queue } }))
vi.mock('~/manage/utils/common', () => ({ formatError: vi.fn(), getFileMimeType: () => 'text/plain' }))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/utils/common', () => ({ handleUrlEncode: vi.fn(), isImage: vi.fn() }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/static', () => ({}))

const files = ['a.txt', 'b.txt', 'c.txt'].map(fileName => ({
  bucketName: 'test-bucket',
  region: 'ap-test',
  key: fileName,
  fileName,
  filePath: `/uploads/${fileName}`,
  fileSize: 10,
}))
const api = new TcyunApi('test-id', 'test-key', { error: vi.fn() } as never)

beforeEach(() => {
  vi.clearAllMocks()
  state.batches.length = 0
  state.taskIds.clear()
  state.queue.getUploadTask.mockImplementation((id: string) => state.taskIds.has(id))
  state.queue.addUploadTask.mockImplementation(({ id }: { id: string }) => state.taskIds.add(id))
  state.uploadFiles.mockImplementation(({ files }: { files: { Key: string }[] }) => {
    // Snapshot each SDK submission before the caller can mutate its array.
    state.batches.push(files.map(file => file.Key))
  })
})

describe('COS manager batch uploads', () => {
  it('schedules three sources exactly once in one batch', async () => {
    expect(await api.uploadBucketFile({ fileArray: files })).toBe(true)

    expect(state.batches).toEqual([['a.txt', 'b.txt', 'c.txt']])
    expect(state.queue.addUploadTask).toHaveBeenCalledTimes(3)
  })

  it('skips queued files and repeated sources within the batch', async () => {
    await api.uploadBucketFile({ fileArray: [files[1]] })
    await api.uploadBucketFile({ fileArray: [files[0], files[1], files[0], files[2]] })

    expect(state.batches).toEqual([['b.txt'], ['a.txt', 'c.txt']])
    expect(state.queue.addUploadTask).toHaveBeenCalledTimes(3)
  })

  it('does not submit an empty batch', async () => {
    expect(await api.uploadBucketFile({ fileArray: [] })).toBe(true)

    expect(state.uploadFiles).not.toHaveBeenCalled()
    expect(state.queue.addUploadTask).not.toHaveBeenCalled()
  })

  it('does not submit a batch when every source is already queued', async () => {
    await api.uploadBucketFile({ fileArray: files })
    state.uploadFiles.mockClear()
    state.queue.addUploadTask.mockClear()

    expect(await api.uploadBucketFile({ fileArray: files })).toBe(true)

    expect(state.uploadFiles).not.toHaveBeenCalled()
    expect(state.queue.addUploadTask).not.toHaveBeenCalled()
  })
})
