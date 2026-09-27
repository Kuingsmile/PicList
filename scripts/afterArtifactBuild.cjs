const fs = require('node:fs/promises')
const path = require('node:path')

const { compute7zCompressArgs } = require('app-builder-lib/out/targets/archive')
const { getPath7za } = require('app-builder-lib/out/toolsets/7zip')
const { exec } = require('builder-util')

async function main({ file, target, packager }) {
  // Check the target, not the extension: NSIS also creates internal .7z payloads.
  if (packager.platform.nodeName !== 'win32' || !['zip', '7z'].includes(target?.name)) return

  const stagingDir = await packager.info.tempDirManager.createTempDir({ prefix: 'portable-marker' })
  await fs.writeFile(path.join(stagingDir, 'PORTABLE'), '')

  // electron-builder awaits this hook before announcing/publishing the artifact.
  // Update only this archive, never the appOutDir concurrently read by other targets.
  const args = compute7zCompressArgs(target.name, { compression: packager.compression })
  args.push(file, 'PORTABLE')
  await exec(await getPath7za(), args, { cwd: stagingDir })
}

exports.default = main
