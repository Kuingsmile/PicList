const fs = require('node:fs/promises')
const path = require('node:path')

async function main(context) {
  const { appOutDir, electronPlatformName } = context

  // electron-builder awaits win/linux electronLanguages cleanup before this hook.
  // macOS keeps its existing .lproj locales and has no top-level locales directory.
  // All targets share appOutDir. Portable markers belong only in the final archives,
  // otherwise NSIS can capture one while building alongside ZIP/7z.
  if (electronPlatformName === 'win32') {
    await fs.rm(path.join(appOutDir, 'PORTABLE'), { force: true })
  }
}

exports.default = main
