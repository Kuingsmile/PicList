import { EventEmitter } from 'node:events'

import type { IPicGo } from 'piclist'
import { PluginHandler } from 'piclist'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DesktopPluginHandler } from '../src/main/apis/core/picgo/pluginHandler'

vi.mock('~/utils/configPaths', () => import('../src/main/utils/configPaths'))

function fixture(enabled?: boolean | string) {
  const config: Record<string, unknown> = { 'settings.experimentalBundledNpm': enabled }
  const installed = new Set(['picgo-plugin-legacy'])
  const ctx = Object.assign(new EventEmitter(), {
    baseDir: '/existing/custom plugin directory',
    getConfig: (key: string) => config[key],
    log: { success: vi.fn(), error: vi.fn(), warn: vi.fn() },
    i18n: { t: (key: string, args?: { data: string }) => args?.data || key },
    pluginLoader: {
      hasPlugin: (name: string) => installed.has(name),
      getList: () => [...installed],
      registerPlugin: vi.fn(async (name: string) => {
        installed.add(name)
      }),
      unregisterPlugin: vi.fn((name: string) => {
        installed.delete(name)
      }),
    },
  }) as unknown as IPicGo
  const execute = vi.fn(async () => ({ code: 0, data: '' }))
  return { ctx, config, installed, execute, handler: new DesktopPluginHandler(ctx, execute) }
}

afterEach(() => vi.restoreAllMocks())

describe('optional bundled plugin management', () => {
  it.each([undefined, false, 'true'])('keeps the core system handler for setting=%s', async enabled => {
    const f = fixture(enabled)
    for (const operation of ['install', 'update', 'uninstall'] as const) {
      const original = vi
        .spyOn(PluginHandler.prototype, operation)
        .mockResolvedValue({ success: true, body: ['picgo-plugin-legacy'] })
      await f.handler[operation](['picgo-plugin-legacy'])
      expect(original).toHaveBeenCalledOnce()
    }
    expect(f.execute).not.toHaveBeenCalled()
    expect([...f.installed]).toEqual(['picgo-plugin-legacy'])
  })

  it('can update and remove an older installation in bundled mode without migrating its directory', async () => {
    const f = fixture(true)
    expect(await f.handler.getList()).toEqual(['picgo-plugin-legacy'])
    await f.handler.update(['picgo-plugin-legacy'])
    expect(f.execute).toHaveBeenLastCalledWith(
      'update',
      ['picgo-plugin-legacy'],
      f.ctx.baseDir,
      expect.any(Object),
      undefined,
    )
    expect(f.ctx.pluginLoader.unregisterPlugin).not.toHaveBeenCalled()
    await f.handler.uninstall(['picgo-plugin-legacy'])
    expect(f.execute).toHaveBeenLastCalledWith(
      'uninstall',
      ['picgo-plugin-legacy'],
      f.ctx.baseDir,
      expect.any(Object),
      undefined,
    )
    expect(f.installed.size).toBe(0)
  })

  it('shares bundled installations with the ordinary handler after switching back', async () => {
    const f = fixture(true)
    const result = await f.handler.install(['new-plugin'])
    expect(result).toEqual({ success: true, body: ['picgo-plugin-new-plugin'] })
    expect(f.installed.has('picgo-plugin-legacy')).toBe(true)
    f.config['settings.experimentalBundledNpm'] = false
    const systemUpdate = vi.spyOn(PluginHandler.prototype, 'update').mockImplementation(async function (
      this: PluginHandler,
      names,
    ) {
      expect(await this.getList()).toContain('picgo-plugin-new-plugin')
      return { success: true, body: names }
    })
    await f.handler.update(['picgo-plugin-new-plugin'])
    expect(systemUpdate).toHaveBeenCalledOnce()
    expect(f.execute).toHaveBeenCalledTimes(1)
  })

  it('does not reinstall existing plugins or rewrite their enabled settings', async () => {
    const f = fixture(true)
    f.config['picgoPlugins.picgo-plugin-legacy'] = false
    await f.handler.install(['legacy'])
    expect(f.execute).not.toHaveBeenCalled()
    expect(f.ctx.pluginLoader.registerPlugin).not.toHaveBeenCalled()
    expect(f.config['picgoPlugins.picgo-plugin-legacy']).toBe(false)
  })

  it('keeps the existing loader state when bundled npm fails and does not request system Node', async () => {
    const f = fixture(true)
    f.execute.mockResolvedValue({ code: 1, data: 'Installation failed' })
    const failed = vi.fn()
    f.ctx.on('failed', failed)
    expect((await f.handler.uninstall(['legacy'])).success).toBe(false)
    expect(f.installed.has('picgo-plugin-legacy')).toBe(true)
    expect(failed).not.toHaveBeenCalled()
  })

  it('serializes mutations and remembers the mode selected for each request', async () => {
    const f = fixture(true)
    let release!: (value: { code: number; data: string }) => void
    f.execute.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          release = resolve
        }),
    )
    const first = f.handler.update(['legacy'])
    await Promise.resolve()
    f.config['settings.experimentalBundledNpm'] = false
    const system = vi
      .spyOn(PluginHandler.prototype, 'uninstall')
      .mockResolvedValue({ success: true, body: ['picgo-plugin-legacy'] })
    const second = f.handler.uninstall(['legacy'])
    expect(system).not.toHaveBeenCalled()
    release({ code: 0, data: '' })
    await Promise.all([first, second])
    expect(f.execute).toHaveBeenCalledTimes(1)
    expect(system).toHaveBeenCalledOnce()
  })

  it('retains registry and proxy settings, with operation-specific overrides', async () => {
    const f = fixture(true)
    f.config['settings.registry'] = 'https://registry.example.invalid'
    f.config['settings.proxy'] = 'http://localhost:8080'
    await f.handler.install(['new-plugin'], { registry: 'https://override.example.invalid' })
    expect(f.execute).toHaveBeenCalledWith(
      'install',
      ['picgo-plugin-new-plugin'],
      f.ctx.baseDir,
      {
        registry: 'https://override.example.invalid',
        proxy: 'http://localhost:8080',
      },
      undefined,
    )
  })
})
