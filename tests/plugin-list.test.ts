import { beforeEach, describe, expect, it, vi } from 'vitest'

import { pluginGetListFunc, pluginImportLocalFunc } from '../src/main/events/rpc/routes/plugin/utils'

const state = vi.hoisted(() => ({
  getFullList: vi.fn(),
  getPlugin: vi.fn(),
  getConfig: vi.fn(),
  getUploader: vi.fn(),
  getTransformer: vi.fn(),
  existsSync: vi.fn(),
  readJSONSync: vi.fn(),
  install: vi.fn(),
  showOpenDialog: vi.fn(),
  notify: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@core/datastore/dirs', () => ({ dataDir: () => '/plugin-list-fixture' }))
vi.mock('@core/picgo', () => ({
  default: {
    pluginLoader: { getFullList: state.getFullList, getPlugin: state.getPlugin },
    pluginHandler: { install: state.install },
    getConfig: state.getConfig,
    helper: { uploader: { get: state.getUploader }, transformer: { get: state.getTransformer } },
    log: { warn: state.warn, error: state.error },
  },
}))
vi.mock('fs-extra', () => ({ default: { existsSync: state.existsSync, readJSONSync: state.readJSONSync } }))
vi.mock('apis/app/shortKey/shortKeyHandler', () => ({ default: {} }))
vi.mock('apis/app/window/windowManager', () => ({ default: { get: () => ({}) } }))
vi.mock('electron', () => ({ dialog: { showOpenDialog: state.showOpenDialog }, shell: {} }))
vi.mock('~/i18n', () => ({ t: (key: string) => key }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/common', () => ({
  handleStreamlinePluginName: (name: string) => name.replace('picgo-plugin-', ''),
  simpleClone: (value: unknown) => JSON.parse(JSON.stringify(value)),
  showNotification: state.notify,
}))

const manifest = { version: '1.0.0', description: 'Fixture plugin', author: { name: 'Fixture Author' } }

beforeEach(() => {
  vi.resetAllMocks()
  state.getFullList.mockReturnValue(['picgo-plugin-first', 'picgo-plugin-last'])
  state.getPlugin.mockResolvedValue({})
  state.getConfig.mockReturnValue(true)
  state.existsSync.mockReturnValue(true)
  state.readJSONSync.mockReturnValue(manifest)
  state.install.mockResolvedValue({ success: true, body: ['picgo-plugin-first'] })
  state.showOpenDialog.mockResolvedValue({ filePaths: ['/plugin-list-fixture/source'] })
})

describe.each([
  ['refresh', pluginGetListFunc],
  ['local import', pluginImportLocalFunc],
] as const)('plugin list after %s', (_name, handler) => {
  const getList = async () => {
    const send = vi.fn()
    await handler({ sender: { send } } as unknown as IIPCEvent)
    expect(send.mock.calls.filter(([channel]) => channel === 'pluginList')).toHaveLength(1)
    expect(state.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'main.notification.getPluginListFailed' }),
    )
    return send.mock.calls.find(([channel]) => channel === 'pluginList')![1] as IPicGoPlugin[]
  }

  it.each([
    ['missing', {}, 'unknown'],
    ['null', { author: null }, 'unknown'],
    ['string', { author: 'String Author <fixture@example.invalid>' }, 'String Author <fixture@example.invalid>'],
    ['object', { author: { name: 'Object Author', email: 'fixture@example.invalid' } }, 'Object Author'],
    ['empty string', { author: '' }, 'unknown'],
    ['blank string', { author: '  ' }, 'unknown'],
    ['empty object', { author: {} }, 'unknown'],
    ['null name', { author: { name: null } }, 'unknown'],
    ['non-string name', { author: { name: 42 } }, 'unknown'],
    ['blank name', { author: { name: '  ' } }, 'unknown'],
    ['number', { author: 42 }, 'unknown'],
    ['boolean', { author: false }, 'unknown'],
    ['array', { author: ['Invalid Author'] }, 'unknown'],
  ])('normalizes a %s author without hiding either plugin', async (_kind, metadata, author) => {
    state.readJSONSync.mockReturnValueOnce({ version: '1.0.0', ...metadata })

    const list = await getList()

    expect(list.map(plugin => [plugin.fullName, plugin.author])).toEqual([
      ['picgo-plugin-first', author],
      ['picgo-plugin-last', 'Fixture Author'],
    ])
    expect(state.warn).not.toHaveBeenCalled()
  })

  it('preserves plugin actions and evaluates configuration defaults and choices', async () => {
    state.readJSONSync.mockReturnValueOnce({ ...manifest, keywords: ['picgo-gui-plugin'] })
    state.getPlugin.mockResolvedValueOnce({
      uploader: 'fixture-uploader',
      config: () => [{ name: 'option', default: () => 'value', choices: () => ['value'] }],
      guiMenu: () => [{ label: 'Fixture action', handle: () => undefined }],
    })
    state.getUploader.mockReturnValue({ config: () => [{ name: 'upload', default: () => 'upload-value' }] })
    state.getConfig.mockReturnValueOnce(false)

    const list = await getList()

    expect(list[0]).toMatchObject({
      name: 'first',
      fullName: 'picgo-plugin-first',
      author: 'Fixture Author',
      description: 'Fixture plugin',
      version: '1.0.0',
      gui: true,
      enabled: false,
      guiMenu: [{ label: 'Fixture action' }],
      config: {
        plugin: { config: [{ name: 'option', default: 'value', choices: ['value'] }] },
        uploader: { name: 'fixture-uploader', config: [{ name: 'upload', default: 'upload-value' }] },
      },
    })
    expect(list).toHaveLength(2)
  })

  it.each([
    'invalid JSON',
    'null manifest',
    'loader rejection',
    'missing plugin',
    'menu callback',
    'config callback',
    'serialization',
  ])('isolates %s errors between healthy plugins', async failure => {
    state.getFullList.mockReturnValue(['picgo-plugin-first', 'picgo-plugin-broken', 'picgo-plugin-last'])
    const fail = () => {
      throw new Error('Fixture failure')
    }
    if (failure === 'invalid JSON') {
      state.readJSONSync.mockReturnValueOnce(manifest).mockImplementationOnce(() => JSON.parse('{'))
    } else if (failure === 'null manifest') {
      state.readJSONSync.mockReturnValueOnce(manifest).mockReturnValueOnce(null)
    } else {
      state.getPlugin.mockResolvedValueOnce({})
      if (failure === 'loader rejection') state.getPlugin.mockRejectedValueOnce(new Error('Fixture failure'))
      if (failure === 'missing plugin') state.getPlugin.mockResolvedValueOnce(undefined)
      if (failure === 'menu callback') state.getPlugin.mockResolvedValueOnce({ guiMenu: fail })
      if (failure === 'config callback') state.getPlugin.mockResolvedValueOnce({ config: fail })
      if (failure === 'serialization') {
        const circular: Record<string, unknown> = {}
        circular.self = circular
        state.getPlugin.mockResolvedValueOnce({ config: () => [{ name: 'circular', default: circular }] })
      }
    }

    const list = await getList()

    expect(list.map(plugin => plugin.fullName)).toEqual(['picgo-plugin-first', 'picgo-plugin-last'])
    expect(state.warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('picgo-plugin-broken'))
    expect(state.error).not.toHaveBeenCalled()
  })

  it('continues past a missing package.json', async () => {
    state.existsSync.mockReturnValueOnce(false)

    expect((await getList()).map(plugin => plugin.fullName)).toEqual(['picgo-plugin-last'])
    expect(state.warn).not.toHaveBeenCalled()
  })
})
