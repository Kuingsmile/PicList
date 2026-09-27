import { randomUUID } from 'node:crypto'
import { appendFile, copyFile, lstat, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { selectManifest } from './config.js'

export function createBuildMatrix(build = 'All') {
  const { binaries } = selectManifest(build)
  const groups = new Map()
  for (const selection of new Set(binaries.map(file => file.build))) {
    const [, os, arch, format] = /^(.*)-(x64|arm64)-([^-]+)$/.exec(selection) ?? []
    if (!os) throw new Error('Invalid release build configuration')
    const key = `${os}-${arch}`
    if (!groups.has(key)) groups.set(key, { os, arch, formats: [], has_metadata: false })
    const group = groups.get(key)
    group.formats.push(format)
    group.has_metadata ||= selectManifest(selection).metadata.length > 0
  }
  return { include: [...groups.values()] }
}

async function checkFile(filePath, optional = false) {
  let stat
  try {
    stat = await lstat(filePath)
  } catch (error) {
    if (optional && error.code === 'ENOENT') return undefined
    throw new Error('A required build artifact is missing or unreadable', { cause: error })
  }
  if (!stat.isFile() || stat.size === 0) throw new Error('Build artifacts must be nonempty regular files')
  return filePath
}

export async function validateBuildArtifacts(buildDir, build) {
  if (build === 'All') throw new Error('Validate each matrix build before collecting the All release')
  const manifest = selectManifest(build)
  const files = []
  // Require every binary explicitly: a blockmap or another architecture must not
  // satisfy upload-artifact's "at least one file matched" check.
  for (const binary of manifest.binaries) {
    files.push(await checkFile(path.join(buildDir, binary.name)))
    const blockmap = await checkFile(path.join(buildDir, `${binary.name}.blockmap`), true)
    if (blockmap) files.push(blockmap)
  }
  const metadataFiles = []
  for (const metadata of manifest.metadata) {
    metadataFiles.push(await checkFile(path.join(buildDir, metadata.name)))
  }
  return { manifest, files, metadataFiles }
}

export async function stageBuildArtifacts(buildDir, build, stageDir) {
  // Snapshot each target before the next electron-builder invocation overwrites
  // shared updater filenames such as latest-linux.yml. Preserve the directories
  // expected by the existing release manifest inside each OS/architecture bundle.
  const result = await validateBuildArtifacts(buildDir, build)
  const copy = async (files, directory) => {
    if (!files.length) return []
    await mkdir(directory, { recursive: true })
    return Promise.all(
      files.map(async file => {
        const destination = path.join(directory, path.basename(file))
        await copyFile(file, destination)
        return destination
      }),
    )
  }
  return {
    manifest: result.manifest,
    files: await copy(result.files, path.join(stageDir, 'artifacts', `${build}-artifacts`)),
    metadataFiles: await copy(result.metadataFiles, path.join(stageDir, 'yml', `${build}-yml`)),
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      build: { type: 'string', default: 'All' },
      'github-output': { type: 'string' },
      'stage-dir': { type: 'string', default: './release' },
    },
  })
  const [mode, buildDir = './dist_electron'] = positionals
  if (!['plan', 'check-build', 'stage-build'].includes(mode) || positionals.length > 2) {
    throw new Error('Choose plan, check-build or stage-build with an optional build directory')
  }
  const manifest = selectManifest(values.build)
  const outputs = {
    has_metadata: String(manifest.metadata.length > 0),
    expected_manifest: JSON.stringify(manifest),
  }
  if (mode === 'plan') outputs.matrix = JSON.stringify(createBuildMatrix(values.build))
  if (mode === 'check-build' || mode === 'stage-build') {
    const { files, metadataFiles } =
      mode === 'stage-build'
        ? await stageBuildArtifacts(buildDir, values.build, values['stage-dir'])
        : await validateBuildArtifacts(buildDir, values.build)
    outputs.files = files.join('\n')
    outputs.metadata_files = metadataFiles.join('\n')
  }
  if (values['github-output']) {
    const delimiter = randomUUID()
    await appendFile(
      values['github-output'],
      Object.entries(outputs)
        .map(([key, value]) => `${key}<<${delimiter}\n${value}\n${delimiter}\n`)
        .join(''),
    )
  }
  console.log(`Expected ${manifest.binaries.length} binaries and ${manifest.metadata.length} updater manifests`)
  if (!manifest.metadata.length) {
    console.log('No updater metadata is expected: Windows ZIP/7z are portable; Snap uses store updates.')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(() => {
    // Never print parser errors or file contents in CI logs.
    console.error('Release artifact check failed: check the selection and required nonempty files')
    process.exitCode = 1
  })
}
