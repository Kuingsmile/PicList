import { beforeEach, describe, expect, it, vi } from 'vitest'

import router from '../src/main/server/routerManager'

const state = vi.hoisted(() => ({
  config: {} as Record<string, any>,
  uploadFiles: vi.fn(),
  uploadClipboard: vi.fn(),
  respond: vi.fn(),
  saveConfig: vi.fn(),
}))
vi.mock('@core/datastore/dirs', () => ({ appLogPath: () => 'mock-log' }))
vi.mock('@core/picgo', () => ({ default: { getConfig: () => state.config, saveConfig: state.saveConfig } }))
vi.mock('@core/picgo/logger', () => ({ default: { info: vi.fn(), error: vi.fn() } }))
vi.mock('apis/app/uploader/apis', () => ({
  uploadChoosedFiles: state.uploadFiles,
  uploadClipboardFiles: state.uploadClipboard,
}))
vi.mock('apis/app/window/windowManager', () => ({ default: { getAvailableWindow: vi.fn() } }))
vi.mock('~/server/apiDoc', () => ({ markdownContent: '' }))
vi.mock('~/server/router', () => import('../src/main/server/router'))
vi.mock('~/utils/uploadResult', () => import('../src/main/utils/uploadResult'))
vi.mock('~/server/utils', () => ({ handleResponse: state.respond, deleteChoosedFiles: vi.fn() }))
vi.mock('~/utils/aesHelper', () => ({
  AESHelper: class {
    encrypt() {
      return 'test-result'
    }
  },
}))

const handle = (list: string[], params = '') =>
  router
    .getHandler('/upload', 'POST')!
    .handler({ response: {} as IHttpResponse, list, urlparams: new URLSearchParams(params) })

beforeEach(() => {
  vi.resetAllMocks()
  state.config = { settings: {}, picBed: { current: 'local', uploader: 'local' } }
  state.uploadFiles.mockResolvedValue([])
  state.uploadClipboard.mockResolvedValue({ url: '', fullResult: {} })
})

describe('HTTP upload configuration', () => {
  it('passes separate options for overlapping requests without saving defaults', async () => {
    await Promise.all([
      handle(['first.png'], 'picbed=github&configName=A'),
      handle(['second.png'], 'picbed=local&configName=B'),
    ])
    expect(state.uploadFiles).toHaveBeenNthCalledWith(1, undefined, [{ path: 'first.png' }], {
      picBed: 'github',
      configName: 'A',
    })
    expect(state.uploadFiles).toHaveBeenNthCalledWith(2, undefined, [{ path: 'second.png' }], {
      picBed: 'local',
      configName: 'B',
    })
    expect(state.saveConfig).not.toHaveBeenCalled()
    expect(state.config.picBed).toEqual({ current: 'local', uploader: 'local' })
  })

  it('passes options for clipboard uploads', async () => {
    await handle([], 'picbed=github&configName=Backup')
    expect(state.uploadClipboard).toHaveBeenCalledWith({ picBed: 'github', configName: 'Backup' })
  })

  it('leaves defaults unchanged when upload fails', async () => {
    state.uploadFiles.mockRejectedValue(new Error('Upload failed'))
    await handle(['first.png'], 'picbed=github&configName=A')
    expect(state.respond).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ success: false }) }),
    )
    expect(state.saveConfig).not.toHaveBeenCalled()
    expect(state.config.picBed.current).toBe('local')
  })
})

describe('HTTP upload results', () => {
  const result = (url: unknown) => ({ url, fullResult: { imgUrl: url } })

  it('rejects incomplete batches', async () => {
    state.uploadFiles.mockResolvedValue([result('https://example.invalid/one.png')])
    await handle(['one.png', 'two.png'])
    expect(state.respond.mock.calls[0][0].body.success).toBe(false)
  })

  it.each([undefined, null, '', ' ', 42])('rejects an invalid URL: %s', async url => {
    state.uploadFiles.mockResolvedValue([result('https://example.invalid/one.png'), result(url)])
    await handle(['one.png', 'two.png'])
    expect(state.respond.mock.calls[0][0].body.success).toBe(false)
  })

  it('rejects sparse output arrays', async () => {
    const results = [result('https://example.invalid/one.png')]
    results.length = 2
    state.uploadFiles.mockResolvedValue(results)
    await handle(['one.png', 'two.png'])
    expect(state.respond.mock.calls[0][0].body.success).toBe(false)
  })

  it('accepts a complete batch and rejects an empty clipboard result', async () => {
    const urls = ['https://example.invalid/one.png', 'https://example.invalid/two.png']
    state.uploadFiles.mockResolvedValue(urls.map(result))
    await handle(['one.png', 'two.png'])
    expect(state.respond.mock.calls[0][0].body).toMatchObject({ success: true, result: urls })
    state.respond.mockClear()
    state.uploadClipboard.mockResolvedValue(result('   '))
    await handle([])
    expect(state.respond.mock.calls[0][0].body.success).toBe(false)
  })
})
