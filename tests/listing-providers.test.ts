import { S3Client } from '@aws-sdk/client-s3'
import { ipcMain } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AliyunApi from '../src/main/manage/apis/aliyun'
import GithubApi from '../src/main/manage/apis/github'
import ImgurApi from '../src/main/manage/apis/imgur'
import LocalApi from '../src/main/manage/apis/local'
import QiniuApi from '../src/main/manage/apis/qiniu'
import S3plistApi from '../src/main/manage/apis/s3plist'
import SftpApi from '../src/main/manage/apis/sftp'
import SmmsApi from '../src/main/manage/apis/smms'
import TcyunApi from '../src/main/manage/apis/tcyun'
import UpyunApi from '../src/main/manage/apis/upyun'
import WebdavplistApi from '../src/main/manage/apis/webdavplist'
import { listingChannels } from '../src/universal/listing'
import { listFromProvider, listingIdentity } from './listingTestUtils'

const state = vi.hoisted(() => ({ request: vi.fn(), send: vi.fn() }))
vi.mock('electron', async () => ({ ipcMain: new (await import('node:events')).EventEmitter() }))
vi.mock('apis/app/window/windowManager', () => ({ default: { get: vi.fn() } }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: {} }))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/manage/utils/dogeAPI', () => ({ getTempToken: vi.fn() }))
vi.mock('~/manage/utils/common', () => ({
  getOptions: () => ({}),
  getAgent: () => ({}),
  formatError: () => 'Listing failed',
  ConcurrencyPromisePool: {},
  getFileMimeType: vi.fn(),
  NewDownloader: vi.fn(),
}))
vi.mock('~/utils/common', () => ({
  isImage: () => false,
  formatHttpProxy: (v: unknown) => v,
  formatEndpoint: (v: unknown) => v,
}))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/sshClient', () => ({ default: class {}, quoteShellArgument: (s: string) => s }))
vi.mock('~/utils/digestAuth', () => ({ getAuthHeader: vi.fn() }))
vi.mock('got', () => ({ default: (...args: any[]) => state.request(...args) }))
vi.mock('fs-extra', () => ({
  default: { realpath: async (path: string) => path, readdir: (...args: any[]) => state.request(...args) },
}))
vi.mock('qiniu', () => ({
  default: {
    conf: { Config: class {} },
    rs: {
      BucketManager: class {
        listPrefix(bucket: string, options: unknown, callback: (...args: any[]) => void) {
          state.request(bucket, options).then(
            (result: any) => callback(null, result.respBody, result.respInfo),
            (error: Error) => callback(error),
          )
        }
      },
    },
  },
}))

const providers = [
  ['aliyun', AliyunApi, { res: { statusCode: 200 }, objects: [], prefixes: [], isTruncated: false }],
  ['github', GithubApi, { statusCode: 200, body: { tree: [] } }],
  ['imgur', ImgurApi, { statusCode: 200, body: { success: true, data: { images: [] } } }],
  ['local', LocalApi, []],
  ['qiniu', QiniuApi, { respInfo: { statusCode: 200 }, respBody: { items: [], commonPrefixes: [] } }],
  ['s3plist', S3plistApi, { $metadata: { httpStatusCode: 200 }, Contents: [], CommonPrefixes: [], IsTruncated: false }],
  ['sftp', SftpApi, []],
  ['smms', SmmsApi, { status: 200, data: { success: true, data: [] } }],
  ['tcyun', TcyunApi, { statusCode: 200, Contents: [], CommonPrefixes: [], IsTruncated: 'false' }],
  ['upyun', UpyunApi, { files: [], next: 'end' }],
  ['webdavplist', WebdavplistApi, { status: 200, data: [] }],
] as const

beforeEach(() => {
  vi.resetAllMocks()
  ipcMain.removeAllListeners()
  vi.spyOn(S3Client.prototype, 'send').mockImplementation((...args: any[]) => state.request(...args))
})
afterEach(() => {
  vi.restoreAllMocks()
  ipcMain.removeAllListeners()
})

describe.each(providers)('%s listing contract', (name, Provider, response) => {
  const methods = ['getBucketListBackstage', 'getBucketListRecursively', 'getBucketFileList'].filter(
    method => method in Provider.prototype,
  )
  function fixture() {
    const api = Object.assign(Object.create(Provider.prototype), {
      getNewCtx: () => ({ listV2: state.request }),
      ctx: { getBucket: state.request, getDirectoryContents: state.request },
      cli: { listDir: state.request },
      axiosInstance: state.request,
      stopMarker: 'end',
      getDogeCloudToken: async () => {},
      baseOptions: { region: 'us-east-1' },
      withClient: (callback: (client: any) => unknown) =>
        callback({ readDirectory: state.request, execCommand: state.request }),
      logParam: vi.fn(),
      isRequestSuccess: (status: number) => (name === 'sftp' ? status === 0 : status === 200),
    })
    const result = response
    const config = {
      accountId: 'account',
      provider: name,
      requestId: 'one',
      bucketName: 'bucket',
      prefix: '/album/',
      bucketConfig: { Location: 'test' },
      baseDir: '/',
      currentPage: 1,
      itemsPerPage: 50,
      customUrl: 'https://example.invalid',
    }
    return { api, result, config }
  }

  it.each(methods)('%s identifies all results and removes only its own listener on success', async method => {
    const { api, result, config } = fixture()
    state.request.mockResolvedValue(result)
    const kind = method === 'getBucketListRecursively' ? 'download' : 'files'
    const request = listingIdentity(config, kind)
    const channels = listingChannels(kind)
    const other = vi.fn()
    ipcMain.on(channels.cancel, other)
    await expect(listFromProvider(api, method, config, state.send)).resolves.toMatchObject({
      ...request,
      phase: 'complete',
      success: true,
    })
    for (const [channel, event] of state.send.mock.calls) {
      expect(channel).toBe(channels.result)
      expect(event).toMatchObject(request)
    }
    expect(ipcMain.listeners(channels.cancel)).toEqual([other])
  })

  it.each(methods)('%s cancels an in-flight job while another job finishes', async method => {
    const { api, result, config } = fixture()
    const releases: ((result: unknown) => void)[] = []
    state.request.mockImplementation(() => new Promise(resolve => releases.push(resolve)))
    const kind = method === 'getBucketListRecursively' ? 'download' : 'files'
    const channels = listingChannels(kind)
    const second = { ...config, requestId: 'two' }
    const one = listFromProvider(api, method, config, state.send)
    const two = listFromProvider(api, method, second, state.send)
    await vi.waitFor(() => expect(releases).toHaveLength(2))
    ipcMain.emit(channels.cancel, {}, listingIdentity(config, kind))
    await expect(one).resolves.toMatchObject({ requestId: 'one', phase: 'cancelled', success: false })
    expect(ipcMain.listenerCount(channels.cancel)).toBe(1)
    releases[0](result)
    releases[1](result)
    await expect(two).resolves.toMatchObject({ ...listingIdentity(second, kind), phase: 'complete', success: true })
    expect(ipcMain.listenerCount(channels.cancel)).toBe(0)
    expect(state.request).toHaveBeenCalledTimes(2)
    const cancelled = state.send.mock.calls.filter(([, event]) => event.requestId === 'one')
    if (method !== 'getBucketFileList')
      expect(cancelled).toEqual([[channels.result, expect.objectContaining({ phase: 'cancelled' })]])
  })

  it.each(methods)('%s identifies failures and releases cancellation listeners', async method => {
    const { api, config } = fixture()
    state.request.mockRejectedValue(new Error('Test listing failure'))
    const kind = method === 'getBucketListRecursively' ? 'download' : 'files'
    await expect(listFromProvider(api, method, config, state.send)).resolves.toMatchObject({
      ...listingIdentity(config, kind),
      phase: 'error',
      finished: true,
      success: false,
      error: 'LISTING_FAILED',
    })
    expect(ipcMain.listenerCount(listingChannels(kind).cancel)).toBe(0)
  })
})
