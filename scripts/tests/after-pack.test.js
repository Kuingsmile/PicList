import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { setImmediate } from 'node:timers/promises'

import { Platform } from 'app-builder-lib'
import { removeUnusedLanguagesIfNeeded } from 'app-builder-lib/out/electron/ElectronFramework.js'
import { LinuxTargetHelper } from 'app-builder-lib/out/targets/LinuxTargetHelper.js'
import { getConfig, validateConfiguration } from 'app-builder-lib/out/util/config/config.js'

import config from '../../electron-builder.cjs'
import pkg from '../../package.json' with { type: 'json' }
import afterPack from '../afterPack.cjs'

// Resolve the filesystem dependency used by electron-builder, which may be nested.
const builderFs = createRequire(import.meta.resolve('app-builder-lib'))('fs-extra')
const keptLocales = ['en-GB.pak', 'en-US.pak', 'zh-CN.pak', 'zh-TW.pak']
const removedLocales = ['de.pak', 'fr.pak', 'ja.pak']

async function fixture(t, platform, locales = [...keptLocales, ...removedLocales]) {
  const appOutDir = await fs.mkdtemp(path.join(tmpdir(), 'piclist-after-pack-'))
  t.after(async () => {
    const resolved = path.resolve(appOutDir)
    assert.equal(path.dirname(resolved), path.resolve(tmpdir()))
    assert.ok(path.basename(resolved).startsWith('piclist-after-pack-'))
    await fs.rm(resolved, { recursive: true, force: true })
  })
  if (locales !== null) {
    await fs.mkdir(path.join(appOutDir, 'locales'))
    await Promise.all(locales.map(file => fs.writeFile(path.join(appOutDir, 'locales', file), '')))
  }
  return {
    appOutDir,
    electronPlatformName: platform.nodeName,
    packager: {
      config,
      platform,
      platformSpecificBuildOptions: config[platform.buildConfigurationKey],
      getResourcesDir: dir => path.join(dir, 'resources'),
    },
  }
}

async function assertPending(promise) {
  assert.equal(
    await Promise.race([
      promise.then(
        () => 'settled',
        () => 'settled',
      ),
      setImmediate('pending'),
    ]),
    'pending',
  )
}

test('electron-builder discovers and accepts the platform-aware configuration', async () => {
  const discovered = await getConfig(process.cwd(), null, undefined)
  assert.deepEqual(discovered, config)
  await validateConfiguration(discovered)
})

test('Linux launchers match Electron desktop metadata, including the lowercase Snap fallback', async () => {
  const helper = new LinuxTargetHelper({
    config,
    platformSpecificBuildOptions: config.linux,
    executableName: config.linux.executableName,
    info: { metadata: pkg },
    appInfo: {
      productName: config.productName,
      sanitizedProductName: config.productName,
      description: pkg.description,
    },
    fileAssociations: [],
  })
  const entry = await helper.computeDesktopEntry(config.linux)
  const wmClass = /^StartupWMClass=(.+)$/m.exec(entry)?.[1]
  assert.equal(`${wmClass}.desktop`, pkg.desktopName)
  assert.equal(`${helper.getDesktopFileName()}.desktop`, pkg.desktopName)
  assert.equal(`${helper.getDesktopFileName(pkg.name)}.desktop`, pkg.desktopName)
  // Keep the existing installed launcher filename and executable path.
  assert.equal(helper.getDesktopFileName(), 'PicList')
  assert.match(entry, /^Exec=\/opt\/PicList\/PicList %U$/m)
})

for (const platform of ['darwin', 'win32', 'linux']) {
  test(`only macOS registers the Apple notarization hook (${platform})`, () => {
    const configUrl = new URL('../../electron-builder.cjs', import.meta.url).href
    const script = `Object.defineProperty(process, 'platform', { value: ${JSON.stringify(platform)} });
      const { default: config } = await import(${JSON.stringify(configUrl)});
      console.log(JSON.stringify(config.afterSign ?? null));`
    const afterSign = JSON.parse(
      execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', windowsHide: true }),
    )
    assert.equal(afterSign, platform === 'darwin' ? 'scripts/notarize.cjs' : null)
  })
}

for (const platform of [Platform.WINDOWS, Platform.LINUX]) {
  test(`${platform.nodeName} keeps English and Chinese locales before afterPack completes`, async t => {
    const context = await fixture(t, platform)
    if (platform === Platform.WINDOWS) await fs.writeFile(path.join(context.appOutDir, 'PORTABLE'), '')

    await removeUnusedLanguagesIfNeeded(context)
    await afterPack.default(context)

    assert.deepEqual((await fs.readdir(path.join(context.appOutDir, 'locales'))).sort(), keptLocales)
    await assert.rejects(fs.stat(path.join(context.appOutDir, 'PORTABLE')), { code: 'ENOENT' })
  })

  test(`${platform.nodeName} rejects a missing locale directory`, async t => {
    const context = await fixture(t, platform, null)
    await assert.rejects(removeUnusedLanguagesIfNeeded(context), { code: 'ENOENT' })
  })
}

test('macOS succeeds without a top-level locale directory and preserves its locales', async t => {
  const context = await fixture(t, Platform.MAC, null)
  const resources = path.join(context.appOutDir, 'PicList.app', 'Contents', 'Resources')
  const locales = ['en.lproj', 'fr.lproj', 'zh_CN.lproj']
  await Promise.all(locales.map(locale => fs.mkdir(path.join(resources, locale), { recursive: true })))
  await fs.writeFile(path.join(context.appOutDir, 'PORTABLE'), '')

  await removeUnusedLanguagesIfNeeded(context)
  await afterPack.default(context)

  assert.deepEqual((await fs.readdir(resources)).sort(), locales)
  assert.ok((await fs.stat(path.join(context.appOutDir, 'PORTABLE'))).isFile())
})

test('electron-builder waits for every locale deletion', async t => {
  const context = await fixture(t, Platform.WINDOWS, [...keptLocales, 'de.pak', 'fr.pak'])
  const started = Promise.withResolvers()
  const firstDeleted = Promise.withResolvers()
  const gates = [Promise.withResolvers(), Promise.withResolvers()]
  const rm = builderFs.rm
  let deletionsStarted = 0
  const mockedRm = t.mock.method(builderFs, 'rm', async (file, options) => {
    const index = deletionsStarted++
    if (deletionsStarted === gates.length) started.resolve()
    await gates[index].promise
    await rm(file, options)
    if (index === 0) firstDeleted.resolve()
  })

  const cleanup = removeUnusedLanguagesIfNeeded(context)
  try {
    await Promise.race([
      started.promise,
      cleanup.then(() => assert.fail('Locale cleanup completed before the deletions were released')),
    ])
    await assertPending(cleanup)
    gates[0].resolve()
    await firstDeleted.promise
    await assertPending(cleanup)
    gates[1].resolve()
    await cleanup
    assert.deepEqual((await fs.readdir(path.join(context.appOutDir, 'locales'))).sort(), keptLocales)
  } finally {
    for (const gate of gates) gate.resolve()
    await cleanup.finally(() => mockedRm.mock.restore())
  }
})

test('locale deletion errors reject packaging', async t => {
  const context = await fixture(t, Platform.WINDOWS, [...keptLocales, 'fr.pak'])
  const error = Object.assign(new Error('Synthetic locale deletion failure'), { code: 'EACCES' })
  t.mock.method(builderFs, 'rm', async () => {
    await setImmediate()
    throw error
  })

  await assert.rejects(removeUnusedLanguagesIfNeeded(context), actual => actual === error)
})

test('afterPack waits for portable marker removal', async t => {
  const context = await fixture(t, Platform.WINDOWS, null)
  const marker = path.join(context.appOutDir, 'PORTABLE')
  await fs.writeFile(marker, '')
  const gate = Promise.withResolvers()
  const rm = fs.rm
  const mockedRm = t.mock.method(fs, 'rm', async (file, options) => {
    if (file === marker) await gate.promise
    return rm(file, options)
  })

  const cleanup = afterPack.default(context)
  try {
    await assertPending(cleanup)
    assert.ok((await fs.stat(marker)).isFile())
    gate.resolve()
    await cleanup
    await assert.rejects(fs.stat(marker), { code: 'ENOENT' })
  } finally {
    gate.resolve()
    await cleanup.finally(() => mockedRm.mock.restore())
  }
})

test('afterPack tolerates an absent portable marker', async t => {
  await afterPack.default(await fixture(t, Platform.WINDOWS, null))
})

test('portable marker deletion errors reject afterPack', async t => {
  const context = await fixture(t, Platform.WINDOWS, null)
  const marker = path.join(context.appOutDir, 'PORTABLE')
  const error = Object.assign(new Error('Synthetic marker deletion failure'), { code: 'EACCES' })
  const rm = fs.rm
  const mockedRm = t.mock.method(fs, 'rm', async (file, options) => {
    if (file !== marker) return rm(file, options)
    await setImmediate()
    throw error
  })
  try {
    await assert.rejects(afterPack.default(context), actual => actual === error)
  } finally {
    mockedRm.mock.restore()
  }
})
