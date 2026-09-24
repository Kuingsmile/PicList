import { EventEmitter } from 'node:events'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { IRPCActionType } from '../src/renderer/utils/enum'
import type { ListingRequest } from '../src/universal/listing'
import { createBucketHarness } from './bucketPageHarness'

const mounted: ReturnType<typeof createBucketHarness>[] = []
function mount(options: Parameters<typeof createBucketHarness>[0] = {}) {
  const page = createBucketHarness(options)
  mounted.push(page)
  return page
}
function deferred<T = any>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
const files = (key: string) => [{ key, fileName: key }]
const response = (request: ListingRequest, key: string) => ({
  ...request,
  fullList: files(key),
  success: true,
  finished: true,
  phase: 'complete',
})
afterEach(() => {
  for (const page of mounted.splice(0)) page.app.unmount()
  vi.useRealTimers()
})

describe('listing consumers', () => {
  it('finishes active listing errors without caching partial data or queuing downloads', async () => {
    const put = vi.fn()
    const page = mount({ cache: { table: () => ({ put }) } })
    await page.resetParam(true)
    page.emit(page.fileListings.request!, { phase: 'error', success: false, fullList: files('partial') })
    expect(page.isLoadingData.value).toBe(false)
    expect(page.events.listenerCount('refreshFileTransferList')).toBe(0)
    expect(put).not.toHaveBeenCalled()
    await page.handleFolderBatchDownload({ key: 'folder/' })
    page.emit(page.downloadListings.request!, { phase: 'error', success: false, fullList: files('partial') })
    expect(page.isLoadingDownloadData.value).toBe(false)
    expect(page.events.listenerCount('refreshDownloadFileTransferList')).toBe(0)
    expect(page.message.error).toHaveBeenCalledTimes(2)
    expect(
      page.sendRPC.mock.calls.filter(([action]) => action === IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE),
    ).toHaveLength(0)
  })
  it('subscribes before dispatch, including synchronous empty completions', async () => {
    const page = mount()
    page.sendRPC.mockImplementation((_action, _alias, request) => page.emit(request))
    await page.resetParam(true)
    expect(page.isLoadingData.value).toBe(false)
    expect(page.events.listenerCount('refreshFileTransferList')).toBe(0)
    expect(page.message.success).toHaveBeenCalledOnce()
  })

  it('keeps two consumers separate and cancels one without removing the other subscription', async () => {
    const events = new EventEmitter()
    const first = mount({ events })
    const second = mount({ events })
    await first.resetParam(true)
    await second.resetParam(true)
    const one = first.fileListings.request!
    const two = second.fileListings.request!
    expect(one.requestId).not.toBe(two.requestId)
    expect(events.listenerCount('refreshFileTransferList')).toBe(2)
    first.emit(one, { fullList: files('one'), finished: false, phase: 'page', success: false })
    expect(first.currentPageFilesInfo).toEqual(files('one'))
    expect(second.currentPageFilesInfo).toEqual([])
    await first.cancelLoading()
    expect(first.sendToMain).toHaveBeenLastCalledWith('cancelLoadingFileList', one)
    expect(events.listenerCount('refreshFileTransferList')).toBe(1)
    second.emit(two, { fullList: files('two') })
    expect(second.currentPageFilesInfo).toEqual(files('two'))
    expect(second.isLoadingData.value).toBe(false)
    expect(events.listenerCount('refreshFileTransferList')).toBe(0)
  })

  it('rejects old pages and errors after rapid navigation and only caches the completed new path', async () => {
    const put = vi.fn()
    const page = mount({ cache: { table: () => ({ put }) } })
    await page.resetParam(true)
    const old = page.fileListings.request!
    page.configMap.value.prefix = '/next/'
    await page.resetParam(true)
    const current = page.fileListings.request!
    page.emit(old, { phase: 'error', success: false, fullList: files('old') })
    expect(page.currentPageFilesInfo).toEqual([])
    expect(page.message.error).not.toHaveBeenCalled()
    page.emit(current, { fullList: files('new') })
    expect(page.currentPageFilesInfo).toEqual(files('new'))
    expect(put).toHaveBeenCalledExactlyOnceWith({ key: 'cache-test@bucket@/next/', value: { fullList: files('new') } })
    page.emit(old)
    expect(page.message.success).toHaveBeenCalledOnce()
  })

  it.each(['resolve', 'reject'] as const)('ignores a stale cache %s after navigation', async mode => {
    const pending = deferred()
    const page = mount({
      cache: { table: () => ({ where: () => ({ equals: () => ({ toArray: () => pending.promise }) }), put: vi.fn() }) },
    })
    const old = page.resetParam()
    page.configMap.value.prefix = '/next/'
    await page.resetParam(true)
    page.emit(page.fileListings.request!, { fullList: files('new') })
    if (mode === 'resolve') pending.resolve([{ value: { fullList: files('old') } }])
    else pending.reject(new Error('Cache unavailable'))
    await old
    expect(page.currentPageFilesInfo).toEqual(files('new'))
    expect(page.sendRPC).toHaveBeenCalledOnce()
  })

  it.each(['resolve', 'reject'] as const)('ignores a stale paginated RPC %s and its markers', async mode => {
    const pending = deferred()
    const page = mount()
    page.paging.value = true
    page.triggerRPC.mockImplementationOnce(() => pending.promise)
    const old = page.resetParam(true)
    const oldRequest = page.fileListings.request!
    page.configMap.value.prefix = '/next/'
    page.triggerRPC.mockImplementationOnce(async (_action: string, _alias: string, request: ListingRequest) => ({
      ...response(request, 'new'),
      isTruncated: true,
      nextMarker: 'new-marker',
    }))
    await page.resetParam(true)
    if (mode === 'resolve')
      pending.resolve({ ...response(oldRequest, 'old'), isTruncated: true, nextMarker: 'old-marker' })
    else pending.reject(new Error('Old request failed'))
    await old
    expect(page.currentPageFilesInfo).toEqual(files('new'))
    expect(page.pagingMarker.value).toBe('new-marker')
    expect(page.message.error).not.toHaveBeenCalled()
    expect(page.isShowLoadingPage.value).toBe(false)
  })

  it('ignores old account domain initialization before starting its listing', async () => {
    const oldDomain = deferred()
    const page = mount({
      watchConfig: true,
      rpc: async (_action, alias) => (alias === 'cache-test' ? oldDomain.promise : []),
    })
    page.context.manageStore.config.picBed.second = {}
    page.props.configMap = { ...page.configMap.value, alias: 'second', bucketName: 'second-bucket' }
    await vi.waitFor(() => expect(page.sendRPC).toHaveBeenCalledOnce())
    oldDomain.resolve(['https://old.example.invalid'])
    await nextTick()
    expect(page.sendRPC).toHaveBeenCalledExactlyOnceWith(
      IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE,
      'second',
      expect.objectContaining({ accountId: 'second', bucketName: 'second-bucket' }),
    )
    expect(page.currentCustomDomain.value).not.toBe('https://old.example.invalid')
  })

  it('rejects stale recursive results and queues the active download only once', async () => {
    const page = mount()
    await page.handleFolderBatchDownload({ key: 'old/' })
    const old = page.downloadListings.request!
    page.configMap.value = { ...page.configMap.value, alias: 'second', bucketName: 'second-bucket', prefix: '/new/' }
    await page.resetParam(true)
    page.emit(old, { fullList: files('old/one.png') })
    expect(
      page.sendRPC.mock.calls.filter(([action]) => action === IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE),
    ).toHaveLength(0)
    await page.handleFolderBatchDownload({ key: 'new/' })
    const current = page.downloadListings.request!
    page.emit(current, { fullList: files('new/two.png') })
    page.emit(current, { fullList: files('new/two.png') })
    expect(page.sendRPC.mock.calls.filter(([action]) => action === IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE)).toEqual(
      [
        [
          IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE,
          'second',
          expect.objectContaining({
            fileArray: [expect.objectContaining({ alias: 'second', bucketName: 'second-bucket', key: 'new/two.png' })],
          }),
        ],
      ],
    )
  })

  it('releases only its listeners, cancels both jobs and clears timers on component unmount', async () => {
    vi.useFakeTimers()
    const events = new EventEmitter()
    const other = vi.fn()
    events.on('refreshFileTransferList', other)
    const page = mount({ events })
    await page.resetParam(true)
    const request = page.fileListings.request!
    await page.handleFolderBatchDownload({ key: 'folder/' })
    const download = page.downloadListings.request!
    page.isShowUploadPanel.value = true
    page.isShowDownloadPanel.value = true
    page.startRefreshUploadTask()
    page.startRefreshDownloadTask()
    expect(vi.getTimerCount()).toBe(2)
    page.app.unmount()
    expect(vi.getTimerCount()).toBe(0)
    expect(events.listeners('refreshFileTransferList')).toEqual([other])
    expect(events.listenerCount('refreshDownloadFileTransferList')).toBe(0)
    expect(page.sendToMain).toHaveBeenCalledWith('cancelLoadingFileList', request)
    expect(page.sendToMain).toHaveBeenCalledWith('cancelDownloadLoadingFileList', download)
    page.emit(request, { fullList: files('late') })
    page.emit(download, { fullList: files('late') })
    expect(page.currentPageFilesInfo).toEqual([])
    expect(page.message.success).not.toHaveBeenCalled()
    expect(
      page.sendRPC.mock.calls.filter(([action]) => action === IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE),
    ).toHaveLength(0)
  })

  it('ignores pending cache and RPC work after component unmount', async () => {
    const pending = deferred()
    const page = mount({ rpc: () => pending.promise })
    page.paging.value = true
    const loading = page.resetParam(true)
    const request = page.fileListings.request!
    page.app.unmount()
    pending.resolve(response(request, 'late'))
    await loading
    expect(page.currentPageFilesInfo).toEqual([])
    expect(page.message.error).not.toHaveBeenCalled()
    expect(page.fileListings.request).toBeUndefined()
  })
})
