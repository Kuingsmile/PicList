import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

import { PicGo } from 'piclist'
import { c as pack } from 'tar'
import { describe, expect, it, vi } from 'vitest'

import { createBundledNpmExecutor } from '../src/main/apis/core/picgo/npmExecutor'
import { DesktopPluginHandler } from '../src/main/apis/core/picgo/pluginHandler'

vi.mock('~/utils/configPaths', () => import('../src/main/utils/configPaths'))

const platform = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux'
const runtime = path.resolve('build/plugin-runtime', `${platform}-${process.arch}`)
const electron =
  process.platform === 'win32'
    ? path.resolve('node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.resolve('node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.resolve('node_modules/electron/dist/electron')

// Run after `yarn prepare:plugin-runtime`; uses only a local fixture registry.
describe.skipIf(process.env.PICLIST_PLUGIN_RUNTIME_TEST !== '1')('real plugin runtime interoperability', () => {
  it('installs without system Node, runs nested node scripts, and manages the shared tree in both modes', async () => {
    expect(existsSync(path.join(runtime, 'npm/bin/npm-cli.js'))).toBe(true)
    const temporary = await mkdtemp(path.join(os.tmpdir(), 'piclist-plugin-runtime-'))
    const isolatedRuntime = path.join(temporary, 'runtime')
    const baseDir = path.join(temporary, '旧插件 with spaces')
    const archives = new Map<string, Buffer>()
    const packages = new Map<string, Record<string, unknown>>()
    let registry = ''
    const server = http.createServer((request, response) => {
      const name = decodeURIComponent((request.url || '/').slice(1))
      if (archives.has(name)) {
        response.setHeader('content-type', 'application/octet-stream')
        response.end(archives.get(name))
      } else if (packages.has(name)) {
        const pkg = packages.get(name)!
        const archive = archives.get(`${name}.tgz`)!
        response.setHeader('content-type', 'application/json')
        response.end(
          JSON.stringify({
            name,
            'dist-tags': { latest: pkg.version },
            versions: {
              [pkg.version as string]: {
                ...pkg,
                dist: {
                  tarball: `${registry}/${name}.tgz`,
                  integrity: `sha512-${createHash('sha512').update(archive).digest('base64')}`,
                },
              },
            },
          }),
        )
      } else if (request.method === 'POST') {
        response.end('{}')
      } else {
        response.writeHead(404)
        response.end('{}')
      }
    })
    try {
      // No ancestor node_modules is available: the packaged npm must be self-contained.
      await cp(runtime, isolatedRuntime, { recursive: true })
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
      const address = server.address() as { port: number }
      registry = `http://127.0.0.1:${address.port}`
      const legacy = 'picgo-plugin-legacy-fixture'
      const fresh = '@fixture/picgo-plugin-new'
      for (const name of [legacy, fresh, 'fixture-dependency']) {
        const fixture = path.join(temporary, 'sources', name)
        await mkdir(fixture, { recursive: true })
        const pkg = {
          name,
          version: name === legacy ? '1.1.0' : '1.0.0',
          main: 'index.cjs',
          ...(name === fresh
            ? { dependencies: { 'fixture-dependency': '1.0.0' }, scripts: { postinstall: 'node postinstall.cjs' } }
            : {}),
        }
        await writeFile(path.join(fixture, 'package.json'), JSON.stringify(pkg))
        await writeFile(path.join(fixture, 'index.cjs'), 'module.exports = () => ({ register() {} })')
        if (name === fresh) {
          await writeFile(
            path.join(fixture, 'postinstall.cjs'),
            `
            const { spawnSync } = require('node:child_process');
            const fs = require('node:fs');
            const child = spawnSync('node', ['-p', 'JSON.stringify({node:process.versions.node,electron:process.versions.electron,arg:process.argv[1]})', '中文 spaces "quotes" & symbols'], {encoding:'utf8'});
            if (child.status !== 0) throw new Error('Nested node launcher failed: ' + child.stderr);
            const proof = JSON.parse(child.stdout);
            for (const name of ['npm', 'npx']) {
              const cli = spawnSync(name, ['--version'], {encoding:'utf8', shell:process.platform === 'win32', windowsHide:true});
              if (cli.status !== 0) throw new Error('Nested package manager failed: ' + cli.stderr);
              proof[name] = cli.stdout.trim();
            }
            fs.writeFileSync('runtime-proof.json', JSON.stringify(proof));
          `,
          )
        }
        const chunks: Buffer[] = []
        for await (const chunk of pack({ cwd: fixture, gzip: true, prefix: 'package' }, ['.']))
          chunks.push(Buffer.from(chunk))
        archives.set(`${name}.tgz`, Buffer.concat(chunks))
        packages.set(name, pkg)
      }

      // Simulate an older PicList installation with a disabled plugin and custom settings.
      await mkdir(path.join(baseDir, 'node_modules', legacy), { recursive: true })
      await writeFile(
        path.join(baseDir, '.npmrc'),
        `registry=${registry}\naudit=false\nfund=false\nfetch-retries=0\nfetch-timeout=5000\ncache=${path.join(temporary, 'system-cache').replaceAll('\\', '/')}\nlogs-max=0\n`,
      )
      await writeFile(
        path.join(baseDir, 'package.json'),
        JSON.stringify({ name: 'picgo-plugins', dependencies: { [legacy]: '^1.0.0' } }),
      )
      await writeFile(
        path.join(baseDir, 'node_modules', legacy, 'package.json'),
        JSON.stringify({ name: legacy, version: '1.0.0', main: 'index.cjs' }),
      )
      await writeFile(
        path.join(baseDir, 'node_modules', legacy, 'index.cjs'),
        'module.exports = () => ({ register() {} })',
      )
      const configPath = path.join(baseDir, 'data.json')
      await writeFile(
        configPath,
        JSON.stringify({ picgoPlugins: { [legacy]: false }, [legacy]: { custom: 'preserved' } }),
      )
      const picgo = await PicGo.create(configPath)
      const execute = createBundledNpmExecutor(isolatedRuntime, electron, () => 'Bundled npm unavailable')
      const noSystemNode = {
        PATH: process.platform === 'win32' ? path.join(process.env.SystemRoot!, 'System32') : '',
        npm_config_userconfig: path.join(temporary, 'absent-user.npmrc'),
        npm_config_globalconfig: path.join(temporary, 'absent-global.npmrc'),
        npm_config_update_notifier: 'false',
      }
      picgo.pluginHandler = new DesktopPluginHandler(picgo, (operation, names, cwd, options) =>
        execute(operation, names, cwd, options, noSystemNode),
      )
      picgo.saveConfig({ 'settings.experimentalBundledNpm': true })
      const options = { registry, silent: true }
      expect(await picgo.pluginHandler.install([fresh], options)).toEqual({ success: true, body: [fresh] })
      const proof = JSON.parse(await readFile(path.join(baseDir, 'node_modules', fresh, 'runtime-proof.json'), 'utf8'))
      expect(proof.electron).toBeTruthy()
      expect(proof.npm).toBe('11.16.0')
      expect(proof.npx).toBe('11.16.0')
      expect(proof.arg).toBe('中文 spaces "quotes" & symbols')
      expect(existsSync(path.join(baseDir, 'node_modules/fixture-dependency/package.json'))).toBe(true)
      expect(picgo.pluginLoader.getFullList()).toContain(legacy)
      expect(picgo.getConfig(`picgoPlugins.${legacy}`)).toBe(false)
      expect(picgo.getConfig(`${legacy}.custom`)).toBe('preserved')

      picgo.saveConfig({ 'settings.experimentalBundledNpm': false })
      expect((await picgo.pluginHandler.update([fresh], options, noSystemNodeWithSystemPath())).success).toBe(true)
      expect((await picgo.pluginHandler.uninstall([fresh], options)).success).toBe(true)
      expect(existsSync(path.join(baseDir, 'node_modules', fresh))).toBe(false)
      picgo.saveConfig({ 'settings.experimentalBundledNpm': true })
      expect((await picgo.pluginHandler.update([legacy], options)).success).toBe(true)
      const updated = JSON.parse(await readFile(path.join(baseDir, 'node_modules', legacy, 'package.json'), 'utf8'))
      expect(updated.version).toBe('1.1.0')
      expect(picgo.getConfig(`picgoPlugins.${legacy}`)).toBe(false)
      expect(picgo.getConfig(`${legacy}.custom`)).toBe('preserved')
      expect((await picgo.pluginHandler.uninstall([legacy], options)).success).toBe(true)

      // The local-folder import path uses the same installer and remains removable by system npm.
      expect((await picgo.pluginHandler.install([path.join(temporary, 'sources', legacy)], options)).success).toBe(true)
      picgo.saveConfig({ 'settings.experimentalBundledNpm': false })
      expect((await picgo.pluginHandler.uninstall([legacy], options)).success).toBe(true)
      function noSystemNodeWithSystemPath() {
        const { PATH: _path, ...settings } = noSystemNode
        return settings
      }
    } finally {
      server.closeAllConnections()
      await new Promise<void>(resolve => server.close(() => resolve()))
      const resolved = path.resolve(temporary)
      expect(path.dirname(resolved)).toBe(path.resolve(os.tmpdir()))
      expect(path.basename(resolved).startsWith('piclist-plugin-runtime-')).toBe(true)
      await rm(resolved, { recursive: true, force: true })
    }
  }, 120000)
})
