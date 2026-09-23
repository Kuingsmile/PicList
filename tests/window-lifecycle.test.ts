import { EventEmitter } from 'node:events'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { configPaths } from '../src/main/utils/configPaths'
import { ISartMode, IWindowList } from '../src/main/utils/enum'

const state = vi.hoisted(() => ({
  config: { settings: {} } as { settings: Record<string, any> },
  nextId: 1,
  ready: undefined as (() => Promise<void>) | undefined,
  saveConfig: vi.fn(),
}))

class FakeWindow extends EventEmitter {
  #id = state.nextId++
  destroyed = false
  visible = false
  minimized = false
  focused = false
  alwaysOnTop = false
  position: [number, number] = [0, 0]
  webContents = new EventEmitter()
  loadFile = vi.fn()
  loadURL = vi.fn()

  #assertAlive() {
    if (this.destroyed) throw new Error('Object has been destroyed')
  }

  get id() {
    this.#assertAlive()
    return this.#id
  }

  isDestroyed() {
    return this.destroyed
  }

  isVisible() {
    this.#assertAlive()
    return this.visible
  }

  isMinimized() {
    this.#assertAlive()
    return this.minimized
  }

  restore() {
    this.#assertAlive()
    this.minimized = false
  }

  show() {
    this.#assertAlive()
    this.visible = true
  }

  focus() {
    this.#assertAlive()
    this.focused = true
  }

  setAlwaysOnTop(value: boolean) {
    this.#assertAlive()
    this.alwaysOnTop = value
  }

  getSize() {
    this.#assertAlive()
    return [64, 64]
  }

  getPosition() {
    this.#assertAlive()
    return [...this.position]
  }

  setPosition(x: number, y: number) {
    this.#assertAlive()
    this.position = [x, y]
    this.emit('move')
  }

  close() {
    this.#assertAlive()
    const event = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }
    this.emit('close', event)
    if (!event.defaultPrevented) this.destroy()
  }

  destroy() {
    this.destroyed = true
    this.emit('closed')
  }
}

vi.mock('electron', () => ({
  BrowserWindow: FakeWindow,
  app: {
    isPackaged: true,
    requestSingleInstanceLock: () => true,
    getLocale: () => 'en',
    whenReady: () => ({
      then: (callback: () => Promise<void>) => {
        state.ready = callback
      },
    }),
    on: vi.fn(),
    setAppUserModelId: vi.fn(),
  },
  screen: { getPrimaryDisplay: () => ({ workAreaSize: { width: 1920, height: 1080 } }) },
  protocol: { registerSchemesAsPrivileged: vi.fn(), handle: vi.fn() },
}))
vi.mock('@core/picgo', () => ({
  default: {
    baseDir: '/test',
    getConfig: (key?: string) =>
      key ? key.split('.').reduce((value, part) => value?.[part], state.config as any) : state.config,
    saveConfig: state.saveConfig,
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('@core/bus', () => ({ default: { emit: vi.fn() } }))
vi.mock('@core/bus/constants', () => import('../src/main/apis/core/bus/constants'))
vi.mock('@core/datastore/dirs', () => ({ themesDir: () => '/test/themes' }))
vi.mock('~/utils/configPaths', () => import('../src/main/utils/configPaths'))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/events/constant', () => import('../src/main/events/constant'))
vi.mock('~/utils/rendererSecurity', () => ({ protectRendererNavigation: vi.fn() }))
vi.mock('~/lifeCycle/errorHandler', () => ({}))
vi.mock('~/lifeCycle/autoUpdater', () => ({ setupAutoUpdater: vi.fn() }))
vi.mock('~/lifeCycle/fixPath', () => ({ default: vi.fn() }))
vi.mock('~/utils/beforeOpen', () => ({ default: vi.fn() }))
vi.mock('~/manage/Main', () => ({ default: vi.fn() }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: { getInstance: vi.fn() } }))
vi.mock('~/manage/utils/common', () => ({ clearTempFolder: vi.fn() }))
vi.mock('~/utils/handleI18n', () => ({ initI18n: vi.fn() }))
vi.mock('~/i18n', () => ({ initializeI18n: vi.fn() }))
vi.mock('~/events/rpc', () => ({ rpcServer: { start: vi.fn() } }))
vi.mock('~/events/busEventList', () => ({ default: { listen: vi.fn() } }))
vi.mock('~/utils/clipboardPoll', () => ({ default: {} }))
vi.mock('~/utils/autoStart', () => ({ isAutoStartEnabled: vi.fn().mockResolvedValue(false), setAutoStart: vi.fn() }))
vi.mock('~/utils/updateChecker', () => ({ default: vi.fn() }))
vi.mock('~/utils/handleArgv', () => ({ getUploadFiles: () => [] }))
vi.mock('~/utils/notification', () => ({ notificationList: [] }))
vi.mock('~/utils/runScript', () => ({ runScriptInStage: vi.fn() }))
vi.mock('~/utils/static', () => ({ CLIPBOARD_IMAGE_FOLDER: 'clipboard' }))
vi.mock('~/server/index', () => ({ default: { startup: vi.fn() } }))
vi.mock('~/fileServer', () => ({ startFileServer: vi.fn() }))
vi.mock('apis/app/system', () => ({ createTray: vi.fn(), setDockMenu: vi.fn() }))
vi.mock('apis/app/uploader/apis', () => ({ uploadChoosedFiles: vi.fn(), uploadClipboardFiles: vi.fn() }))
vi.mock('apis/app/shortKey/shortKeyHandler', () => ({ default: { init: vi.fn() } }))
vi.mock('apis/app/remoteNotice', () => ({
  remoteNoticeHandler: { init: vi.fn().mockResolvedValue(undefined), triggerHook: vi.fn() },
}))
vi.mock('fs-extra', () => ({ default: { emptyDir: vi.fn() } }))

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!

beforeEach(() => {
  vi.resetModules()
  vi.doMock('apis/app/window/windowList', () => import('../src/main/apis/app/window/windowList'))
  vi.doMock('apis/app/window/windowManager', () => import('../src/main/apis/app/window/windowManager'))
  vi.doMock('~/utils/windowHelper', () => import('../src/main/utils/windowHelper'))
  vi.clearAllMocks()
  vi.stubEnv('NODE_ENV', 'production')
  Object.defineProperty(process, 'platform', { value: 'win32' })
  state.config = { settings: { startMode: ISartMode.MINI, miniWindowPosition: [120, 240], miniWindowOntop: true } }
  state.nextId = 1
  state.ready = undefined
  state.saveConfig.mockImplementation((config: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(config)) {
      if (key.startsWith('settings.')) state.config.settings[key.slice('settings.'.length)] = value
    }
  })
})

afterEach(() => {
  Object.defineProperty(process, 'platform', originalPlatform)
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

async function launchStartup() {
  const { lifeCycle } = await import('../src/main/lifeCycle')
  await lifeCycle.launchApp()
  expect(state.ready).toBeDefined()
  await state.ready!()
  const { default: manager } = await import('../src/main/apis/app/window/windowManager')
  return manager
}

describe('mini-window startup and reopening', () => {
  it.each(['win32', 'linux'])('cleans up and reopens after MINI startup on %s', async platform => {
    Object.defineProperty(process, 'platform', { value: platform })
    if (platform === 'linux') delete state.config.settings.startMode
    const manager = await launchStartup()
    const mini = manager.get(IWindowList.MINI_WINDOW) as unknown as FakeWindow
    const id = mini.id
    const cleanup = vi.spyOn(manager, 'deleteById')
    expect(mini.position).toEqual([120, 240])
    expect(mini.alwaysOnTop).toBe(true)
    expect(mini.isVisible()).toBe(true)

    mini.setPosition(320, 480)
    state.saveConfig.mockClear()
    mini.close()
    expect(state.saveConfig).toHaveBeenCalledExactlyOnceWith({
      [configPaths.settings.miniWindowPosition]: [320, 480],
    })
    expect(cleanup).toHaveBeenCalledWith(id)
    expect(manager.has(IWindowList.MINI_WINDOW)).toBe(false)
    expect(manager.getAvailableWindow()).toBeUndefined()

    const { openMiniWindow } = await import('../src/main/utils/windowHelper')
    openMiniWindow(false)
    const reopened = manager.get(IWindowList.MINI_WINDOW) as unknown as FakeWindow
    expect(reopened).not.toBe(mini)
    expect(reopened.isVisible()).toBe(true)
    expect(reopened.position).toEqual([320, 480])
  })

  it('preserves unrelated listeners and saves position once after repeated opens', async () => {
    const manager = await launchStartup()
    const mini = manager.get(IWindowList.MINI_WINDOW) as unknown as FakeWindow
    const onClose = vi.fn()
    const onMove = vi.fn()
    const onClosed = vi.fn()
    mini.on('close', onClose)
    mini.on('move', onMove)
    mini.on('closed', onClosed)

    const { openMiniWindow } = await import('../src/main/utils/windowHelper')
    openMiniWindow(false)
    openMiniWindow(false)
    state.saveConfig.mockClear()
    onMove.mockClear()
    mini.setPosition(400, 500)
    expect(onMove).toHaveBeenCalledOnce()
    expect(state.saveConfig).toHaveBeenCalledExactlyOnceWith({
      [configPaths.settings.miniWindowPosition]: [400, 500],
    })
    state.saveConfig.mockClear()
    mini.close()
    expect(onClose).toHaveBeenCalledOnce()
    expect(onClosed).toHaveBeenCalledOnce()
    expect(state.saveConfig).toHaveBeenCalledOnce()
    expect(manager.has(IWindowList.MINI_WINDOW)).toBe(false)
  })
})

describe('window manager lifecycle', () => {
  it.each([IWindowList.MINI_WINDOW, IWindowList.SETTING_WINDOW])(
    'keeps %s registered when closing is cancelled',
    async name => {
      const { default: manager } = await import('../src/main/apis/app/window/windowManager')
      const window = manager.create(name) as unknown as FakeWindow
      window.once('close', event => event.preventDefault())
      window.close()
      expect(manager.has(name)).toBe(true)
      expect(manager.get(name)).toBe(window)
      window.minimized = true
      expect(manager.create(name)).toBe(window)
      expect(window.minimized).toBe(false)
      expect(window.focused).toBe(true)
      window.close()
      expect(manager.has(name)).toBe(false)
      expect(manager.create(name)).not.toBe(window)
    },
  )

  it.each(['get', 'has', 'create', 'getAvailableWindow'] as const)(
    'discards a destroyed entry through %s',
    async method => {
      const { default: manager } = await import('../src/main/apis/app/window/windowManager')
      const window = manager.create(IWindowList.MINI_WINDOW) as unknown as FakeWindow
      const oldId = window.id
      window.removeAllListeners()
      window.destroy()

      if (method === 'getAvailableWindow') {
        expect(manager.getAvailableWindow()).toBeUndefined()
      } else if (method === 'has') {
        expect(manager.has(IWindowList.MINI_WINDOW)).toBe(false)
      } else if (method === 'get') {
        expect(manager.get(IWindowList.MINI_WINDOW)).toBeUndefined()
      } else {
        expect(manager.create(IWindowList.MINI_WINDOW)).not.toBe(window)
      }

      const replacement = manager.create(IWindowList.MINI_WINDOW)!
      expect(replacement).not.toBe(window)
      expect(replacement.isDestroyed()).toBe(false)
      manager.deleteById(oldId)
      expect(manager.get(IWindowList.MINI_WINDOW)).toBe(replacement)
    },
  )

  it('skips destroyed mini, settings and tray windows when finding an available window', async () => {
    const { default: manager } = await import('../src/main/apis/app/window/windowManager')
    const mini = manager.create(IWindowList.MINI_WINDOW) as unknown as FakeWindow
    const settings = manager.create(IWindowList.SETTING_WINDOW) as unknown as FakeWindow
    const tray = manager.create(IWindowList.TRAY_WINDOW) as unknown as FakeWindow
    mini.show()
    expect(manager.getAvailableWindow()).toBe(mini)
    expect(manager.getAvailableWindow(true)).toBe(settings)

    for (const window of [mini, settings, tray]) window.removeAllListeners()
    mini.destroy()
    expect(manager.getAvailableWindow()).toBe(settings)
    settings.destroy()
    expect(manager.getAvailableWindow()).toBe(tray)
    tray.destroy()
    expect(manager.getAvailableWindow(true)).toBeUndefined()
  })
})
