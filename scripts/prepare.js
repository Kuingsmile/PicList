import { execSync } from 'node:child_process'
import fs from 'fs-extra'
import path from 'node:path'
import axios from 'axios'
import AdmZip from 'adm-zip'

const cwd = process.cwd()
let arch = process.arch
const platform = process.platform

const args = process.argv.slice(2)
const params = Object.fromEntries(
  args.map(arg => {
    const [key, value] = arg.replace(/^--/, '').split('=')
    return [key, value || true]
  }),
)

const resolve7zip = () =>
  resolveResource({
    file: '7za.exe',
    downloadURL: `https://github.com/develar/7zip-bin/raw/master/win/${arch}/7za.exe`,
  })

async function fetchThemes() {
  try {
    const zipUrl = 'https://github.com/Kuingsmile/piclist-themeHub/releases/download/latest/themes.zip'
    const zipData = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    const zip = new AdmZip(zipData.data)
    zip.extractAllTo(path.join(cwd, 'resources', 'theme'), true)
    console.log('[INFO]: themes downloaded and extracted')
    return true
  } catch (e) {
    console.log('[WARN]: failed to download themes', e)
    return false
  }
}

async function downloadFile(url, path) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/octet-stream' },
  })
  const buffer = await response.arrayBuffer()
  fs.writeFileSync(path, new Uint8Array(buffer))

  console.log(`[INFO]: download finished "${url}"`)
}

async function resolveResource(binInfo) {
  const { file, downloadURL, needExecutable = false } = binInfo

  const resDir = path.join(cwd, 'resources')
  const targetPath = path.join(resDir, file)

  if (fs.existsSync(targetPath)) {
    fs.removeSync(targetPath)
  }

  fs.mkdirSync(resDir, { recursive: true })
  await downloadFile(downloadURL, targetPath)

  if (needExecutable && platform !== 'win32') {
    execSync(`chmod 755 ${targetPath}`)
    console.log(`[INFO]: ${file} chmod finished`)
  }

  console.log(`[INFO]: ${file} finished`)
}

async function main() {
  const tasks = []

  if (params.type === '7zip' || params.all) {
    console.log('[INFO]: Resolving 7zip...')
    tasks.push(resolve7zip())
  }

  if (params.type === 'themes' || params.all) {
    console.log('[INFO]: Resolving themes...')
    tasks.push(fetchThemes())
  }

  if (tasks.length === 0) {
    console.log('请提供参数，例如: node script.js --type=7zip 或 --all')
    return
  }

  try {
    await Promise.all(tasks)
    console.log('Selected resources have been resolved.')
  } catch (err) {
    console.error('Error:', err)
  }
}

main()
