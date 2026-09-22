import path from 'node:path'

import { app } from 'electron'

import { t } from '~/i18n'

import { createBundledNpmExecutor } from './npmExecutor'
import type { PluginExecutor } from './pluginHandler'

export const executeBundledNpm: PluginExecutor = (...args) => {
  const platform = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux'
  const runtimeDir = app.isPackaged
    ? path.join(process.resourcesPath, 'plugin-runtime')
    : path.join(app.getAppPath(), 'build', 'plugin-runtime', `${platform}-${process.arch}`)
  return createBundledNpmExecutor(runtimeDir, process.execPath, () => t('main.notification.bundledNpmUnavailable'))(
    ...args,
  )
}
