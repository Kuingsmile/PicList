import { copyFile, cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import pkg from '../package.json' with { type: 'json' }

export async function prepareReleaseDependencies(directory) {
  // pnpm's frozen importer must match the complete dependency manifest, unlike
  // Yarn's shared lockfile. Keep it intact and skip all install hooks in CI.
  const manifest = {
    name: 'piclist-release-tools',
    version: '1.0.0',
    private: true,
    packageManager: pkg.packageManager,
    engines: pkg.engines,
    dependencies: pkg.dependencies,
    devDependencies: pkg.devDependencies,
  }
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  for (const file of ['pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
    await copyFile(new URL(`../${file}`, import.meta.url), path.join(directory, file))
  }
  await cp(new URL('../patches/', import.meta.url), path.join(directory, 'patches'), { recursive: true })
  return manifest
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) {
    console.error('Provide the temporary release dependency directory')
    process.exitCode = 1
  } else {
    prepareReleaseDependencies(process.argv[2]).catch(() => {
      console.error('Could not prepare the isolated release dependencies')
      process.exitCode = 1
    })
  }
}
