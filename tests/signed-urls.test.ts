import { beforeEach, describe, expect, it, vi } from 'vitest'

import S3plistApi from '../src/main/manage/apis/s3plist'
import { NewDownloader } from '../src/main/manage/utils/common'
import { addCacheBustParam, isS3SignedUrl } from '../src/universal/utils/url'

const state = vi.hoisted(() => ({
  downloader: vi.fn(),
  download: vi.fn(),
  queue: { getDownloadTask: vi.fn(), addDownloadTask: vi.fn(), updateDownloadTask: vi.fn() },
}))
vi.mock('nodejs-file-downloader', () => ({
  default: class {
    constructor(options: object) {
      state.downloader(options)
    }

    download = state.download
  },
}))
vi.mock('electron', () => ({ app: {}, ipcMain: {} }))
vi.mock('apis/app/window/windowManager', () => ({ default: {} }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: { getInstance: () => state.queue } }))
vi.mock('~/manage/utils/common', () => import('../src/main/manage/utils/common'))
vi.mock('~/manage/utils/dogeAPI', () => ({}))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/utils/common', () => ({
  formatHttpProxy: (value: unknown) => value,
  formatEndpoint: (value: string) => value,
  isImage: vi.fn(),
}))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/static', () => ({}))
vi.mock('#/utils/url', () => import('../src/universal/utils/url'))

beforeEach(() => {
  vi.clearAllMocks()
  state.download.mockResolvedValue(undefined)
})

describe('signed S3 URLs', () => {
  it('preserves the SDK URL through the manager, downloader, and preview for a key with reserved characters', async () => {
    const api = new S3plistApi(
      'test-access-key',
      'test-secret-key',
      'https://s3.example.invalid',
      true,
      true,
      undefined,
      { error: vi.fn() } as never,
    )
    const signer = vi.spyOn(api, 'getPreSignedUrl')
    await api.downloadBucketFile({
      downloadPath: '/downloads',
      maxDownloadFileCount: 1,
      fileArray: [
        { bucketName: 'test-bucket', region: 'us-east-1', key: 'folder/a %2F#?+中.png', fileName: 'image.png' },
      ],
    })
    const signedUrl = await signer.mock.results[0].value
    expect(isS3SignedUrl(signedUrl)).toBe(true)
    expect(signedUrl).toContain('a%20%252F%23%3F%2B%E4%B8%AD.png')
    expect(state.downloader).toHaveBeenCalledWith(expect.objectContaining({ url: signedUrl }))
    expect(addCacheBustParam(signedUrl, 123)).toBe(signedUrl)
    expect(state.download).toHaveBeenCalledOnce()
  })

  it('preserves encoded credentials, session tokens, and signatures exactly', async () => {
    const url =
      'https://s3.example.invalid/a%25b?X-Amz-Credential=test%2Fscope&X-Amz-Security-Token=a%2Bb%2Fc%3D&X-Amz-Signature=abc'
    await NewDownloader(state.queue as never, url, 'download', '/downloads/image.png')
    expect(state.downloader).toHaveBeenCalledWith(expect.objectContaining({ url }))
    expect(addCacheBustParam(url, 456)).toBe(url)
  })

  it('also preserves legacy S3 signatures', () => {
    const url = 'https://s3.example.invalid/image?AWSAccessKeyId=test&Expires=123&Signature=a%2Bb%3D'
    expect(isS3SignedUrl(url)).toBe(true)
    expect(addCacheBustParam(url, 123)).toBe(url)
  })

  it('retains download encoding for unsigned URLs containing spaces', async () => {
    await NewDownloader(state.queue as never, 'https://example.invalid/a b.png', 'download', '/downloads/image.png')
    expect(state.downloader).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.invalid/a%20b.png' }))
  })

  it.each([
    ['https://example.invalid/a.png', 'https://example.invalid/a.png?cbplist=123'],
    ['https://example.invalid/a.png?size=100', 'https://example.invalid/a.png?size=100&cbplist=123'],
    ['https://example.invalid/a.png#image', 'https://example.invalid/a.png?cbplist=123#image'],
    ['file:///images/a.png', 'file:///images/a.png'],
    ['blob:test', 'blob:test'],
    [undefined, ''],
  ])('keeps preview behavior for unsigned URL %s', (url, expected) => {
    expect(addCacheBustParam(url, 123)).toBe(expected)
  })
})
