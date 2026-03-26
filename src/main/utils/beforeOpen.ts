import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { appConfigPath, themesDir } from '@core/datastore/dirs'
import fs from 'fs-extra'

const configPath = appConfigPath()
const CONFIG_DIR = path.dirname(configPath)
const dirname = path.dirname(fileURLToPath(import.meta.url))

function beforeOpen() {
  if (process.platform === 'darwin') {
    resolveMacWorkFlow()
  }
  resolveClipboardImageGenerator()
  resolveCss()
}

function copyFileOutsideOfElectronAsar(sourceInAsarArchive: string, destOutsideAsarArchive: string) {
  if (fs.existsSync(sourceInAsarArchive)) {
    // file will be copied
    if (fs.statSync(sourceInAsarArchive).isFile()) {
      const file = destOutsideAsarArchive
      const dir = path.dirname(file)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(file, fs.readFileSync(sourceInAsarArchive))
    } else if (fs.statSync(sourceInAsarArchive).isDirectory()) {
      fs.readdirSync(sourceInAsarArchive).forEach(function (fileOrFolderName) {
        copyFileOutsideOfElectronAsar(
          `${sourceInAsarArchive}/${fileOrFolderName}`,
          `${destOutsideAsarArchive}/${fileOrFolderName}`,
        )
      })
    }
  }
}

/**
 * macOS 右键菜单
 */
function resolveMacWorkFlow() {
  const dest = `${os.homedir()}/Library/Services/Upload pictures with PicList.workflow`
  try {
    copyFileOutsideOfElectronAsar(
      path
        .join(dirname, '../../resources', 'Upload pictures with PicList.workflow')
        .replace('app.asar', 'app.asar.unpacked'),
      dest,
    )
  } catch (e) {
    console.log(e)
  }
}

function diffFilesAndUpdate(filePath1: string, filePath2: string) {
  try {
    const file1 = fs.existsSync(filePath1) && fs.readFileSync(filePath1)
    const file2 = fs.existsSync(filePath1) && fs.readFileSync(filePath2)

    if (!file1 || !file2 || !file1.equals(file2)) {
      fs.copyFileSync(filePath1, filePath2)
    }
  } catch (e) {
    console.error(e)
    fs.copyFileSync(filePath1, filePath2)
  }
}

/**
 * 初始化剪贴板生成图片的脚本
 */
function resolveClipboardImageGenerator() {
  const clipboardFiles = getClipboardFiles()
  if (!fs.pathExistsSync(path.join(CONFIG_DIR, 'windows10.ps1'))) {
    clipboardFiles.forEach(item => {
      fs.copyFileSync(item.origin, item.dest)
    })
  } else {
    clipboardFiles.forEach(item => {
      diffFilesAndUpdate(item.origin, item.dest)
    })
  }
}

function getClipboardFiles() {
  const files = ['linux.sh', 'mac.applescript', 'windows.ps1', 'windows10.ps1', 'wsl.sh']

  return files.map(item => {
    return {
      origin: path.join(dirname, '../../resources', item).replace('app.asar', 'app.asar.unpacked'),
      dest: path.join(CONFIG_DIR, item),
    }
  })
}

function resolveCss() {
  try {
    const srcDir = path.join(dirname, '../../resources/theme').replace('app.asar', 'app.asar.unpacked')
    const destDir = themesDir()
    fs.copySync(srcDir, destDir, {
      overwrite: true,
      errorOnExist: false,
    })
  } catch (e) {
    console.error('Failed to resolve CSS:', e)
  }
}

export default beforeOpen
