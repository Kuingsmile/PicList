import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { appConfigPath, themesDir } from '@core/datastore/dirs'
import fs from 'fs-extra'

import { copyBundledResources } from '~/utils/copyBundledResources'

const configPath = appConfigPath()
const CONFIG_DIR = path.dirname(configPath)
const dirname = path.dirname(fileURLToPath(import.meta.url))

async function beforeOpen() {
  await Promise.all([
    process.platform === 'darwin' ? resolveMacWorkFlow() : undefined,
    resolveClipboardImageGenerator(),
    resolveCss(),
  ])
}

/**
 * macOS 右键菜单
 */
async function resolveMacWorkFlow() {
  const source = path
    .join(dirname, '../../resources', 'Upload pictures with PicList.workflow')
    .replace('app.asar', 'app.asar.unpacked')
  const destination = path.join(os.homedir(), 'Library/Services/Upload pictures with PicList.workflow')
  try {
    if (await fs.pathExists(source)) await copyBundledResources(source, destination)
  } catch {
    console.error('Failed to prepare the macOS upload workflow')
  }
}

/**
 * 初始化剪贴板生成图片的脚本
 */
async function resolveClipboardImageGenerator() {
  const files = ['linux.sh', 'mac.applescript', 'windows.ps1', 'windows10.ps1', 'wsl.sh']
  await Promise.all(
    files.map(file =>
      copyBundledResources(
        path.join(dirname, '../../resources', file).replace('app.asar', 'app.asar.unpacked'),
        path.join(CONFIG_DIR, file),
      ),
    ),
  )
}

async function resolveCss() {
  try {
    const source = path.join(dirname, '../../resources/theme').replace('app.asar', 'app.asar.unpacked')
    await copyBundledResources(source, themesDir())
  } catch {
    console.error('Failed to prepare bundled themes')
  }
}

export default beforeOpen
