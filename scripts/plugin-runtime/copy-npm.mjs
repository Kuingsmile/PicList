import { cp, readdir, readlink, realpath } from 'node:fs/promises'
import path from 'node:path'

function isWithin(directory, target) {
  const relative = path.relative(directory, target)
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

export async function copyNpmRuntime(source, destination) {
  // fs.cp otherwise rewrites relative links as absolute source paths, which
  // breaks installed npm commands and macOS's strict code-signature check.
  await cp(source, destination, { recursive: true, verbatimSymlinks: true })
  const root = await realpath(destination)

  // Extra resources live outside app.asar. Every link must still work after the
  // application is moved off the build machine, including npm's nested .bin links.
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
