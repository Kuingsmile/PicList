import { ListBucketsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import S3plistApi from '../src/main/manage/apis/s3plist'
import { getSupportedPicBedList } from '../src/renderer/manage/utils/constants'

const state = vi.hoisted(() => ({ getTempToken: vi.fn(), send: vi.fn(), removeAllListeners: vi.fn() }))

vi.mock('electron', () => ({ ipcMain: { on: vi.fn(), removeAllListeners: state.removeAllListeners } }))
vi.mock('apis/app/window/windowManager', () => ({
  default: { get: () => ({ webContents: { send: state.send } }) },
}))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: {} }))
vi.mock('~/manage/utils/common', () => ({
  getAgent: () => ({}),
  formatError: vi.fn(),
  ConcurrencyPromisePool: {},
  getFileMimeType: vi.fn(),
  NewDownloader: vi.fn(),
}))
vi.mock('~/manage/utils/dogeAPI', () => ({ getTempToken: state.getTempToken }))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/utils/common', () => ({
  formatHttpProxy: (value: unknown) => value,
  formatEndpoint: (value: string) => value,
  isImage: () => true,
}))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/static', () => ({
  cancelDownloadLoadingFileList: 'cancelDownloadLoadingFileList',
  refreshDownloadFileTransferList: 'refreshDownloadFileTransferList',
}))

beforeEach(() => vi.resetAllMocks())
afterEach(() => vi.restoreAllMocks())

function createApi(region = '', customUrl = '', dogeCloudSupport = false) {
  return new S3plistApi(
    'test-key',
    'test-secret',
    'https://s3.example.invalid',
    true,
    true,
    undefined,
    { error: vi.fn() } as never,
    dogeCloudSupport,
    '',
    region,
    customUrl,
  )
}

describe('S3 manager configuration', () => {
  it('offers region and custom URL fields in both create and edit form schemas', () => {
    const schema = getSupportedPicBedList(key => key).s3plist
    expect(schema.options).toEqual(expect.arrayContaining(['region', 'customUrl']))
    expect(schema.configOptions.region.type).toBe('string')
    expect(schema.configOptions.customUrl.type).toBe('string')
  })

  it('uses the configured region for listing without requiring bucket-location permissions', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
      Buckets: [{ Name: 'photos' }],
    } as never)
    const api = createApi('eu-west-3')
    expect(await api.getBucketList()).toMatchObject([{ Name: 'photos', Location: 'eu-west-3' }])
    expect(api.baseOptions.region).toBe('eu-west-3')
    expect(send).toHaveBeenCalledExactlyOnceWith(expect.any(ListBucketsCommand))
  })

  it('uses the custom public domain for listed objects', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
      Contents: [{ Key: 'folder/image.png', LastModified: new Date(0) }],
    } as never)
    const api = createApi('eu-west-3', 'https://images.example.invalid/')
    const result = await api.getBucketFileList({
      bucketName: 'photos',
      bucketConfig: {},
      prefix: '/',
      marker: '',
      itemsPerPage: 50,
    })
    expect(result.fullList[0].url).toBe('https://images.example.invalid/folder/image.png')
    expect(send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command))
  })

  it('signs with the configured fallback region and keeps signatures on the API endpoint', async () => {
    const api = createApi('eu-west-3', 'https://images.example.invalid')
    const signed = await api.getPreSignedUrl({ bucketName: 'photos', key: 'folder/image.png', expires: 60 })
    expect(new URL(signed).hostname).toBe('s3.example.invalid')
    expect(new URL(signed).searchParams.get('X-Amz-Credential')).toContain('/eu-west-3/s3/aws4_request')
  })
})

describe('S3 recursive listing credentials', () => {
  const config = {
    bucketName: 'photos',
    bucketConfig: { Location: 'eu-west-3' },
    prefix: '/folder/',
    cancelToken: 'test-download',
  }

  it('uses temporary credentials on every page for a fresh DogeCloud client', async () => {
    const credentials = {
      accessKeyId: 'temporary-access-key',
      secretAccessKey: 'temporary-secret-key',
      sessionToken: 'temporary-session-token',
    }
    state.getTempToken.mockResolvedValue(credentials)
    const send = vi
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValueOnce({
        $metadata: { httpStatusCode: 200 },
        Contents: [{ Key: 'folder/image.png', LastModified: new Date(0) }],
        IsTruncated: true,
        NextContinuationToken: 'page-2',
      } as never)
      .mockResolvedValueOnce({
        $metadata: { httpStatusCode: 200 },
        Contents: [{ Key: 'folder/child/image.png', LastModified: new Date(0) }],
        IsTruncated: false,
      } as never)
    const api = createApi('', '', true)

    await api.getBucketListRecursively(config)

    expect(state.getTempToken).toHaveBeenCalledExactlyOnceWith('test-key', 'test-secret')
    expect(send).toHaveBeenCalledTimes(2)
    for (const client of send.mock.contexts as S3Client[]) {
      expect(await client.config.credentials()).toMatchObject(credentials)
    }
    expect(send.mock.calls.map(([command]) => (command as ListObjectsV2Command).input)).toEqual([
      { Bucket: 'photos', Prefix: 'folder/', MaxKeys: 1000, ContinuationToken: undefined },
      { Bucket: 'photos', Prefix: 'folder/', MaxKeys: 1000, ContinuationToken: 'page-2' },
    ])
    expect(state.send).toHaveBeenLastCalledWith('refreshDownloadFileTransferList', {
      fullList: [
        expect.objectContaining({ key: 'folder/image.png' }),
        expect.objectContaining({ key: 'folder/child/image.png' }),
      ],
      success: true,
      finished: true,
    })
    expect(state.removeAllListeners).toHaveBeenCalledWith('cancelDownloadLoadingFileList')
  })

  it.each(['empty', 'rejected'])('reports failure without listing when the token response is %s', async response => {
    if (response === 'empty') {
      state.getTempToken.mockResolvedValue({})
    } else {
      state.getTempToken.mockRejectedValue(new Error('Token request failed'))
    }
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
      Contents: [],
    } as never)
    const api = createApi('', '', true)

    await api.getBucketListRecursively(config)

    expect(state.getTempToken).toHaveBeenCalledExactlyOnceWith('test-key', 'test-secret')
    expect(send).not.toHaveBeenCalled()
    expect(api.logger.error).toHaveBeenCalledOnce()
    expect(state.send).toHaveBeenLastCalledWith('refreshDownloadFileTransferList', {
      fullList: [],
      success: false,
      finished: true,
    })
    expect(state.removeAllListeners).toHaveBeenCalledWith('cancelDownloadLoadingFileList')
  })

  it('uses configured credentials without a token exchange for ordinary S3', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
      Contents: [],
    } as never)
    const api = createApi()

    await api.getBucketListRecursively(config)

    expect(state.getTempToken).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledOnce()
    const client = send.mock.contexts[0] as S3Client
    expect(await client.config.credentials()).toMatchObject({ accessKeyId: 'test-key', secretAccessKey: 'test-secret' })
    expect(state.send).toHaveBeenLastCalledWith('refreshDownloadFileTransferList', {
      fullList: [],
      success: true,
      finished: true,
    })
  })
})
