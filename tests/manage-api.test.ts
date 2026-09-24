import { ipcMain } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ListingContext } from '../src/main/manage/listingRequest'
import { ManageApi } from '../src/main/manage/manageApi'
import { listingChannels, type ListingData, type ListingRequest } from '../src/universal/listing'

const state = vi.hoisted(() => ({ getWindow: vi.fn(), send: vi.fn(), error: vi.fn(), list: vi.fn() }))
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

let api: ManageApi
const identity: ListingRequest = {
  requestId: 'first',
  accountId: 'test',
  provider: 'aliyun',
  bucketName: 'photos',
  prefix: '/album/',
  kind: 'files',
}
const complete: ListingData = { fullList: [{ key: 'one.png' }], success: true, finished: true }
function deferred<T>() {
  let resolve!: (result: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.resetAllMocks()
  ipcMain.removeAllListeners()
  state.getWindow.mockReturnValue({ webContents: { send: state.send } })
  api = new ManageApi('test')
  vi.spyOn(api, 'createClient').mockReturnValue({
    getBucketList: state.list,
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
  { method: 'getBucketListBackstage' as const, kind: 'files' as const },
  { method: 'getBucketListRecursively' as const, kind: 'download' as const },
])('$method request isolation', ({ method, kind }) => {
  const request = { ...identity, kind }
  const channels = listingChannels(kind)

  it('completes one simultaneous job without removing the other job cancellation handler', async () => {
    const first = deferred<ListingData>()
    const second = deferred<ListingData>()
    const contexts: ListingContext[] = []
    state.list.mockImplementation((param, context) => {
      contexts.push(context)
      return param.requestId === request.requestId ? first.promise : second.promise
    })
    const one = api[method](request)
    const secondRequest = { ...request, requestId: 'second' }
    const two = api[method](secondRequest)
    expect(ipcMain.listenerCount(channels.cancel)).toBe(2)
    first.resolve(complete)
    await expect(one).resolves.toMatchObject({ ...request, phase: 'complete', ...complete })
    expect(ipcMain.listenerCount(channels.cancel)).toBe(1)
    ipcMain.emit(channels.cancel, {}, secondRequest)
    await expect(two).resolves.toMatchObject({ ...secondRequest, phase: 'cancelled', finished: true, success: false })
    expect(contexts[0].signal.aborted).toBe(false)
    expect(contexts[1].signal.aborted).toBe(true)
    expect(ipcMain.listenerCount(channels.cancel)).toBe(0)
    second.resolve(complete)
    await Promise.resolve()
    expect(state.send.mock.calls.filter(([, result]) => result.finished)).toHaveLength(2)
  })

  it('cancels only the identified job and lets a second job finish on the same channel', async () => {
    const blocked = deferred<ListingData>()
    const live = deferred<ListingData>()
    const secondRequest = { ...request, requestId: 'second', prefix: '/other/' }
    state.list.mockImplementation((param, context: ListingContext) => {
      context.publish({ fullList: [{ key: param.prefix }], success: false, finished: false })
      return param.requestId === request.requestId ? blocked.promise : live.promise
    })
    const one = api[method](request)
    const two = api[method](secondRequest)
    for (const field of ['requestId', 'accountId', 'provider', 'bucketName', 'prefix', 'kind']) {
      ipcMain.emit(channels.cancel, {}, { ...request, [field]: 'wrong' })
    }
    expect(ipcMain.listenerCount(channels.cancel)).toBe(2)
    ipcMain.emit(channels.cancel, {}, request)
    await expect(one).resolves.toMatchObject({ ...request, phase: 'cancelled' })
    expect(ipcMain.listenerCount(channels.cancel)).toBe(1)
    live.resolve(complete)
    await expect(two).resolves.toMatchObject({ ...secondRequest, phase: 'complete', success: true })
    expect(ipcMain.listenerCount(channels.cancel)).toBe(0)
    for (const [, event] of state.send.mock.calls) {
      expect(event).toMatchObject(event.requestId === request.requestId ? request : secondRequest)
    }
  })

  it.each([false, true])(
    'reports a thrown error after progress %s and removes only its own listener',
    async progress => {
      const other = vi.fn()
      ipcMain.on(channels.cancel, other)
      state.list.mockImplementation(async (_param, context: ListingContext) => {
        if (progress) context.publish({ ...complete, success: false, finished: false })
        throw new Error('Listing failed')
      })
      await expect(api[method](request)).resolves.toMatchObject({
        ...request,
        phase: 'error',
        success: false,
        finished: true,
        error: 'LISTING_FAILED',
        fullList: progress ? complete.fullList : [],
      })
      expect(state.send.mock.calls.filter(([, result]) => result.finished)).toHaveLength(1)
      expect(state.error).toHaveBeenCalledOnce()
      expect(ipcMain.listeners(channels.cancel)).toEqual([other])
    },
  )

  it.each([true, false])('publishes a terminal result once for provider success %s', async success => {
    state.list.mockImplementation(async (_param, context: ListingContext) => {
      context.publish({ ...complete, success })
    })
    await api[method](request)
    expect(state.send).toHaveBeenCalledExactlyOnceWith(
      channels.result,
      expect.objectContaining({
        ...request,
        success,
        phase: success ? 'complete' : 'error',
        finished: true,
      }),
    )
    expect(ipcMain.listenerCount(channels.cancel)).toBe(0)
  })

  it.each(['construction', 'unsupported', 'no-window'])('terminates and cleans up for %s', async failure => {
    if (failure === 'construction')
      vi.mocked(api.createClient).mockImplementation(() => {
        throw new Error('Failed')
      })
    if (failure === 'unsupported') vi.mocked(api.createClient).mockReturnValue({})
    if (failure === 'no-window') {
      state.getWindow.mockReturnValue(undefined)
      state.list.mockRejectedValue(new Error('Failed'))
    }
    await expect(api[method](request)).resolves.toMatchObject({ ...request, phase: 'error', finished: true })
    expect(ipcMain.listenerCount(channels.cancel)).toBe(0)
    if (failure === 'no-window') expect(state.send).not.toHaveBeenCalled()
  })
})

it('uses the same identity for paginated responses and errors', async () => {
  state.list.mockResolvedValue({ ...complete, isTruncated: true, nextMarker: 'page-2' })
  await expect(api.getBucketFileList(identity)).resolves.toMatchObject({
    ...identity,
    phase: 'complete',
    isTruncated: true,
    nextMarker: 'page-2',
  })
  state.list.mockRejectedValue(new Error('Failed'))
  await expect(api.getBucketFileList(identity)).resolves.toMatchObject({ ...identity, phase: 'error', success: false })
  expect(state.send).not.toHaveBeenCalled()
  expect(ipcMain.listenerCount(listingChannels('files').cancel)).toBe(0)
})

it('cancels an unresolved paginated request', async () => {
  state.list.mockImplementation(() => new Promise(() => {}))
  const pending = api.getBucketFileList(identity)
  ipcMain.emit(listingChannels('files').cancel, {}, identity)
  await expect(pending).resolves.toMatchObject({ ...identity, phase: 'cancelled' })
  expect(ipcMain.listenerCount(listingChannels('files').cancel)).toBe(0)
})

it('cleans up when cancellation and a synchronous provider exception occur together', async () => {
  state.list.mockImplementation(() => {
    ipcMain.emit('cancelLoadingFileList', {}, identity)
    throw new Error('Cancelled SDK request')
  })
  await expect(api.getBucketFileList(identity)).resolves.toMatchObject({ ...identity, phase: 'cancelled' })
  expect(state.error).not.toHaveBeenCalled()
  expect(ipcMain.listenerCount('cancelLoadingFileList')).toBe(0)
})

it('emits a correlated error if the account has been removed', async () => {
  api.currentPicBedConfig = undefined as any
  await expect(api.getBucketListBackstage(identity)).resolves.toMatchObject({ ...identity, phase: 'error' })
  expect(state.send).toHaveBeenCalledExactlyOnceWith(
    'refreshFileTransferList',
    expect.objectContaining({ ...identity, phase: 'error' }),
  )
  expect(ipcMain.listenerCount('cancelLoadingFileList')).toBe(0)
})

it('correlates bucket inventory results with the account', async () => {
  const request = { ...identity, kind: 'buckets', bucketName: '', prefix: '' }
  state.list.mockResolvedValue([{ Name: 'photos' }])
  await expect(api.getBucketList(request)).resolves.toMatchObject({
    ...request,
    phase: 'complete',
    fullList: [{ Name: 'photos' }],
  })
})

it.each(['accountId', 'provider', 'kind', 'requestId'])('rejects a missing or inconsistent %s', async key => {
  await expect(api.getBucketListBackstage({ ...identity, [key]: '' })).rejects.toThrow(
    'Invalid listing request identity',
  )
  expect(state.list).not.toHaveBeenCalled()
  expect(ipcMain.listenerCount('cancelLoadingFileList')).toBe(0)
})
