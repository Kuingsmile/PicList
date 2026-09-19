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
