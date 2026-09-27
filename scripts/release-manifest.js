import { randomUUID } from 'node:crypto'
import { appendFile, lstat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { selectManifest } from './config.js'

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

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      build: { type: 'string', default: 'All' },
      'github-output': { type: 'string' },
    },
  })
  const [mode, buildDir = './dist_electron'] = positionals
  if (!['plan', 'check-build'].includes(mode) || positionals.length > 2) {
    throw new Error('Choose plan or check-build with an optional build directory')
  }
  const manifest = selectManifest(values.build)
  const outputs = {
    has_metadata: String(manifest.metadata.length > 0),
    expected_manifest: JSON.stringify(manifest),
  }
  if (mode === 'check-build') {
    const { files, metadataFiles } = await validateBuildArtifacts(buildDir, values.build)
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
