import { beforeEach, describe, expect, it, vi } from 'vitest'

import SmmsApi from '../src/main/manage/apis/smms'

const state = vi.hoisted(() => ({
  request: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  removeAllListeners: vi.fn(),
}))

vi.mock('axios', () => ({ default: { create: () => state.request } }))
vi.mock('apis/app/window/windowManager', () => ({
  default: { get: () => ({ webContents: { send: state.send } }) },
}))
vi.mock('electron', () => ({ ipcMain: { on: state.on, removeAllListeners: state.removeAllListeners } }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: {} }))
vi.mock('~/manage/utils/common', () => ({}))
vi.mock('~/manage/utils/logger', () => ({}))
vi.mock('~/utils/common', () => ({ isImage: () => true }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))

const api = new SmmsApi('test-token', { error: vi.fn() } as never)
const config = { cancelToken: 'test-list' }

const files = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    file_id: index + 1,
    filename: `image-${index}.png`,
    storename: `image-${index}.png`,
    path: `/uploads/image-${index}.png`,
    hash: `hash-${index}`,
    url: `https://cdn.example.test/uploads/image-${index}.png`,
    delete: `https://api.example.test/file/delete/hash-${index}`,
    page: `https://example.test/image-${index}`,
    width: 100,
    height: 100,
    size: 1024,
    upload_status: 2,
    created_at: 1770908298 - index,
  }))

// S.EE's documented history response has 30 files per page and no page counters.
const history = (data: ReturnType<typeof files>, metadata: Record<string, unknown> = {}) => ({
  status: 200,
  data: { success: true, code: 0, message: 'success', data, ...metadata },
})

function mockPages(pages: ReturnType<typeof history>[]) {
  state.request.mockImplementation(async (_url: string, { params }: { params: { page: number } }) => {
    const response = pages[params.page - 1]
    if (!response) throw new Error(`Unexpected page: ${params.page}`)
    return response
  })
}

function expectFinished(expectedFiles: ReturnType<typeof files>, success = true) {
  expect(state.send).toHaveBeenLastCalledWith('refreshFileTransferList', {
    fullList: expectedFiles.map(file =>
      expect.objectContaining({
        key: file.path,
        fileName: file.filename,
        sha: file.hash,
        downloadUrl: file.url,
      }),
    ),
    success,
    finished: true,
  })
  expect(state.removeAllListeners).toHaveBeenCalledWith('cancelLoadingFileList')
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('S.EE full manager listing', () => {
  it.each([0, 1, 29, 30, 31, 60, 61])('lists all %i files without page counters', async count => {
    const uploadedFiles = files(count)
    const pages = Array.from({ length: Math.floor(count / 30) + 1 }, (_, index) =>
      history(uploadedFiles.slice(index * 30, (index + 1) * 30)),
    )
    mockPages(pages)

    await api.getBucketListBackstage(config)

    expect(state.request.mock.calls).toEqual(
      pages.map((_, index) => ['/files', { method: 'GET', params: { page: index + 1 } }]),
    )
    expectFinished(uploadedFiles)
  })

  it.each([false, true])('honors legacy counters, including numeric strings: %s', async stringify => {
    const uploadedFiles = files(31)
    const counter = (value: number) => (stringify ? String(value) : value)
    mockPages([
      history(uploadedFiles.slice(0, 1), { CurrentPage: counter(1), TotalPages: counter(2) }),
      history(uploadedFiles.slice(1), { CurrentPage: counter(2), TotalPages: counter(2) }),
    ])

    await api.getBucketListBackstage(config)

    expect(state.request).toHaveBeenCalledTimes(2)
    expectFinished(uploadedFiles)
  })

  it('stops on an empty page even when legacy counters claim more pages', async () => {
    mockPages([history([], { CurrentPage: 1, TotalPages: 2 })])

    await api.getBucketListBackstage(config)

    expect(state.request).toHaveBeenCalledTimes(1)
    expectFinished([])
  })

  it('reports failure if a later page is unsuccessful', async () => {
    const uploadedFiles = files(30)
    mockPages([history(uploadedFiles), history([], { success: false })])

    await api.getBucketListBackstage(config)

    expect(state.request).toHaveBeenCalledTimes(2)
    expectFinished(uploadedFiles, false)
  })

  it('stops requesting pages when the listing is cancelled', async () => {
    const uploadedFiles = files(30)
    mockPages([history(uploadedFiles)])
    state.send.mockImplementationOnce(() => {
      const [, cancel] = state.on.mock.calls[0]
      cancel({}, config.cancelToken)
    })

    await api.getBucketListBackstage(config)

    expect(state.request).toHaveBeenCalledTimes(1)
    expectFinished(uploadedFiles, false)
  })
})

describe('S.EE paginated manager listing', () => {
  it('reaches older uploads by advancing numeric markers without page counters', async () => {
    const uploadedFiles = files(61)
    mockPages([
      history(uploadedFiles.slice(0, 30)),
      history(uploadedFiles.slice(30, 60)),
      history(uploadedFiles.slice(60)),
    ])
    let currentPage = 1
    const listedFiles = []

    for (const expectedPage of [1, 2, 3]) {
      const result = await api.getBucketFileList({ currentPage })
      expect(result).toMatchObject({
        success: true,
        isTruncated: expectedPage < 3,
        nextMarker: expectedPage + 1,
      })
      listedFiles.push(...result.fullList)
      currentPage = result.nextMarker
    }

    expect(listedFiles.map(file => file.key)).toEqual(uploadedFiles.map(file => file.path))
    expect(state.request.mock.calls).toEqual([1, 2, 3].map(page => ['/files', { method: 'GET', params: { page } }]))
  })

  it('ends an exact full page on the following empty page', async () => {
    mockPages([history(files(30)), history([])])

    const first = await api.getBucketFileList({ currentPage: 1 })
    expect(first).toMatchObject({ success: true, isTruncated: true, nextMarker: 2 })
    expect(await api.getBucketFileList({ currentPage: first.nextMarker })).toEqual({
      fullList: [],
      success: true,
      isTruncated: false,
      nextMarker: '',
    })
  })

  it.each([
    [undefined, 1],
    ['2', 2],
    [0, 1],
    ['invalid', 1],
  ])('normalizes requested page %s to %i', async (currentPage, page) => {
    state.request.mockResolvedValue(history(files(30)))

    const result = await api.getBucketFileList({ currentPage })

    expect(state.request).toHaveBeenCalledWith('/files', { method: 'GET', params: { page } })
    expect(result).toMatchObject({ success: true, isTruncated: true, nextMarker: page + 1 })
  })

  it.each([
    { CurrentPage: 2, TotalPages: 10, count: 1, isTruncated: true },
    { CurrentPage: '2', TotalPages: '10', count: 1, isTruncated: true },
    { CurrentPage: 10, TotalPages: 10, count: 30, isTruncated: false },
    { CurrentPage: '10', TotalPages: '10', count: 30, isTruncated: false },
  ])('honors legacy counters for page $CurrentPage of $TotalPages', async metadata => {
    const { CurrentPage, TotalPages, count, isTruncated } = metadata
    state.request.mockResolvedValue(history(files(count), { CurrentPage, TotalPages }))

    const result = await api.getBucketFileList({ currentPage: Number(CurrentPage) })

    expect(result).toMatchObject({ success: true, isTruncated, nextMarker: Number(CurrentPage) + 1 })
  })

  it.each([{ CurrentPage: 1 }, { TotalPages: 3 }, { CurrentPage: 'invalid', TotalPages: 3 }])(
    'falls back to page length for incomplete or invalid counters: %j',
    async metadata => {
      state.request.mockResolvedValue(history(files(30), metadata))

      expect(await api.getBucketFileList({ currentPage: 2 })).toMatchObject({
        success: true,
        isTruncated: true,
        nextMarker: 3,
      })
    },
  )
})
