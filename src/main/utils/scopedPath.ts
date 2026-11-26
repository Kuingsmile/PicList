import { lstat, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

function relativeToBase(paths: typeof path.posix, base: string, target: string, allowBase: boolean) {
  const relative = paths.relative(base, target)
  if (
    (!relative && !allowBase) ||
    relative === '..' ||
    relative.startsWith('..' + paths.sep) ||
    paths.isAbsolute(relative)
  ) {
    throw new Error('Path is outside the configured directory or targets the directory itself')
  }
  return relative
}

export function scopedRemotePath(base: string, key: string, allowBase = false): string {
  if (!base || typeof key !== 'string' || (!key && !allowBase) || key.includes('\0') || key.split('/').includes('..')) {
    throw new Error('Invalid remote path')
  }
  const target = path.posix.resolve('/', key)
  relativeToBase(path.posix, path.posix.resolve('/', base), target, allowBase)
  return target
}

/** The configured base may be a mounted or linked directory. Reject links below it, including dangling links. */
export async function scopedLocalPath(base: string, target: string, allowBase = false): Promise<string> {
  if (!base || !target || !path.isAbsolute(base) || !path.isAbsolute(target) || target.includes('\0')) {
    throw new Error('Expected an absolute local path and configured directory')
  }
  const root = path.resolve(base)
  const resolved = path.resolve(target)
  const relative = relativeToBase(path, root, resolved, allowBase)
  let current = root
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    if (
      process.platform === 'win32' &&
      (/[. ]$|[:<>|?*"]/.test(segment) ||
        /^(con(in\$|out\$)?|prn|aux|nul|clock\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(segment))
    ) {
      throw new Error('Invalid Windows path component')
    }
    current = path.join(current, segment)
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error('Unexpected link in local path')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  return current
}

export async function unlinkScopedLocalFile(base: string, target: string): Promise<void> {
  const file = await scopedLocalPath(base, target)
  try {
    if (!(await lstat(file)).isFile()) throw new Error('Expected a regular file')
    await unlink(file)
  } catch (error) {
    // A previous delete may have finished before its acknowledgement. Verify the base is still accessible.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || !(await stat(base)).isDirectory()) throw error
  }
}
