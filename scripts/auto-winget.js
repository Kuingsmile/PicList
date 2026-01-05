import dotenv from 'dotenv'
import packagej from '../package.json' with { type: 'json' }
import * as fsWalk from '@nodelib/fs.walk'
import fs from 'fs-extra'
import path from 'node:path'
import yaml from 'yaml'
import axios from 'axios'
import { exec } from 'node:child_process'

dotenv.config()

const version = packagej.version
const walkPath = fsWalk.walkSync('.winget').slice(-1)[0]?.dirent.parentPath
const oldVersion = path.basename(walkPath)
const targetPath = path.resolve(`${path.dirname(walkPath)}/${version}`)
fs.renameSync(walkPath, targetPath)

const fileList = [
  path.join(targetPath, 'Kuingsmile.PicList.installer.yaml'),
  path.join(targetPath, 'Kuingsmile.PicList.locale.en-US.yaml'),
  path.join(targetPath, 'Kuingsmile.PicList.yaml'),
]

function relaceVersion(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  content = content.replaceAll(oldVersion, version)
  fs.writeFileSync(filePath, content, 'utf-8')
}

fileList.forEach(filePath => {
  relaceVersion(filePath)
})

const releaseAPI = 'https://api.github.com/repos/Kuingsmile/piclist/releases/latest'

const response = await axios.get(releaseAPI, {
  headers: {
    Accept: 'application/vnd.github+json',
  },
})

const releaseData = response.data

const fileNameList = [`PicList-Setup-${version}-arm64.exe`, `PicList-Setup-${version}.exe`]
const sha256List = []

fileNameList.forEach(fileName => {
  const asset = releaseData.assets.find(a => a.name === fileName)
  if (asset) {
    sha256List.push({
      fileName,
      sha256: asset.digest.replace('sha256:', '').toUpperCase(),
    })
  }
})

const insatllerContent = yaml.parseDocument(fs.readFileSync(fileList[0], 'utf-8'))
const installers = insatllerContent.get('Installers')
const updatedInstallers = installers.toJSON().map(installer => {
  const matched = sha256List.find(
    item => installer.Architecture === (item.fileName.includes('arm64') ? 'arm64' : 'x64'),
  )
  if (matched) {
    return {
      ...installer,
      InstallerSha256: matched.sha256,
    }
  }
  return installer
})
insatllerContent.set('Installers', updatedInstallers)
fs.writeFileSync(fileList[0], insatllerContent.toString(), 'utf-8')

const cmd = `wingetcreate.exe submit -p "PicList v${version}" -t "${process.env.GH_TOKEN}" .\\.winget\\manifests\\k\\Kuingsmile\\PicList\\${version}\\`

exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`Command stderr: ${stderr}`)
    return
  }
  console.log(`Command stdout: ${stdout}`)
})
