import { cp, readdir, readlink, realpath } from 'node:fs/promises'
import path from 'node:path'

function isWithin(directory, target) {
  const relative = path.relative(directory, target)
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

export async function copyNpmRuntime(source, destination) {
  await cp(source, destination, {
    recursive: true,
    // Preserve package-owned relative links for relocation and macOS signing.
    verbatimSymlinks: true,
    // Yarn generates these links/shims against hoisted dependencies outside npm.
    // They are build-machine artifacts, not part of npm's standalone runtime.
    // Keep npm/bin and node-gyp-bin; PicList supplies its own public launchers.
    filter: file => path.basename(file) !== '.bin' || path.basename(path.dirname(file)) !== 'node_modules',
  })
  const root = await realpath(destination)

  // Extra resources live outside app.asar. Every link must still work after the
  // application is moved off the build machine.
  async function validate(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isSymbolicLink()) {
        const target = await readlink(file)
        let resolved
        try {
          resolved = await realpath(file)
        } catch {
          throw new Error(`Broken bundled npm symlink: ${path.relative(root, file)}`)
        }
        if (path.isAbsolute(target) || !isWithin(root, resolved)) {
          throw new Error(`Non-portable bundled npm symlink: ${path.relative(root, file)}`)
        }
      } else if (entry.isDirectory()) {
        await validate(file)
      }
    }
  }

  await validate(root)
}
