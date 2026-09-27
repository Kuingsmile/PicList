import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import pkg from '../package.json' with { type: 'json' }

// Only the metadata, publication and release-test utilities run in this job.
// Reuse the application's declared ranges and lockfile so they cannot drift.
const packages = [
  '@aws-sdk/client-s3',
  '@aws-sdk/lib-storage',
  '@smithy/node-http-handler',
  'dotenv',
  'js-yaml',
  'semver',
  'yaml',
]

export async function prepareReleaseDependencies(directory) {
  const dependencies = Object.fromEntries(
    packages.map(name => {
      const version = pkg.dependencies[name] ?? pkg.devDependencies[name]
      if (!version) throw new Error('A release utility dependency is missing from package.json')
      return [name, version]
    }),
  )
  const manifest = {
    name: 'piclist-release-tools',
    version: '1.0.0',
    private: true,
    dependencies,
    resolutions: Object.fromEntries(Object.entries(pkg.resolutions).filter(([name]) => packages.includes(name))),
  }
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await copyFile(new URL('../yarn.lock', import.meta.url), path.join(directory, 'yarn.lock'))
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
