const fs = require('node:fs/promises')
const path = require('node:path')

async function main(context) {
  const { appOutDir, electronPlatformName } = context

  // All targets share appOutDir. Portable markers belong only in the final archives,
  // otherwise NSIS can capture one while building alongside ZIP/7z.
  if (electronPlatformName === 'win32') {
    await fs.rm(path.join(appOutDir, 'PORTABLE'), { force: true })
  }

  const localeDir = path.join(appOutDir, 'locales')
  const files = await fs.readdir(localeDir).catch(err => {
    if (err.code === 'ENOENT') return []
    throw err
  })
  await Promise.all(
    files
      .filter(file => !(file.startsWith('en') || file.startsWith('zh')))
      .map(file => fs.unlink(path.join(localeDir, file))),
  )
}

exports.default = main
