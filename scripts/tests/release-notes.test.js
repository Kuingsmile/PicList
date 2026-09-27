import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import YAML from 'yaml'

import { selectFiles, selectManifest, version } from '../config.js'
import { generateReleaseNotes, resolveReleaseContext } from '../generate-release-notes.js'

const project = fileURLToPath(new URL('../..', import.meta.url))
const repository = 'example/PicList'
const releaseTag = `v${version}`
const payload = Buffer.from('Synthetic release artifact for local regression tests')
const sha512 = createHash('sha512').update(payload).digest('base64')
let temporaryRoot
let cwd
let sourceCommit
let futureCommit

function run(file, args, directory = cwd) {
  return spawnSync(file, args, {
    cwd: directory,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
  })
}

function git(...args) {
  const result = run('git', args)
  // Do not log raw child process errors or arbitrary Git output on failure.
  if (result.status !== 0) throw new Error('Release test Git fixture command failed')
  return result.stdout.trim()
}

function commit(message, packageVersion = version) {
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ version: packageVersion }))
  writeFileSync(path.join(cwd, 'currentVersion_en.md'), `English notes: ${message}\n`)
  writeFileSync(path.join(cwd, 'currentVersion.md'), `中文更新: ${message}\n`)
  git('add', '.')
  git('commit', '-q', '-m', message)
  return git('rev-parse', 'HEAD')
}

before(() => {
  temporaryRoot = mkdtempSync(path.join(tmpdir(), 'piclist-release-notes-'))
  cwd = path.join(temporaryRoot, 'repository')
  mkdirSync(cwd)
  git('init', '-q', '--initial-branch=main')
  git('config', 'user.email', 'release-fixture@example.invalid')
  git('config', 'user.name', 'Release fixture')
  git('config', 'commit.gpgsign', 'false')
  git('config', 'tag.gpgsign', 'false')
  git('config', 'core.autocrlf', 'false')
  commit('first-release')
  git('tag', '-a', 'v1.0.0', '-m', 'First published release')
  commit('previous-release')
  git('tag', 'v2.0.0')
  git('tag', 'releases/baseline+1')
  commit('internal-build')
  git('tag', 'internal-only')
  sourceCommit = commit('released-source')
  git('tag', '-a', releaseTag, '-m', 'Current release')
  futureCommit = commit('unreleased-head', '99.0.0')
  git('tag', 'future-release')
  const unrelated = git('commit-tree', git('rev-parse', 'HEAD^{tree}'), '-m', 'Unrelated release')
  git('tag', 'unrelated-release', unrelated)
})

after(() => {
  if (!temporaryRoot) return
  const resolved = path.resolve(temporaryRoot)
  // Only remove the unique fixture directory created by this test process.
  assert.equal(path.dirname(resolved), path.resolve(tmpdir()))
  assert.ok(path.basename(resolved).startsWith('piclist-release-notes-'))
  rmSync(resolved, { recursive: true, force: true })
})

function verifiedManifest(build = 'All', releaseVersion = version) {
  return {
    schemaVersion: 1,
    version: releaseVersion,
    build,
    binaries: selectFiles(build, releaseVersion).map(({ name }) => ({ name, size: payload.length, sha512 })),
  }
}

function notes(options = {}) {
  return generateReleaseNotes({
    cwd,
    repository,
    releaseTag,
    sourceCommit,
    previousTag: 'v2.0.0',
    manifest: verifiedManifest(),
    ...options,
  })
}

function assetUrls(body) {
  return [...body.matchAll(/https:\/\/github\.com\/example\/PicList\/releases\/download\/[^)\s]+/g)].map(
    match => match[0],
  )
}

test('all downloads match configured artifacts, including case-sensitive Linux names', () => {
  const body = notes()
  const urls = assetUrls(body)
  assert.equal(urls.length, 17)
  assert.equal(new Set(urls).size, urls.length)
  assert.deepEqual(
    urls.map(url => decodeURIComponent(new URL(url).pathname.split('/').at(-1))).sort(),
    selectFiles()
      .map(file => file.name)
      .sort(),
  )
  for (const suffix of ['amd64.deb', 'arm64.deb', 'x86_64.rpm', 'aarch64.rpm', 'amd64.snap']) {
    assert.ok(
      urls.includes(`https://github.com/${repository}/releases/download/${releaseTag}/PicList-${version}-${suffix}`),
    )
  }
  assert.doesNotMatch(body, /Piclist-/)
  assert.doesNotMatch(body, /\.blockmap|latest.*\.yml/)
})

test('notes and changelog use the released source even after HEAD advances', () => {
  const body = notes()
  assert.match(body, /English notes: released-source/)
  assert.match(body, /中文更新: released-source/)
  assert.doesNotMatch(body, /unreleased-head|99\.0\.0|\.\.\.HEAD/)
  assert.ok(body.includes(`/compare/v2.0.0...${sourceCommit}`))
  assert.ok(body.includes(`/commit/${sourceCommit}`))
  assert.ok(!body.includes(futureCommit))
})

test('preview, custom and isolated draft tags are independent of the package version', () => {
  for (const tag of ['preview', 'releases/canary+smoke', 'build-12345-2', "preview/(check)'!"]) {
    const urls = assetUrls(notes({ releaseTag: tag }))
    const encoded = encodeURIComponent(tag).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16)}`)
    assert.ok(urls.every(url => url.includes(`/releases/download/${encoded}/`)))
    assert.ok(urls.every(url => url.includes(version)))
  }
  assert.ok(
    notes({ previousTag: 'releases/baseline+1' }).includes(`/compare/releases%2Fbaseline%2B1...${sourceCommit}`),
  )
})

test('partial builds include only selected downloads and omit empty platform sections', () => {
  const cases = [
    ['windows-latest-x64-zip', 'Windows', [`PicList-Setup-${version}-x64-portable.zip`]],
    ['windows-11-arm-arm64-7z', 'Windows', [`PicList-Setup-${version}-arm64-portable.7z`]],
    ['ubuntu-24.04-arm-arm64-rpm', 'Linux', [`PicList-${version}-aarch64.rpm`]],
    ['ubuntu-latest-x64-snap', 'Linux', [`PicList-${version}-amd64.snap`]],
    ['macos-latest-arm64-dmg', 'macOS', [`PicList-${version}-arm64.dmg`, `PicList-${version}-arm64.zip`]],
  ]
  for (const [build, platform, names] of cases) {
    const body = notes({ manifest: verifiedManifest(build) })
    assert.deepEqual(
      assetUrls(body).map(url => decodeURIComponent(new URL(url).pathname.split('/').at(-1))),
      names,
    )
    assert.deepEqual(
      [...body.matchAll(/^### (Windows|macOS|Linux)$/gm)].map(match => match[1]),
      [platform],
    )
  }
})

test('automatic history selects the nearest published ancestor, excluding the current release', () => {
  const context = resolveReleaseContext({
    cwd,
    releaseTag,
    sourceCommit,
    publishedTags: ['v1.0.0', 'v2.0.0', releaseTag, 'future-release', 'unrelated-release'],
  })
  assert.equal(context.previousTag, 'v2.0.0')
  // A non-release internal tag lies between v2.0.0 and the released source.
  assert.notEqual(context.previousTag, 'internal-only')
})

test('a first release links to source history without inventing a comparison base', () => {
  for (const options of [{ previousTag: '' }, { previousTag: undefined, publishedTags: [] }]) {
    const body = notes(options)
    assert.ok(body.includes(`/commits/${sourceCommit}`))
    assert.doesNotMatch(body, /Full Changelog|\/compare\//)
  }
})

test('release identity rejects mutable refs, conflicting tags and invalid comparison bases', () => {
  for (const options of [
    { sourceCommit: 'HEAD' },
    { sourceCommit: '0'.repeat(40) },
    { releaseTag: 'bad tag' },
    { releaseTag: 'v1.0.0' },
    { previousTag: releaseTag },
    { previousTag: 'missing-release' },
    { previousTag: 'future-release' },
    { previousTag: 'unrelated-release' },
    { previousTag: undefined },
  ]) {
    assert.throws(() => notes(options))
  }
})

test('automatic history fails on a shallow checkout instead of silently claiming a first release', () => {
  const shallow = path.join(temporaryRoot, 'shallow')
  const cloned = run('git', ['clone', '-q', '--depth=1', pathToFileURL(cwd).href, shallow])
  assert.equal(cloned.status, 0, 'Local shallow fixture clone must succeed')
  assert.throws(
    () =>
      resolveReleaseContext({
        cwd: shallow,
        releaseTag: 'preview',
        sourceCommit: futureCommit,
        publishedTags: ['v1.0.0'],
      }),
    /full checkout/,
  )
})

test('unverified plans, missing files, duplicate names and source-version mismatches fail closed', () => {
  const build = 'ubuntu-latest-x64-snap'
  const mutations = [
    manifest => {
      delete manifest.schemaVersion
    },
    manifest => {
      manifest.version = '0.0.0'
    },
    manifest => {
      manifest.binaries = []
    },
    manifest => {
      manifest.binaries.push(manifest.binaries[0])
    },
    manifest => {
      manifest.binaries[0].name = manifest.binaries[0].name.replace('PicList-', 'Piclist-')
    },
    manifest => {
      manifest.binaries[0].size = 0
    },
    manifest => {
      delete manifest.binaries[0].sha512
    },
  ]
  for (const mutate of mutations) {
    const manifest = verifiedManifest(build)
    mutate(manifest)
    assert.throws(() => notes({ manifest }), /manifest|binary/i)
  }
  assert.throws(() => notes({ manifest: selectManifest(build) }), /verified artifact manifest/)
})

test('shared filename configuration can describe the source version independently of the checkout version', () => {
  const files = selectFiles('ubuntu-latest-x64-deb', '1.2.3')
  assert.equal(files[0].name, 'PicList-1.2.3-amd64.deb')
  assert.equal(selectFiles('ubuntu-latest-x64-deb')[0].name, `PicList-${version}-amd64.deb`)
})

test('validation exports a manifest consumed by the notes CLI; missing artifacts cannot export one', () => {
  const build = 'windows-latest-x64-zip'
  const binary = selectFiles(build)[0]
  const artifactDir = path.join(temporaryRoot, 'artifacts')
  const binaryPath = path.join(artifactDir, binary.path)
  mkdirSync(path.dirname(binaryPath), { recursive: true })
  writeFileSync(binaryPath, payload)
  const manifestFile = path.join(temporaryRoot, 'verified manifest.json')
  const validateArgs = [
    path.join(project, 'scripts/upload-to-s3.js'),
    'validate',
    artifactDir,
    path.join(temporaryRoot, 'no-metadata'),
    '--build',
    build,
    '--manifest-output',
    manifestFile,
  ]
  const validated = run(process.execPath, validateArgs)
  assert.equal(validated.status, 0, 'Local artifact validation must succeed')
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  assert.deepEqual(manifest, verifiedManifest(build))
  const output = path.join(temporaryRoot, 'release notes.md')
  const cliArgs = [
    path.join(project, 'scripts/generate-release-notes.js'),
    '--release-tag',
    'preview',
    '--source-commit',
    sourceCommit,
    '--previous-tag',
    'v2.0.0',
    '--manifest',
    manifestFile,
    '--repository',
    repository,
    '--output',
    output,
  ]
  const generated = run(process.execPath, cliArgs)
  assert.equal(generated.status, 0, 'Release notes CLI must consume the validated manifest')
  const body = readFileSync(output, 'utf8')
  assert.deepEqual(assetUrls(body), [`https://github.com/${repository}/releases/download/preview/${binary.name}`])
  assert.ok(body.includes(`/compare/v2.0.0...${sourceCommit}`))

  unlinkSync(binaryPath)
  const missingOutput = path.join(temporaryRoot, 'missing-manifest.json')
  const failed = run(process.execPath, [...validateArgs.slice(0, -1), missingOutput])
  assert.equal(failed.status, 1)
  assert.equal(existsSync(missingOutput), false)
})

test('CLI consumes a published tag list and does not log malformed manifest contents', () => {
  const manifest = path.join(temporaryRoot, 'cli-manifest.json')
  const published = path.join(temporaryRoot, 'published-tags.txt')
  const output = path.join(temporaryRoot, 'cli-notes.md')
  writeFileSync(manifest, JSON.stringify(verifiedManifest('ubuntu-latest-x64-snap')))
  writeFileSync(published, `v1.0.0\r\nv2.0.0\r\n${releaseTag}\r\nfuture-release\r\n`)
  const args = [
    path.join(project, 'scripts/generate-release-notes.js'),
    '--release-tag',
    releaseTag,
    '--source-commit',
    sourceCommit,
    '--published-tags-file',
    published,
    '--manifest',
    manifest,
    '--repository',
    repository,
    '--output',
    output,
  ]
  assert.equal(run(process.execPath, args).status, 0)
  assert.ok(readFileSync(output, 'utf8').includes(`/compare/v2.0.0...${sourceCommit}`))
  const privateMarker = 'SYNTHETIC_PRIVATE_CONTENT_DO_NOT_LOG'
  writeFileSync(manifest, privateMarker)
  const failed = run(process.execPath, args)
  assert.equal(failed.status, 1)
  assert.ok(!(failed.stdout + failed.stderr).includes(privateMarker))
})

test('workflow validates before generating notes and publishes with the same tag and commit', () => {
  const workflow = YAML.parse(readFileSync(path.join(project, '.github/workflows/buid_arch.yml'), 'utf8'))
  const steps = workflow.jobs['combine-and-upload'].steps
  const validation = steps.findIndex(step => step.id === 'manifest')
  const generation = steps.findIndex(step => step.id === 'release-notes')
  const publication = steps.findIndex(step => step.name === 'Publish GitHub release')
  assert.ok(validation < generation && generation < publication)
  assert.match(steps[validation].run, /--manifest-output \.\/verified-release-manifest\.json/)
  assert.match(steps[generation].run, /--manifest \.\/verified-release-manifest\.json/)
  assert.match(steps[generation].run, /--source-commit "\$GITHUB_SHA"/)
  assert.equal(steps[publication].with.tag_name, '${{ steps.release-notes.outputs.tag }}')
  assert.equal(steps[publication].with.target_commitish, '${{ github.sha }}')
  assert.equal(steps[0].with.ref, '${{ github.sha }}')
  assert.equal(steps[0].with['fetch-depth'], 0)
})
