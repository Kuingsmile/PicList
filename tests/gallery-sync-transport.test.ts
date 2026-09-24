import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BUNDLE_NAME, createGalleryTransport } from '../src/main/utils/gallerySync/transport'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  request: vi.fn(),
  contents: vi.fn(),
  blob: vi.fn(),
  update: vi.fn(),
  davGet: vi.fn(),
  davPut: vi.fn(),
  mkdir: vi.fn(),
}))
vi.mock('axios', () => ({ default: { get: mocks.get, request: mocks.request } }))
vi.mock('@octokit/rest', () => ({
  Octokit: class {
    rest = {
      repos: { getContent: mocks.contents, createOrUpdateFileContents: mocks.update },
      git: { getBlob: mocks.blob },
    }
  },
}))
vi.mock('webdav', () => ({
  AuthType: { Digest: 'digest' },
  createClient: () => ({
    getFileContents: mocks.davGet,
    putFileContents: mocks.davPut,
    createDirectory: mocks.mkdir,
  }),
}))

const config = (type: string): ISyncConfig => ({
  type,
  username: 'owner',
  repo: 'repo',
  branch: 'selected-branch',
  token: 'test-secret',
  endpoint: 'https://example.invalid',
  webdavEndpoint: 'https://example.invalid',
  webdavUsername: 'owner',
  webdavPassword: 'test-secret',
  webdavSavePath: '/gallery',
})
const bytes = Buffer.from('example')
beforeEach(() => vi.resetAllMocks())

describe('conditional gallery transports', () => {
  it('checks the WebDAV boolean and sends conditional headers for create and update', async () => {
    const transport = createGalleryTransport(config('webdav'))
    mocks.davPut.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    expect(await transport.commit(bytes, null)).toBe(false)
    expect(mocks.davPut.mock.calls[0]).toEqual([
      '/gallery/' + BUNDLE_NAME,
      bytes,
      { overwrite: false, headers: { 'If-None-Match': '*' } },
    ])
    expect(await transport.commit(bytes, '"previous"')).toBe(true)
    expect(mocks.davPut.mock.calls[1][2]).toEqual({ overwrite: true, headers: { 'If-Match': '"previous"' } })
  })

  it.each([undefined, 'W/"weak"', ''])('rejects an unsafe WebDAV ETag (%s)', async etag => {
    mocks.davGet.mockResolvedValue({ data: bytes, headers: { etag }, status: 200 })
    await expect(createGalleryTransport(config('webdav')).read(BUNDLE_NAME)).rejects.toThrow('strong ETags')
  })

  it('reads WebDAV bytes and their strong ETag from the same response', async () => {
    mocks.davGet.mockResolvedValue({ data: bytes, headers: { etag: '"version-2"' }, status: 200 })
    expect(await createGalleryTransport(config('webdav')).read(BUNDLE_NAME)).toEqual({
      content: bytes,
      version: '"version-2"',
    })
    expect(mocks.davGet).toHaveBeenCalledWith('/gallery/' + BUNDLE_NAME, { format: 'binary', details: true })
  })

  it('uses GitHub content SHAs and the selected branch without retrying a failed update as a create', async () => {
    const transport = createGalleryTransport(config('github'))
    mocks.contents.mockResolvedValue({
      status: 200,
      data: { type: 'file', sha: 'previous', encoding: 'base64', content: bytes.toString('base64') },
    })
    expect(await transport.read(BUNDLE_NAME)).toEqual({ content: bytes, version: 'previous' })
    expect(mocks.contents.mock.calls[0][0].ref).toBe('selected-branch')
    mocks.update
      .mockResolvedValueOnce({ status: 200 })
      .mockRejectedValueOnce({ status: 409, request: { token: 'test-secret' } })
    expect(await transport.commit(bytes, 'previous')).toBe(true)
    expect(mocks.update.mock.calls[0][0]).toMatchObject({
      sha: 'previous',
      branch: 'selected-branch',
      path: BUNDLE_NAME,
    })
    await expect(transport.commit(bytes, 'previous')).rejects.toThrow('Gallery transport failed')
    expect(mocks.update).toHaveBeenCalledTimes(2)
  })

  it('downloads large GitHub content by its captured immutable blob SHA', async () => {
    mocks.contents.mockResolvedValue({
      status: 200,
      data: { type: 'file', sha: 'captured-sha', encoding: 'none', content: '' },
    })
    mocks.blob.mockResolvedValue({ status: 200, data: { encoding: 'base64', content: bytes.toString('base64') } })
    const transport = createGalleryTransport(config('github'))
    expect((await transport.read(BUNDLE_NAME))?.content).toEqual(bytes)
    expect(mocks.blob).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo', file_sha: 'captured-sha' })
  })

  it.each(['gitee', 'gitea'])('uses the reviewed SHA and branch for %s', async type => {
    const transport = createGalleryTransport(config(type))
    mocks.get.mockResolvedValue({
      status: 200,
      data: { sha: 'reviewed', encoding: 'base64', content: bytes.toString('base64') },
    })
    expect(await transport.read(BUNDLE_NAME)).toEqual({ content: bytes, version: 'reviewed' })
    expect(mocks.get.mock.calls[0][1].params.ref).toBe('selected-branch')
    mocks.request
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 201 })
    expect(await transport.commit(bytes, 'reviewed')).toBe(true)
    expect(mocks.request.mock.calls[0][0]).toMatchObject({
      method: 'put',
      data: { sha: 'reviewed', branch: 'selected-branch' },
    })
    expect(await transport.commit(bytes, 'reviewed')).toBe(false)
    expect(await transport.commit(bytes, null)).toBe(true)
    expect(mocks.request.mock.calls[2][0].method).toBe('post')
    expect(mocks.request.mock.calls[2][0].data).not.toHaveProperty('sha')
  })

  it.each(['github', 'gitee', 'gitea', 'webdav'])(
    'distinguishes missing data from authentication/network errors for %s',
    async type => {
      const mock = type === 'github' ? mocks.contents : type === 'webdav' ? mocks.davGet : mocks.get
      const transport = createGalleryTransport(config(type))
      mock
        .mockRejectedValueOnce({ status: 404 })
        .mockRejectedValueOnce({ response: { status: 401 }, message: 'test-secret' })
      expect(await transport.read(BUNDLE_NAME)).toBeNull()
      await expect(transport.read(BUNDLE_NAME)).rejects.toThrow('Gallery transport failed')
    },
  )

  it.each(['github', 'gitee', 'gitea', 'webdav'])('rejects unsuccessful download responses for %s', async type => {
    const mock = type === 'github' ? mocks.contents : type === 'webdav' ? mocks.davGet : mocks.get
    mock.mockResolvedValue({
      status: 503,
      data: { content: bytes.toString('base64'), encoding: 'base64', sha: 'invalid' },
    })
    await expect(createGalleryTransport(config(type)).read(BUNDLE_NAME)).rejects.toThrow('Gallery transport failed')
  })
})
