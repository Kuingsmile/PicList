import { beforeEach, describe, expect, it, vi } from 'vitest'

import uploader from '../src/main/apis/app/uploader'
import { uploadChoosedFiles, uploadClipboardFiles } from '../src/main/apis/app/uploader/apis'

const state = vi.hoisted(() => ({
  config: {} as Record<string, any>,
  upload: vi.fn(),
  clipboardPath: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('@core/picgo', () => ({
  default: {
    baseDir: '/mock-app',
    log: { info: vi.fn(), error: vi.fn() },
    on: vi.fn(),
    helper: { beforeUploadPlugins: { register: vi.fn() } },
    uploadReturnCtx: state.upload,
    getConfig: (key?: string) => (key ? key.split('.').reduce((obj, part) => obj?.[part], state.config) : state.config),
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { error: vi.fn(), info: vi.fn() } }))
vi.mock('@core/datastore', () => ({ GalleryDB: { getInstance: () => ({ insert: state.insert }) } }))
vi.mock('apis/app/uploader', () => import('../src/main/apis/app/uploader'))
vi.mock('apis/app/window/windowManager', () => ({ default: { getAvailableWindow: vi.fn(), get: vi.fn() } }))
vi.mock('electron', () => ({
  ipcMain: { removeAllListeners: vi.fn() },
  Notification: class {
    show() {}
  },
}))
vi.mock('fs-extra', () => ({ default: { remove: state.remove } }))
vi.mock('~/events/constant', () => ({ GET_RENAME_FILE_NAME: 'getRename', RENAME_FILE_NAME: 'rename' }))
vi.mock('~/i18n', () => ({ t: (key: string) => key }))
vi.mock('~/utils/common', () => ({
  getClipboardFilePath: state.clipboardPath,
  getUploaderType: vi.fn(),
  showNotification: vi.fn(),
  handleCopyUrl: vi.fn(),
  handleUrlEncodeWithSetting: (url: string) => url,
}))
vi.mock('~/utils/configPaths', () => import('../src/main/utils/configPaths'))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/static', () => ({ CLIPBOARD_IMAGE_FOLDER: 'clipboard' }))
vi.mock('~/utils/pasteTemplate', () => ({ default: async () => ['link', ''] }))
vi.mock('~/utils/runScript', () => ({ runScriptInStage: vi.fn() }))
vi.mock('~/utils/uploadResult', () => import('../src/main/utils/uploadResult'))

beforeEach(() => {
  vi.clearAllMocks()
  state.config = { settings: { uploadResultNotification: false } }
  state.upload.mockResolvedValue({})
  state.clipboardPath.mockReturnValue('/chosen.png')
  state.insert.mockImplementation(async item => ({ ...item, id: 'saved' }))
  state.remove.mockResolvedValue(undefined)
})

describe('per-upload configuration options', () => {
  const options = { picBed: 'local', configName: 'Other' }

  it('forwards file options through the desktop wrapper', async () => {
    await uploadChoosedFiles(undefined, [{ path: '/chosen.png' }], options)
    expect(state.upload).toHaveBeenCalledWith(['/chosen.png'], options)
  })

  it.each([true, false])('forwards clipboard options with builtin clipboard=%s', async builtin => {
    state.config.settings.useBuiltinClipboard = builtin
    await uploadClipboardFiles(options)
    expect(state.upload).toHaveBeenCalledWith(builtin ? ['/chosen.png'] : undefined, options)
  })

  it('keeps default options for existing callers', async () => {
    await uploader.uploadReturnCtx(['/chosen.png'])
    expect(state.upload).toHaveBeenCalledWith(['/chosen.png'], undefined)
  })
})

describe('upload configuration metadata', () => {
  const context = (id: string) => ({
    output: [{ type: 'local', imgUrl: 'https://example.invalid/image.png' }],
    getConfig: vi.fn(() => ({ local: { _id: id, nested: { path: 'original' } } })),
  })

  it('uses separate primary and backup snapshots even for the same uploader type', async () => {
    state.config.picBed = { local: { _id: 'unrelated-global-config' } }
    const ctx = context('primary')
    const backupCtx = context('backup')
    state.upload.mockResolvedValue({ ctx, backupCtx })
    const result = await uploader.uploadReturnCtx(['/chosen.png'])
    expect(result.ctx!.output[0].config._id).toBe('primary')
    expect(result.backupCtx!.output[0].config._id).toBe('backup')
    expect(ctx.getConfig).toHaveBeenCalledWith('picBed')
    expect(backupCtx.getConfig).toHaveBeenCalledWith('picBed')
  })

  it('copies metadata so gallery mutations cannot change the upload snapshot', async () => {
    const ctx = context('primary')
    state.upload.mockResolvedValue({ ctx })
    const result = await uploader.uploadReturnCtx(['/chosen.png'])
    result.ctx!.output[0].config.nested.path = 'changed'
    expect(ctx.getConfig.mock.results[0].value.local.nested.path).toBe('original')
  })

  it('handles uploaders without configuration instead of discarding their result', async () => {
    state.upload.mockResolvedValue({
      ctx: { output: [{ type: 'custom', imgUrl: 'https://example.invalid/image.png' }], getConfig: () => undefined },
    })
    const result = await uploader.uploadReturnCtx(['/chosen.png'])
    expect(result.ctx!.output[0].config).toEqual({})
  })
})

describe('upload result validation', () => {
  it.each([undefined, null, '', '   ', 42])('does not save or delete a file for an invalid URL: %s', async imgUrl => {
    state.config.settings.deleteLocalFile = true
    state.upload.mockResolvedValue({ ctx: { output: [{ imgUrl }] } })
    expect(await uploadChoosedFiles(undefined, [{ path: '/failed.png' }])).toEqual([])
    expect(state.insert).not.toHaveBeenCalled()
    expect(state.remove).not.toHaveBeenCalled()
  })

  it('keeps only successful outputs, including their original input indexes', async () => {
    state.upload.mockResolvedValue({
      ctx: {
        output: [undefined, { imgUrl: '' }, { imgUrl: 'https://example.invalid/good.png', inputIndex: 2 }],
        getConfig: () => ({}),
      },
    })
    const result = await uploader.uploadReturnCtx(['missing.png', 'failed.png', 'good.png'])
    expect(result.ctx!.output).toHaveLength(1)
    expect(result.ctx!.output[0].inputIndex).toBe(2)
  })

  it('retains a successful primary upload when the backup has no valid URL', async () => {
    state.upload.mockResolvedValue({
      ctx: { output: [{ imgUrl: 'https://example.invalid/good.png' }], getConfig: () => ({}) },
      backupCtx: { output: [{ imgUrl: ' ' }] },
    })
    const result = await uploader.uploadReturnCtx(['good.png'])
    expect(result.ctx).toBeDefined()
    expect(result.backupCtx).toBeUndefined()
  })
})

describe('original file deletion', () => {
  const url = 'https://example.invalid/upload.png'
  const inputs = ['/first.png', '/second.png', '/third.png']

  const upload = async (output: object[], paths = inputs) => {
    state.config.settings.deleteLocalFile = true
    state.upload.mockResolvedValue({ ctx: { output, getConfig: () => ({}) } })
    await uploadChoosedFiles(
      undefined,
      paths.map(path => ({ path })),
    )
  }

  it('deletes only the successful source in a partial batch', async () => {
    await upload([{ imgUrl: '' }, { imgUrl: url, inputIndex: 2 }])
    expect(state.remove.mock.calls).toEqual([['/third.png']])
  })

  it('uses original indexes after outputs are reordered', async () => {
    await upload([2, 0, 1].map(inputIndex => ({ imgUrl: url, inputIndex })))
    expect(state.remove.mock.calls).toEqual([['/third.png'], ['/first.png'], ['/second.png']])
  })

  it.each([-1, 3, 0.5, null, '1'])('does not fall back to position for an invalid index: %s', async inputIndex => {
    await upload(inputs.map(() => ({ imgUrl: url, inputIndex })))
    expect(state.remove).not.toHaveBeenCalled()
  })

  it('keeps ambiguous partial results from legacy plugins', async () => {
    await upload([{ imgUrl: url }])
    expect(state.remove).not.toHaveBeenCalled()
  })

  it('supports legacy plugins that identify the original file path', async () => {
    await upload([{ imgUrl: url, filePath: '/second.png' }])
    expect(state.remove.mock.calls).toEqual([['/second.png']])
  })

  it('supports complete legacy batches without source metadata', async () => {
    await upload(inputs.map(() => ({ imgUrl: url })))
    expect(state.remove.mock.calls).toEqual(inputs.map(path => [path]))
  })

  it('does not try to delete URL inputs', async () => {
    await upload([{ imgUrl: url, inputIndex: 0 }], ['HTTPS://example.invalid/source.png'])
    expect(state.remove).not.toHaveBeenCalled()
  })
})
