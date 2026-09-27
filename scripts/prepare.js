import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

import AdmZip from 'adm-zip'
import axios from 'axios'

const root = fileURLToPath(new URL('..', import.meta.url))
const resourcesDir = path.join(root, 'resources')
const downloadTimeout = 120_000

export async function downloadFile(url, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true })
  const temporaryPath = `${targetPath}.${randomUUID()}.tmp`

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(downloadTimeout) })
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(`Download failed for ${path.basename(targetPath)} (${response.status} ${response.statusText})`)
    }
    if (!response.body) throw new Error(`Empty download for ${path.basename(targetPath)}`)

    await pipeline(Readable.fromWeb(response.body), createWriteStream(temporaryPath, { flags: 'wx' }))
    if ((await stat(temporaryPath)).size === 0) throw new Error(`Empty download for ${path.basename(targetPath)}`)
    await rename(temporaryPath, targetPath)
    console.log(`[INFO]: download finished ${path.basename(targetPath)}`)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}

async function resolve7zip() {
  const url = `https://github.com/develar/7zip-bin/raw/master/win/${process.arch}/7za.exe`
  await downloadFile(url, path.join(resourcesDir, '7za.exe'))
  console.log('[INFO]: 7za.exe finished')
  return true
}

async function fetchThemes() {
  try {
    const zipUrl = 'https://github.com/Kuingsmile/piclist-themeHub/releases/download/latest/themes.zip'
    const { data } = await axios.get(zipUrl, { responseType: 'arraybuffer', timeout: downloadTimeout })
    new AdmZip(data).extractAllTo(path.join(resourcesDir, 'theme'), true)
    console.log('[INFO]: themes downloaded and extracted')
    return true
  } catch (error) {
    console.warn('[WARN]: failed to download themes', error)
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  const type = args.find(arg => arg.startsWith('--type='))?.slice('--type='.length)
  const all = args.includes('--all')
  const tasks = []

  if (type === '7zip' || all) {
    console.log('[INFO]: Resolving 7zip...')
    tasks.push(resolve7zip())
  }

  if (type === 'themes' || all) {
    console.log('[INFO]: Resolving themes...')
    tasks.push(fetchThemes())
  }

  if (tasks.length === 0) {
    console.error('Usage: node scripts/prepare.js --type=7zip|themes or --all')
    process.exitCode = 1
    return
  }

  const results = await Promise.all(tasks)
  if (results.every(Boolean)) console.log('Selected resources have been resolved.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Error:', error)
    process.exitCode = 1
  })
}
