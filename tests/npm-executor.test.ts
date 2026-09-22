import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  bundledNpmEnvironment,
  createBundledNpmExecutor,
  redactNpmOutput,
} from '../src/main/apis/core/picgo/npmExecutor'

describe('bundled npm execution environment', () => {
  it('replaces all inherited PATH variants when an operation overrides PATH', () => {
    const env = bundledNpmEnvironment(
      '/runtime',
      '/PicList.exe',
      { Path: 'system-node', PATH: 'other-node' },
      { PATH: 'system32' },
    )
    expect(env.PATH).toBe([path.join('/runtime', 'bin'), 'system32'].join(path.delimiter))
    expect(env.Path).toBeUndefined()
  })
  it('keeps launchers private and normalizes Windows PATH casing', () => {
    const original = { Path: 'system-tools', NODE_OPTIONS: '--require unwanted.js', NODE_PATH: 'global-modules' }
    const env = bundledNpmEnvironment('/runtime with spaces', '/PicList.exe', original)
    expect(env.PATH).toBe([path.join('/runtime with spaces', 'bin'), 'system-tools'].join(path.delimiter))
    expect(env.Path).toBeUndefined()
    expect(env.NODE_OPTIONS).toBeUndefined()
    expect(env.NODE_PATH).toBeUndefined()
    expect(env.ELECTRON_RUN_AS_NODE).toBe('1')
    expect(env.PICLIST_NODE_EXEC_PATH).toBe('/PicList.exe')
    expect(original).toEqual({
      Path: 'system-tools',
      NODE_OPTIONS: '--require unwanted.js',
      NODE_PATH: 'global-modules',
    })
  })

  it('returns an experimental-runtime error without falling back to system npm', async () => {
    const execute = createBundledNpmExecutor(
      '/missing/plugin-runtime',
      '/missing/PicList',
      () => 'Bundled runtime unavailable',
    )
    expect(await execute('install', ['picgo-plugin-example'], '/existing/plugins', {})).toEqual({
      code: 1,
      data: 'Bundled runtime unavailable',
    })
  })

  it('redacts credentials in package-manager errors', () => {
    expect(
      redactNpmOutput(
        'https://user:example-secret@registry.invalid _authToken=example-secret npm_123456789012345678901234567890',
      ),
    ).toBe('https://[redacted]@registry.invalid _authToken=[redacted] [redacted]')
  })
})
