import { spawn } from 'node:child_process'
import { access, mkdir } from 'node:fs/promises'
import path from 'node:path'

import type { PluginExecutor } from './pluginHandler'

export function bundledNpmEnvironment(
  runtimeDir: string,
  executable: string,
  source: NodeJS.ProcessEnv,
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  const env = { ...source, ...overrides }
  // Windows environments can contain both Path and PATH. A caller's explicit
  // PATH override must replace both, rather than accidentally retaining system Node.
  const pathSource = Object.keys(overrides).some(key => key.toLowerCase() === 'path') ? overrides : env
  const inheritedPath = Object.entries(pathSource)
    .filter(([key]) => key.toLowerCase() === 'path')
    .map(([, value]) => value)
    .filter(Boolean)
    .join(path.delimiter)
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === 'path') delete env[key]
  }
  // These settings are private to this child and its lifecycle scripts.
  delete env.NODE_OPTIONS
  delete env.NODE_PATH
  return {
    ...env,
    PATH: [path.join(runtimeDir, 'bin'), inheritedPath].filter(Boolean).join(path.delimiter),
    ELECTRON_RUN_AS_NODE: '1',
    PICLIST_NODE_EXEC_PATH: executable,
    PICLIST_NPM_CLI: path.join(runtimeDir, 'npm', 'bin', 'npm-cli.js'),
    PICLIST_NPX_CLI: path.join(runtimeDir, 'npm', 'bin', 'npx-cli.js'),
    npm_node_execpath: executable,
    npm_execpath: path.join(runtimeDir, 'npm', 'bin', 'npm-cli.js'),
  }
}

export function redactNpmOutput(output: string) {
  return output
    .replace(/(https?:\/\/)[^\s/@]+(?::[^\s/@]*)?@/gi, '$1[redacted]@')
    .replace(/npm_[a-zA-Z0-9]{20,}/g, '[redacted]')
    .replace(/((?:_authToken|_auth|password)\s*[=:]\s*)\S+/gi, '$1[redacted]')
}

export function createBundledNpmExecutor(
  runtimeDir: string,
  executable: string,
  unavailable: () => string,
): PluginExecutor {
  return async (operation, packages, cwd, options, extraEnv) => {
    const cli = path.join(runtimeDir, 'npm', 'bin', 'npm-cli.js')
    try {
      await access(cli)
      await access(path.join(runtimeDir, 'bin', process.platform === 'win32' ? 'node.exe' : 'node'))
    } catch {
      return { code: 1, data: unavailable() }
    }

    const cache = path.join(cwd, '.npm-cache')
    await mkdir(cache, { recursive: true })
    const args = [cli, operation, ...packages, '--save', '--color=false', '--no-audit', '--no-fund', `--cache=${cache}`]
    if (options.registry) args.push(`--registry=${options.registry}`)
    if (options.proxy) args.push(`--proxy=${options.proxy}`)
    const env = bundledNpmEnvironment(runtimeDir, executable, process.env, extraEnv)

    return new Promise(resolve => {
      const child = spawn(executable, args, { cwd, env, shell: false, windowsHide: true })
      let output = ''
      const collect = (chunk: Buffer) => {
        output = (output + chunk.toString()).slice(-64 * 1024)
      }
      child.stdout?.on('data', collect)
      child.stderr?.on('data', collect)
      child.once('error', () => resolve({ code: 1, data: unavailable() }))
      child.once('close', (code, signal) => {
        resolve({ code: code ?? 1, data: redactNpmOutput(output || (signal ? `npm stopped: ${signal}` : '')) })
      })
    })
  }
}
