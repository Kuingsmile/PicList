import { ListBucketsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { afterEach, describe, expect, it, vi } from 'vitest'

import S3plistApi from '../src/main/manage/apis/s3plist'
import { getSupportedPicBedList } from '../src/renderer/manage/utils/constants'

vi.mock('electron', () => ({ ipcMain: {} }))
vi.mock('apis/app/window/windowManager', () => ({ default: {} }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: {} }))
vi.mock('~/manage/utils/common', () => ({
  getAgent: () => ({}),
  formatError: vi.fn(),
  ConcurrencyPromisePool: {},
  getFileMimeType: vi.fn(),
  NewDownloader: vi.fn(),
}))
vi.mock('~/manage/utils/dogeAPI', () => ({}))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/utils/common', () => ({
  formatHttpProxy: (value: unknown) => value,
  formatEndpoint: (value: string) => value,
  isImage: () => true,
}))
vi.mock('~/utils/enum', () => ({}))
vi.mock('~/utils/static', () => ({}))

afterEach(() => vi.restoreAllMocks())

function createApi(region = '', customUrl = '') {
  return new S3plistApi(
    'test-key',
    'test-secret',
    'https://s3.example.invalid',
    true,
    true,
    undefined,
    { error: vi.fn() } as never,
    false,
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
