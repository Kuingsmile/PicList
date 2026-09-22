import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { preparePluginRuntime } from './prepare-plugin-runtime.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
await preparePluginRuntime()
execFileSync(
  process.execPath,
  [
    path.join(root, 'node_modules', 'vitest', 'vitest.mjs'),
    'run',
    'tests/plugin-handler.test.ts',
    'tests/npm-executor.test.ts',
    'tests/plugin-runtime.integration.test.ts',
  ],
  {
    cwd: root,
    env: { ...process.env, PICLIST_PLUGIN_RUNTIME_TEST: '1' },
    stdio: 'inherit',
    windowsHide: true,
  },
)
