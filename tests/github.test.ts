import type { OptionsOfTextResponseBody } from 'got'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GithubApi from '../src/main/manage/apis/github'

const request = vi.hoisted(() => vi.fn())

vi.mock('got', () => ({ default: request }))
vi.mock('electron', () => ({ app: {}, ipcMain: {} }))
vi.mock('apis/app/window/windowManager', () => ({ default: {} }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: {} }))
vi.mock('~/manage/utils/common', () => import('../src/main/manage/utils/common'))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/utils/common', () => ({ formatHttpProxy: (value: unknown) => value }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/static', () => ({}))
vi.mock('#/utils/url', () => import('../src/universal/utils/url'))

const repoUrl = 'https://api.github.com/repos/test-owner/private-repo'
const config = { bucketName: 'private-repo', githubBranch: 'main', key: '/disposable/' }
const operations = [
  ['GET', '/git/refs/heads/main', { statusCode: 200, body: { object: { sha: 'old-commit' } } }],
  ['GET', '/branches/main', { statusCode: 200, body: { commit: { commit: { tree: { sha: 'root-tree' } } } } }],
  [
    'GET',
    '/git/trees/main:disposable',
    {
      statusCode: 200,
      body: {
        tree: [
          { path: 'first.txt', mode: '100644', type: 'blob', sha: 'first-blob' },
          { path: 'nested', mode: '040000', type: 'tree', sha: 'nested-tree' },
          { path: 'nested/second.txt', mode: '100644', type: 'blob', sha: 'second-blob' },
        ],
      },
    },
  ],
  ['POST', '/git/trees', { statusCode: 201, body: { sha: 'new-tree' } }],
  ['POST', '/git/commits', { statusCode: 201, body: { sha: 'new-commit' } }],
  ['PATCH', '/git/refs/heads/main', { statusCode: 200, body: {} }],
] as const

beforeEach(() => {
  request.mockReset()
  request.mockImplementation(async (url: string, options: OptionsOfTextResponseBody) => {
    // Private repositories reject requests that omit the configured token.
    if (options.headers?.Authorization !== 'Bearer test-token') return { statusCode: 404, body: {} }

    const operation = operations.find(([method, path]) => options.method === method && url === `${repoUrl}${path}`)
    if (!operation) throw new Error(`Unexpected GitHub request: ${options.method} ${url}`)
    return operation[2]
  })
})

describe('GitHub manager folder deletion', () => {
  it.each(['test-token', 'Bearer test-token'])('authenticates every required request with token %s', async token => {
    const api = new GithubApi(token, 'test-owner', undefined, { error: vi.fn() } as never)

    await expect(api.deleteBucketFolder(config)).resolves.toBe(true)

    expect(request.mock.calls).toEqual(
      operations.map(([method, path]) => [
        `${repoUrl}${path}`,
        expect.objectContaining({
          method,
          headers: { Authorization: 'Bearer test-token', Accept: 'application/vnd.github+json' },
        }),
      ]),
    )
    expect(request.mock.calls[2][1].searchParams).toEqual({ recursive: true })
    expect(JSON.parse(request.mock.calls[3][1].body)).toEqual({
      base_tree: 'root-tree',
      tree: [
        { path: 'disposable/first.txt', mode: '100644', type: 'blob', sha: null },
        { path: 'disposable/nested/second.txt', mode: '100644', type: 'blob', sha: null },
      ],
    })
    expect(JSON.parse(request.mock.calls[4][1].body)).toEqual({
      message: 'deleted by PicList',
      tree: 'new-tree',
      parents: ['old-commit'],
    })
    expect(JSON.parse(request.mock.calls[5][1].body)).toEqual({ sha: 'new-commit' })
  })

  it('stops before creating a tree or commit when the authenticated branch lookup fails', async () => {
    const api = new GithubApi('test-token', 'test-owner', undefined, { error: vi.fn() } as never)
    request.mockResolvedValueOnce(operations[0][2]).mockResolvedValueOnce({ statusCode: 404, body: {} })

    await expect(api.deleteBucketFolder(config)).resolves.toBe(false)

    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenLastCalledWith(
      `${repoUrl}/branches/main`,
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer test-token', Accept: 'application/vnd.github+json' },
      }),
    )
  })
})
