import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export type DownloadConflictPolicy = 'overwrite' | 'rename' | 'skip'

export interface DownloadDestination {
  readonly root: string
  readonly relativePath: string
  readonly policy: DownloadConflictPolicy
}

export type DownloadTransfer = (partPath: string, createWriteStream: () => fs.WriteStream) => Promise<unknown>

export class DownloadPathError extends Error {}

const isWithin = (root: string, destination: string): boolean => {
  const relative = path.relative(root, destination)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

/** Remote names are paths, never URLs: in particular, do not percent-decode them. */
export function resolveDownloadPath(root: string, remotePath: string): string {
  if (typeof root !== 'string' || !path.isAbsolute(root) || root.includes('\0')) {
    throw new DownloadPathError('The download directory must be an absolute path')
  }
  if (
    typeof remotePath !== 'string' ||
    !remotePath ||
    path.posix.isAbsolute(remotePath) ||
    path.win32.isAbsolute(remotePath)
  ) {
    throw new DownloadPathError('The download name must be a relative file path')
  }
  const segments = remotePath.split(/[\\/]/)
  for (const segment of segments) {
    // Apply the same portable rules on every OS, including Windows devices and ADS.
    const deviceName = segment.split('.')[0].trimEnd()
    if (
      !segment ||
      segment === '.' ||
      segment === '..' ||
      /[<>:"|?*\x00-\x1f\x7f]/.test(segment) ||
      /[. ]$/.test(segment) ||
      /^(?:con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])$/i.test(deviceName)
    ) {
      throw new DownloadPathError('The download name contains an unsafe or reserved path component')
    }
  }
  const destination = path.resolve(root, ...segments)
  if (!isWithin(path.resolve(root), destination)) {
    throw new DownloadPathError('The download path must stay inside the download directory')
  }
  return destination
}

export function createDownloadDestination(
  root: string,
  remotePath: string,
  policy: DownloadConflictPolicy,
): DownloadDestination {
  resolveDownloadPath(root, remotePath)
  if (!['overwrite', 'rename', 'skip'].includes(policy)) {
    throw new DownloadPathError('Unknown download conflict policy')
  }
  return Object.freeze({ root: path.resolve(root), relativePath: remotePath, policy })
}

const statIfPresent = (filePath: string): fs.Stats | undefined => {
  try {
    return fs.lstatSync(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    return undefined
  }
}

const sameFile = (a: fs.Stats, b: fs.Stats): boolean => a.dev === b.dev && a.ino === b.ino

const checkFile = (filePath: string): fs.Stats | undefined => {
  const stat = statIfPresent(filePath)
  if (stat && (!stat.isFile() || stat.isSymbolicLink())) {
    throw new DownloadPathError('A download destination must be a regular file, not a link or directory')
  }
  return stat
}

/**
 * Only the user-selected root may resolve through a symlink. Descendants must be
 * real directories. Check each component before creating the next one, and pin
 * their identities so a changed directory cannot redirect commit or cleanup.
 */
function prepareDirectory(destination: DownloadDestination) {
  fs.mkdirSync(destination.root, { recursive: true })
  const root = fs.realpathSync.native(destination.root)
  const requestedPath = resolveDownloadPath(root, destination.relativePath)
  const directories = [{ path: root, stat: fs.lstatSync(root) }]
  let directory = root
  for (const segment of path.relative(root, path.dirname(requestedPath)).split(path.sep).filter(Boolean)) {
    directory = path.join(directory, segment)
    let stat = statIfPresent(directory)
    if (!stat) {
      fs.mkdirSync(directory)
      stat = fs.lstatSync(directory)
    }
    const canonical = fs.realpathSync.native(directory)
    if (stat.isSymbolicLink() || !stat.isDirectory() || !isWithin(root, canonical)) {
      throw new DownloadPathError('The download directory contains a link or an unsafe path component')
    }
    directory = canonical
    directories.push({ path: directory, stat })
  }

  const checkDirectories = () => {
    if (fs.realpathSync.native(destination.root) !== root) {
      throw new DownloadPathError('The download directory changed during the transfer')
    }
    for (const entry of directories) {
      const stat = fs.lstatSync(entry.path)
      if (
        stat.isSymbolicLink() ||
        !stat.isDirectory() ||
        !sameFile(stat, entry.stat) ||
        fs.realpathSync.native(entry.path) !== entry.path
      ) {
        throw new DownloadPathError('The download directory changed during the transfer')
      }
    }
  }
  checkDirectories()
  return { filePath: path.join(directory, path.basename(requestedPath)), checkDirectories }
}

/**
 * Transfer implementations must close their writers before resolving. They only
 * receive a unique, exclusively-created .part sibling, never the final path.
 * Filesystem checks and publication are synchronous to avoid yielding between
 * validation and commit. Node has no portable directory-relative rename API.
 */
export async function downloadToFile(
  destination: DownloadDestination,
  transfer: DownloadTransfer,
): Promise<{ filePath: string; skipped: boolean }> {
  // Validate again at the write boundary, even for callers not using the factory.
  createDownloadDestination(destination.root, destination.relativePath, destination.policy)
  const { filePath, checkDirectories } = prepareDirectory(destination)
  const existing = checkFile(filePath)
  if (existing && destination.policy === 'skip') return { filePath, skipped: true }

  const partPath = path.join(path.dirname(filePath), `.piclist-${randomUUID()}.part`)
  const fd = fs.openSync(partPath, 'wx', 0o600)
  const partStat = fs.fstatSync(fd)
  fs.closeSync(fd)
  const createWriteStream = () => {
    checkDirectories()
    checkFile(partPath)
    // Open without truncation, verify the handle and its parents, then truncate.
    // This also prevents retries from following a replaced .part into another file.
    const fd = fs.openSync(partPath, 'r+')
    try {
      checkDirectories()
      const stat = fs.fstatSync(fd)
      if (!stat.isFile() || !sameFile(stat, partStat) || stat.nlink !== 1) {
        throw new DownloadPathError('The temporary download file changed during the transfer')
      }
      fs.ftruncateSync(fd, 0)
      return fs.createWriteStream(partPath, { fd, start: 0, autoClose: true })
    } catch (error) {
      fs.closeSync(fd)
      throw error
    }
  }
  try {
    checkDirectories()
    await transfer(partPath, createWriteStream)
    checkDirectories()
    const completed = checkFile(partPath)
    if (!completed || !sameFile(completed, partStat) || completed.nlink !== 1) {
      throw new DownloadPathError('The temporary download file changed during the transfer')
    }
    if (destination.policy === 'overwrite') {
      checkFile(filePath)
      // Never unlink the old destination first, even if replacement is denied.
      fs.renameSync(partPath, filePath)
      return { filePath, skipped: false }
    }

    const { dir, name, ext } = path.parse(filePath)
    for (let suffix = 0; ; suffix++) {
      const candidate = suffix === 0 ? filePath : path.join(dir, `${name} (${suffix})${ext}`)
      checkDirectories()
      checkFile(candidate)
      try {
        // link publishes a complete file atomically, failing if another transfer
        // or process claimed the name. An exists-then-rename check would clobber it.
        fs.linkSync(partPath, candidate)
        return { filePath: candidate, skipped: false }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
        checkFile(candidate)
        if (destination.policy === 'skip') return { filePath: candidate, skipped: true }
      }
    }
  } finally {
    // Only unlink our own partial file. On a replaced parent, leave it alone:
    // following the new path during cleanup could delete someone else's file.
    try {
      checkDirectories()
      const stat = statIfPresent(partPath)
      if (stat?.isFile() && sameFile(stat, partStat)) fs.unlinkSync(partPath)
    } catch {
      // Cleanup failure must not change a successful commit or mask transfer errors.
    }
  }
}
