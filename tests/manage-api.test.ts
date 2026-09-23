import { ipcMain } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ManageApi } from '../src/main/manage/manageApi'

const state = vi.hoisted(() => ({
  getWindow: vi.fn(),
  send: vi.fn(),
  error: vi.fn(),
  list: vi.fn(),
}))

vi.mock('@core/datastore/dirs', () => ({ manageConfigPath: () => '/mock/manage.json' }))
vi.mock('apis/app/window/windowManager', () => ({ default: { get: state.getWindow } }))
vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events')
  return { ipcMain: new EventEmitter() }
})
vi.mock('fs-extra', () => ({ default: { pathExistsSync: () => true } }))
vi.mock('~/manage/apis/api', () => ({ default: {} }))
vi.mock('~/manage/datastore/db', () => ({
  default: class {
    read() {
      return { picBed: { test: { picBedName: 'aliyun' } } }
    }
  },
}))
vi.mock('~/manage/utils/common', () => ({ formatError: () => 'Listing failed' }))
vi.mock('~/manage/utils/logger', () => ({
  ManageLogger: class {
    error = state.error
  },
}))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/static', () => import('../src/main/utils/static'))

let api: ManageApi
const params = { cancelToken: 'test-list' }
const failure = { fullList: [], success: false, finished: true }

beforeEach(() => {
  vi.resetAllMocks()
  ipcMain.removeAllListeners()
  state.getWindow.mockReturnValue({ webContents: { send: state.send } })
  api = new ManageApi('test')
  vi.spyOn(api, 'createClient').mockReturnValue({
    getBucketListBackstage: state.list,
    getBucketListRecursively: state.list,
    getBucketFileList: state.list,
  })
})

afterEach(() => {
  ipcMain.removeAllListeners()
  vi.restoreAllMocks()
})

describe.each([
  {
    method: 'getBucketListBackstage' as const,
    refreshEvent: 'refreshFileTransferList',
    cancelEvent: 'cancelLoadingFileList',
    otherCancelEvent: 'cancelDownloadLoadingFileList',
  },
  {
    method: 'getBucketListRecursively' as const,
    refreshEvent: 'refreshDownloadFileTransferList',
    cancelEvent: 'cancelDownloadLoadingFileList',
    otherCancelEvent: 'cancelLoadingFileList',
  },
])('$method terminal updates', ({ method, refreshEvent, cancelEvent, otherCancelEvent }) => {
  it.each([false, true])('finishes a rejected listing, including after progress: %s', async emitProgress => {
    const otherCancel = vi.fn()
    ipcMain.on(otherCancelEvent, otherCancel)
    state.list.mockImplementation(async () => {
      ipcMain.on(cancelEvent, vi.fn())
      if (emitProgress) {
        state.send(refreshEvent, { fullList: [{ key: 'first.png' }], success: false, finished: false })
      }
      throw new Error('Listing request failed')
    })

    await api[method](params)

    expect(state.list).toHaveBeenCalledExactlyOnceWith(params)
    expect(state.send).toHaveBeenLastCalledWith(refreshEvent, failure)
    expect(state.send.mock.calls.filter(([, result]) => result.finished)).toHaveLength(1)
    expect(state.error).toHaveBeenCalledTimes(1)
    expect(ipcMain.listenerCount(cancelEvent)).toBe(0)
    expect(ipcMain.listeners(otherCancelEvent)).toEqual([otherCancel])
  })

  it('finishes when client construction throws', async () => {
    vi.mocked(api.createClient).mockImplementation(() => {
      throw new Error('Invalid client configuration')
    })

    await api[method](params)

    expect(state.send).toHaveBeenCalledExactlyOnceWith(refreshEvent, failure)
    expect(state.list).not.toHaveBeenCalled()
    expect(state.error).toHaveBeenCalledTimes(1)
  })

  it.each([false, true])('does not duplicate a provider terminal event with success %s', async success => {
    const result = { fullList: [], success, finished: true }
    state.list.mockImplementation(async () => {
      state.send(refreshEvent, result)
    })

    await api[method](params)

    expect(state.send).toHaveBeenCalledExactlyOnceWith(refreshEvent, result)
    expect(state.error).not.toHaveBeenCalled()
  })

  it('cleans up a failed listing when the settings window is absent', async () => {
    state.getWindow.mockReturnValue(undefined)
    state.list.mockImplementation(async () => {
      ipcMain.on(cancelEvent, vi.fn())
      throw new Error('Listing request failed')
    })

    await api[method](params)

    expect(ipcMain.listenerCount(cancelEvent)).toBe(0)
    expect(state.send).not.toHaveBeenCalled()
    expect(state.error).toHaveBeenCalledTimes(1)
  })
})

it('preserves returned fallbacks for paginated listing errors', async () => {
  state.list.mockRejectedValue(new Error('Listing request failed'))

  await expect(api.getBucketFileList(params)).resolves.toEqual({
    fullList: [],
    isTruncated: false,
    nextMarker: '',
    success: false,
  })

  expect(state.send).not.toHaveBeenCalled()
  expect(state.error).toHaveBeenCalledTimes(1)
})
