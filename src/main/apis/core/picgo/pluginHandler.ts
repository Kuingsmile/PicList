import type { IPicGo, IPluginHandlerOptions, IPluginHandlerResult, IProcessEnv } from 'piclist'
import { PicGoUtils, PluginHandler } from 'piclist'

import { configPaths } from '~/utils/configPaths'

export type PluginOperation = 'install' | 'update' | 'uninstall'
export type PluginExecutor = (
  operation: PluginOperation,
  packages: string[],
  cwd: string,
  options: IPluginHandlerOptions,
  env?: IProcessEnv,
) => Promise<{ code: number; data: string }>

const messages = {
  install: {
    success: 'PLUGIN_HANDLER_PLUGIN_INSTALL_SUCCESS',
    failure: 'PLUGIN_HANDLER_PLUGIN_INSTALL_FAILED',
    reason: 'PLUGIN_HANDLER_PLUGIN_INSTALL_FAILED_REASON',
  },
  update: {
    success: 'PLUGIN_HANDLER_PLUGIN_UPDATE_SUCCESS',
    failure: 'PLUGIN_HANDLER_PLUGIN_UPDATE_FAILED',
    reason: 'PLUGIN_HANDLER_PLUGIN_UPDATE_FAILED_REASON',
  },
  uninstall: {
    success: 'PLUGIN_HANDLER_PLUGIN_UNINSTALL_SUCCESS',
    failure: 'PLUGIN_HANDLER_PLUGIN_UNINSTALL_FAILED',
    reason: 'PLUGIN_HANDLER_PLUGIN_UNINSTALL_FAILED_REASON',
  },
} as const

/** Both executors use the core's existing manifest, plugin loader and configuration. */
export class DesktopPluginHandler extends PluginHandler {
  private pending: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly picgo: IPicGo,
    private readonly executeBundled: PluginExecutor,
  ) {
    super(picgo)
  }

  override install(plugins: string[], options: IPluginHandlerOptions = {}, env?: IProcessEnv) {
    return this.run('install', plugins, options, env)
  }

  override update(plugins: string[], options: IPluginHandlerOptions = {}, env?: IProcessEnv) {
    return this.run('update', plugins, options, env)
  }

  override uninstall(plugins: string[], options: IPluginHandlerOptions = {}) {
    return this.run('uninstall', plugins, options)
  }

  private run(operation: PluginOperation, plugins: string[], options: IPluginHandlerOptions, env?: IProcessEnv) {
    // Capture the selection when the operation is requested. Switching modes never
    // migrates/reinstalls plugins, or changes an operation already in the queue.
    const bundled = this.picgo.getConfig(configPaths.settings.experimentalBundledNpm) === true
    const task = this.pending.then(() => {
      if (bundled) return this.runBundled(operation, plugins, options, env)
      if (operation === 'uninstall') return super.uninstall(plugins, options)
      return super[operation](plugins, options, env)
    })
    // npm commands must not modify the same dependency tree concurrently.
    this.pending = task.catch(() => {})
    return task
  }

  private async runBundled(
    operation: PluginOperation,
    plugins: string[],
    options: IPluginHandlerOptions,
    env?: IProcessEnv,
  ): Promise<IPluginHandlerResult<boolean>> {
    const ctx = this.picgo
    const keys = messages[operation]
    try {
      const packages = plugins.map(input => {
        const fullName = PicGoUtils.getProcessPluginName(input, ctx.log)
        const name = fullName && PicGoUtils.getNormalPluginName(fullName, ctx.log)
        if (!name) throw new Error('Invalid plugin name or local package path')
        return { fullName, name }
      })
      if (!packages.length) throw new Error('No plugins selected')
      const selected = packages.filter(pkg => operation !== 'install' || !ctx.pluginLoader.hasPlugin(pkg.name))
      if (selected.length) {
        const result = await this.executeBundled(
          operation,
          selected.map(pkg => (operation === 'install' ? pkg.fullName : pkg.name)),
          ctx.baseDir,
          {
            ...options,
            registry: options.registry || ctx.getConfig<string>('settings.registry'),
            proxy: options.proxy || ctx.getConfig<string>('settings.proxy'),
          },
          env,
        )
        if (result.code !== 0) throw new Error(result.data || `npm exited with code ${result.code}`)
        for (const pkg of selected) {
          if (operation === 'install') await ctx.pluginLoader.registerPlugin(pkg.name)
          if (operation === 'uninstall') ctx.pluginLoader.unregisterPlugin(pkg.name)
        }
      }
      const names = packages.map(pkg => pkg.name)
      const title = ctx.i18n.t(keys.success)
      ctx.log.success(title)
      ctx.emit(`${operation}Success`, { title, body: names })
      return { success: true, body: names }
    } catch (error) {
      const body = ctx.i18n.t(keys.reason, {
        code: '1',
        data: error instanceof Error ? error.message : 'Bundled npm failed',
      })
      // Bundled failures must not emit the core's "NPM is not installed" event.
      ctx.emit(`${operation}Failed`, { title: ctx.i18n.t(keys.failure), body })
      return { success: false, body }
    }
  }
}
