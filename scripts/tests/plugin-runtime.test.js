import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readlink, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { copyNpmRuntime } from '../plugin-runtime/copy-npm.mjs'

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'piclist-runtime-'))
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()))
    assert.ok(path.basename(root).startsWith('piclist-runtime-'))
    await rm(root, { recursive: true, force: true })
  })
  const source = path.join(root, 'source')
  const destination = path.join(root, 'staging', 'npm')
  await mkdir(path.join(source, 'node_modules', '.bin'), { recursive: true })
  await mkdir(path.join(source, 'node_modules', 'tool', 'bin'), { recursive: true })
  const cli = path.join(source, 'node_modules', 'tool', 'bin', 'cli.cjs')
  await writeFile(cli, "console.log(require('../package.json').version)\n", { mode: 0o755 })
  await writeFile(path.join(source, 'node_modules', 'tool', 'package.json'), '{"version":"1.0.0"}')
  const link = path.join(source, 'node_modules', '.bin', 'tool')
  try {
    await symlink('../tool/bin/cli.cjs', link, 'file')
  } catch (error) {
    if (process.platform !== 'win32' || error.code !== 'EPERM') throw error
    t.skip('File symlinks require Windows Developer Mode or administrator privileges')
    return
  }
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
  const link = path.join(moved, 'node_modules', '.bin', 'tool')
  assert.equal((await readlink(link)).replaceAll('\\', '/'), '../tool/bin/cli.cjs')
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
    const target = kind === 'absolute' ? cli : kind === 'escaping' ? '../../../outside.cjs' : '../missing.cjs'
    await symlink(target, link, 'file')
    await assert.rejects(
      copyNpmRuntime(source, destination),
      kind === 'dangling' ? /Broken bundled npm symlink/ : /Non-portable bundled npm symlink/,
    )
  })
}
