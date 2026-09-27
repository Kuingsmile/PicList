import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import YAML from 'yaml'

import pkg from '../../package.json' with { type: 'json' }
import { combineSelectedYml } from '../combine-yml.cjs'
import { selectManifest, version } from '../config.js'
import { prepareReleaseDependencies } from '../prepare-release-dependencies.js'
import { createBuildMatrix, stageBuildArtifacts } from '../release-manifest.js'
import { validateManifest } from '../upload-to-s3.js'

const workflow = YAML.parse(await readFile(new URL('../../.github/workflows/buid_arch.yml', import.meta.url), 'utf8'))
const selections = workflow.on.workflow_dispatch.inputs.build_os.options.filter(build => build !== 'All')

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'piclist-release-build-'))
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()))
    assert.ok(path.basename(directory).startsWith('piclist-release-build-'))
    await rm(directory, { recursive: true, force: true })
  })
  return directory
}

test('All schedules six build runners covering every dispatch format exactly once', () => {
  const { include } = createBuildMatrix()
  assert.equal(include.length, 6)
  assert.equal(new Set(include.map(({ os, arch }) => `${os}-${arch}`)).size, 6)
  const scheduled = include.flatMap(({ os, arch, formats }) => formats.map(format => `${os}-${arch}-${format}`))
  assert.deepEqual(scheduled.sort(), [...selections].sort())
  assert.ok(include.every(group => group.has_metadata))
  assert.ok(!include.find(group => group.os === 'ubuntu-24.04-arm').formats.includes('snap'))
})

test('each partial selection schedules only its requested format and runner', () => {
  for (const selection of selections) {
    const { include } = createBuildMatrix(selection)
    assert.equal(include.length, 1)
    const [{ os, arch, formats, has_metadata }] = include
    assert.equal(formats.length, 1)
    assert.equal(`${os}-${arch}-${formats[0]}`, selection)
    assert.equal(has_metadata, selectManifest(selection).metadata.length > 0)
  }
  assert.throws(() => createBuildMatrix('ubuntu-24.04-arm-arm64-snap'), /Unknown release build/)
  assert.throws(() => createBuildMatrix('invalid'), /Unknown release build/)
})

async function createBuild(directory, selection) {
  const manifest = selectManifest(selection)
  await mkdir(directory, { recursive: true })
  const files = []
  for (const binary of manifest.binaries) {
    const body = Buffer.from(`Synthetic release artifact: ${binary.name}`)
    await writeFile(path.join(directory, binary.name), body)
    files.push({ url: binary.name, sha512: createHash('sha512').update(body).digest('base64'), size: body.length })
  }
  for (const metadata of manifest.metadata) {
    await writeFile(
      path.join(directory, metadata.name),
      YAML.stringify({ version, files, path: files[0].url, sha512: files[0].sha512 }),
    )
  }
  return manifest
}

test('grouped target snapshots retain all artifacts and YAML across overwrites and combine successfully', async t => {
  const directory = await temporaryDirectory(t)
  const dist = path.join(directory, 'dist')
  const stage = path.join(directory, 'release')
  for (const { os, arch, formats } of createBuildMatrix().include) {
    for (const format of formats) {
      const selection = `${os}-${arch}-${format}`
      const manifest = await createBuild(dist, selection)
      const result = await stageBuildArtifacts(dist, selection, stage)
      assert.equal(result.files.length, manifest.binaries.length)
      assert.equal(result.metadataFiles.length, manifest.metadata.length)
      // Each individual selection must still work through the publication path.
      const partial = path.join(directory, 'combined', selection)
      await combineSelectedYml(path.join(stage, 'yml'), partial, selection)
      await validateManifest({ artifactDir: path.join(stage, 'artifacts'), metadataDir: partial, build: selection })
    }
  }
  const combined = path.join(directory, 'combined-all')
  await combineSelectedYml(path.join(stage, 'yml'), combined)
  const manifest = await validateManifest({ artifactDir: path.join(stage, 'artifacts'), metadataDir: combined })
  assert.equal(manifest.binaries.length, 17)
  assert.equal(manifest.metadata.length, 4)
  assert.equal((await readdir(path.join(stage, 'artifacts'))).length, selections.length)
})

test('staging rejects missing required files and preserves optional blockmaps and portable metadata rules', async t => {
  const directory = await temporaryDirectory(t)
  const dist = path.join(directory, 'dist')
  const stage = path.join(directory, 'release')
  const selection = 'windows-latest-x64-nsis'
  const manifest = await createBuild(dist, selection)
  await rm(path.join(dist, manifest.metadata[0].name))
  await assert.rejects(stageBuildArtifacts(dist, selection, stage), /required build artifact/)
  await assert.rejects(lstat(stage), { code: 'ENOENT' })
  await createBuild(dist, selection)
  const blockmap = `${manifest.binaries[0].name}.blockmap`
  await writeFile(path.join(dist, blockmap), 'Synthetic blockmap')
  const result = await stageBuildArtifacts(dist, selection, stage)
  assert.ok(result.files.some(file => path.basename(file) === blockmap))
  await createBuild(dist, 'windows-latest-x64-zip')
  const portable = await stageBuildArtifacts(dist, 'windows-latest-x64-zip', stage)
  assert.deepEqual(portable.metadataFiles, [])
  await assert.rejects(stageBuildArtifacts(dist, 'All', stage), /Validate each matrix build/)
})

test('release tooling uses the application lockfile and only utility dependencies without lifecycle scripts', async t => {
  const directory = await temporaryDirectory(t)
  await prepareReleaseDependencies(directory)
  const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
  assert.equal(manifest.scripts, undefined)
  assert.equal(manifest.devDependencies, undefined)
  assert.equal(manifest.dependencies.electron, undefined)
  assert.equal(manifest.dependencies['electron-builder'], undefined)
  for (const [name, range] of Object.entries(manifest.dependencies)) {
    assert.equal(range, pkg.dependencies[name] ?? pkg.devDependencies[name])
  }
  const copiedLockfile = await readFile(path.join(directory, 'yarn.lock'))
  assert.deepEqual(copiedLockfile, await readFile(new URL('../../yarn.lock', import.meta.url)))
})
