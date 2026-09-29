import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, readlink, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { copyNpmRuntime } from '../plugin-runtime/copy-npm.mjs'

async function tempRoot(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'piclist-runtime-'))
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()))
    assert.ok(path.basename(root).startsWith('piclist-runtime-'))
    await rm(root, { recursive: true, force: true })
  })
  return root
}

async function fileSymlink(t, target, link) {
  try {
    await symlink(target, link, 'file')
    return true
  } catch (error) {
    if (process.platform !== 'win32' || error.code !== 'EPERM') throw error
    t.skip('File symlinks require Windows Developer Mode or administrator privileges')
    return false
  }
}

async function fixture(t) {
  const root = await tempRoot(t)
  const source = path.join(root, 'source')
  const destination = path.join(root, 'staging', 'npm')
  await mkdir(path.join(source, 'bin'), { recursive: true })
  await mkdir(path.join(source, 'node_modules', 'tool', 'bin'), { recursive: true })
  const cli = path.join(source, 'node_modules', 'tool', 'bin', 'cli.cjs')
  await writeFile(cli, "console.log(require('../package.json').version)\n", { mode: 0o755 })
  await writeFile(path.join(source, 'node_modules', 'tool', 'package.json'), '{"version":"1.0.0"}')
  const link = path.join(source, 'bin', 'tool')
  if (!(await fileSymlink(t, '../node_modules/tool/bin/cli.cjs', link))) return
  return { root, source, destination, cli, link }
}

test('bundled npm links remain relative and executable after moving the app off the build machine', async t => {
  const files = await fixture(t)
  if (!files) return
  const { root, source, destination } = files
  await copyNpmRuntime(source, destination)
  const moved = path.join(root, 'installed', 'npm')
  await mkdir(path.dirname(moved), { recursive: true })
  await rename(destination, moved)
  // Remove the source from its old location: resolving back into it must fail.
  await rename(source, path.join(root, 'removed-source'))
  const link = path.join(moved, 'bin', 'tool')
  assert.equal((await readlink(link)).replaceAll('\\', '/'), '../node_modules/tool/bin/cli.cjs')
  assert.equal(await realpath(link), await realpath(path.join(moved, 'node_modules', 'tool', 'bin', 'cli.cjs')))
  assert.equal(execFileSync(process.execPath, [link], { encoding: 'utf8', windowsHide: true }).trim(), '1.0.0')
})

for (const kind of ['absolute', 'escaping', 'dangling']) {
  test(`rejects ${kind} npm links before packaging`, async t => {
    const files = await fixture(t)
    if (!files) return
    const { root, source, destination, cli, link } = files
    await rm(link)
    await writeFile(path.join(root, 'outside.cjs'), '')
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(path.join(path.dirname(destination), 'outside.cjs'), '')
    const target = kind === 'absolute' ? cli : kind === 'escaping' ? '../../outside.cjs' : '../missing.cjs'
    await symlink(target, link, 'file')
    await assert.rejects(
      copyNpmRuntime(source, destination),
      kind === 'dangling' ? /Broken bundled npm symlink/ : /Non-portable bundled npm symlink/,
    )
  })
}

for (const kind of ['POSIX symlinks', 'Windows shims']) {
  test(`omits Yarn's ${kind} to hoisted packages while preserving npm's bundled files`, async t => {
    const root = await tempRoot(t)
    const project = path.join(root, 'project')
    const source = path.join(project, 'node_modules', 'npm')
    const destination = path.join(root, 'staging', 'npm')
    const bundledPackage = path.join(source, 'node_modules', '@npmcli', 'arborist')
    const hoistedPackage = path.join(project, 'node_modules', '@npmcli', 'arborist')
    for (const [directory, version] of [
      [bundledPackage, '9.7.0'],
      [hoistedPackage, '9.9.1'],
    ]) {
      await mkdir(path.join(directory, 'bin'), { recursive: true })
      await writeFile(path.join(directory, 'package.json'), JSON.stringify({ version }))
      await writeFile(path.join(directory, 'bin', 'index.js'), "console.log(require('../package.json').version)\n")
    }
    await mkdir(path.join(source, 'bin'))
    await writeFile(
      path.join(source, 'bin', 'npm-cli.js'),
      "require('../node_modules/@npmcli/arborist/bin/index.js')\n",
    )
    // A package's own .bin assets are not package-manager-generated launchers.
    await mkdir(path.join(bundledPackage, '.bin'))
    await writeFile(path.join(bundledPackage, '.bin', 'asset'), 'keep')
    const binDirectories = [
      path.join('node_modules', '.bin'),
      path.join('node_modules', '@npmcli', 'arborist', 'node_modules', '.bin'),
    ]
    for (const directory of binDirectories) {
      const bin = path.join(source, directory)
      await mkdir(bin, { recursive: true })
      const target = path.relative(bin, path.join(hoistedPackage, 'bin', 'index.js'))
      if (kind === 'POSIX symlinks') {
        if (!(await fileSymlink(t, target, path.join(bin, 'arborist')))) return
      } else {
        await writeFile(path.join(bin, 'arborist.cmd'), `@node "%~dp0\\${target}" %*\r\n`)
        await writeFile(
          path.join(bin, 'arborist'),
          `#!/bin/sh\nnode "$(dirname "$0")/${target.replaceAll('\\', '/')}" "$@"\n`,
        )
      }
    }
    await copyNpmRuntime(source, destination)
    for (const directory of binDirectories) {
      await access(path.join(source, directory, kind === 'POSIX symlinks' ? 'arborist' : 'arborist.cmd'))
      await assert.rejects(access(path.join(destination, directory)), { code: 'ENOENT' })
    }
    const moved = path.join(root, 'installed', 'npm')
    await mkdir(path.dirname(moved), { recursive: true })
    await rename(destination, moved)
    await rename(project, path.join(root, 'removed-build-machine'))
    assert.equal(
      await readFile(path.join(moved, 'node_modules', '@npmcli', 'arborist', '.bin', 'asset'), 'utf8'),
      'keep',
    )
    assert.equal(
      execFileSync(process.execPath, [path.join(moved, 'bin', 'npm-cli.js')], {
        encoding: 'utf8',
        windowsHide: true,
      }).trim(),
      '9.7.0',
    )
  })
}

test('the installed npm runtime can install plugins and run their commands offline after relocation', async t => {
  const root = await tempRoot(t)
  const source = fileURLToPath(new URL('../../node_modules/npm/', import.meta.url))
  const destination = path.join(root, 'staging', 'npm')
  await copyNpmRuntime(source, destination)
  const moved = path.join(root, 'installed', 'npm')
  await mkdir(path.dirname(moved), { recursive: true })
  await rename(destination, moved)
  const env = { ...process.env }
  const inheritedPath = Object.entries(env)
    .filter(([key]) => /^path$/i.test(key))
    .map(([, value]) => value)
    .join(path.delimiter)
  // Keep the smoke test independent of developer npm settings and dependencies.
  for (const key of Object.keys(env)) {
    if (/^(path$|node_path$|node_options$|npm_)/i.test(key)) delete env[key]
  }
  Object.assign(env, {
    PATH: [path.dirname(process.execPath), inheritedPath].join(path.delimiter),
    npm_config_cache: path.join(root, 'cache'),
    npm_config_userconfig: path.join(root, 'user.npmrc'),
    npm_config_globalconfig: path.join(root, 'global.npmrc'),
    npm_config_offline: 'true',
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  })
  await writeFile(env.npm_config_userconfig, '')
  await writeFile(env.npm_config_globalconfig, '')
  function run(command, args, cwd) {
    return execFileSync(process.execPath, [path.join(moved, 'bin', `${command}-cli.js`), ...args], {
      cwd,
      env,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  }
  const plugin = path.join(root, 'plugin')
  await mkdir(plugin)
  await writeFile(
    path.join(plugin, 'package.json'),
    JSON.stringify({
      name: 'piclist-runtime-fixture',
      version: '1.0.0',
      bin: { 'piclist-runtime-fixture': 'cli.cjs' },
      scripts: { install: 'node install.cjs' },
    }),
  )
  await writeFile(
    path.join(plugin, 'cli.cjs'),
    "#!/usr/bin/env node\nconsole.log(require('./package.json').version)\n",
    {
      mode: 0o755,
    },
  )
  await writeFile(path.join(plugin, 'install.cjs'), "require('fs').writeFileSync('installed.txt', 'installed')\n")
  const [packed] = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts'], plugin))
  const consumer = path.join(root, 'consumer')
  await mkdir(consumer)
  await writeFile(
    path.join(consumer, 'package.json'),
    JSON.stringify({
      name: 'piclist-runtime-consumer',
      version: '1.0.0',
      private: true,
      scripts: { fixture: 'piclist-runtime-fixture', 'check-gyp': 'node-gyp --version' },
    }),
  )
  // A tarball forces a real installation, including lifecycle scripts and bin links.
  run('npm', ['install', '--foreground-scripts', path.join(plugin, packed.filename)], consumer)
  assert.equal(
    await readFile(path.join(consumer, 'node_modules', 'piclist-runtime-fixture', 'installed.txt'), 'utf8'),
    'installed',
  )
  assert.match(run('npm', ['run', 'fixture'], consumer), /(?:^|\r?\n)1\.0\.0$/)
  assert.equal(run('npx', ['--no-install', 'piclist-runtime-fixture'], consumer), '1.0.0')
  assert.match(run('npm', ['run', 'check-gyp'], consumer), /(?:^|\r?\n)v\d+\.\d+\.\d+$/)
})
