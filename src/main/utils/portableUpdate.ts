import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, lstat, open, readdir, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { type Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import semver from 'semver'

export interface PortableUpdate {
  version: string
  file: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function portableVersion(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid portable update version')
  const version = value.replace(/^v/, '')
  const parsed = semver.parse(version)
  // Preserve build metadata for asset names, but reject loose versions and whitespace.
  if (!parsed || version !== parsed.version + (parsed.build.length ? `+${parsed.build.join('.')}` : '')) {
    throw new Error('Invalid portable update version')
  }
  return version
}

export function isNewerPortableVersion(current: unknown, candidate: unknown): boolean {
  const installed = portableVersion(current)
  const available = portableVersion(candidate)
  // Stable installations stay on stable. Prerelease installations opt into both
  // channels, but all transitions (including graduation to stable) must be upgrades.
  return (
    semver.gt(available, installed) && (semver.prerelease(installed) !== null || semver.prerelease(available) === null)
  )
}

export function portableArchitecture(platform: string, arch: string): 'x64' | 'arm64' {
  if (platform !== 'win32' || (arch !== 'x64' && arch !== 'arm64')) {
    throw new Error('Portable updates only support Windows x64 and arm64')
  }
  return arch
}

export function selectPortableUpdate(
  metadata: unknown,
  current: unknown,
  platform: string,
  arch: string,
): PortableUpdate | undefined {
  const architecture = portableArchitecture(platform, arch)
  if (!isRecord(metadata)) throw new Error('Invalid portable release metadata')
  const version = portableVersion(metadata.version)
  if (!isNewerPortableVersion(current, version)) return undefined
  return { version, file: `PicList-Setup-${version}-${architecture}-portable.7z` }
}

export function validatePortableAsset(release: unknown, update: PortableUpdate): { sha256: string; size: number } {
  if (
    !isRecord(release) ||
    release.draft !== false ||
    portableVersion(release.tag_name) !== update.version ||
    release.prerelease !== (semver.prerelease(update.version) !== null) ||
    !Array.isArray(release.assets)
  ) {
    throw new Error('Invalid portable release metadata')
  }
  const matches = release.assets.filter(asset => isRecord(asset) && asset.name === update.file)
  const asset = matches[0]
  if (matches.length !== 1 || !isRecord(asset) || asset.state !== 'uploaded') {
    throw new Error('No unique uploaded portable update asset found')
  }
  const digest = typeof asset.digest === 'string' && /^sha256:([a-fA-F0-9]{64})$/.exec(asset.digest)
  if (!digest || typeof asset.size !== 'number' || !Number.isSafeInteger(asset.size) || asset.size <= 0) {
    throw new Error('Invalid portable update digest or size')
  }
  return { sha256: digest[1].toLowerCase(), size: asset.size }
}

/** Write with backpressure, hashing the same bytes that go to disk. Only promote verified archives. */
export async function downloadPortableArchive(
  source: Readable,
  destination: string,
  expected: { sha256: string; size: number },
  onProgress: (percent: number) => void,
): Promise<void> {
  const temporary = `${destination}.part`
  let file: Awaited<ReturnType<typeof open>> | undefined
  // A network error may arrive while the destination is being opened, before
  // pipeline has attached its error listeners. Pipeline still observes errored streams.
  const sourceErrorHandler = () => {}
  source.on('error', sourceErrorHandler)
  try {
    file = await open(temporary, 'wx')
    const hash = createHash('sha256')
    let received = 0
    let lastPercent = -1
    await pipeline(
      source,
      new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          try {
            received += chunk.length
            if (received > expected.size) {
              callback(new Error('Portable archive exceeds its expected size'))
              return
            }
            hash.update(chunk)
            const percent = Math.min(99, Math.floor((received / expected.size) * 100))
            if (percent !== lastPercent) {
              lastPercent = percent
              onProgress(percent)
            }
            callback(null, chunk)
          } catch (error) {
            callback(error as Error)
          }
        },
      }),
      file.createWriteStream(),
    )
    if (received !== expected.size || hash.digest('hex') !== expected.sha256) {
      throw new Error('Portable archive failed digest or size verification')
    }
    await rename(temporary, destination)
    onProgress(100)
  } catch (error) {
    source.destroy()
    throw error
  } finally {
    source.removeListener('error', sourceErrorHandler)
    if (file) {
      await file.close()
      await rm(temporary, { force: true })
    }
  }
}

export async function extractPortableArchive(extractor: string, archive: string, destination: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(extractor, ['x', '-y', `-o${destination}`, archive], {
      shell: false,
      windowsHide: true,
      stdio: 'ignore',
    })
    child.once('error', reject)
    child.once('close', code => {
      if (code === 0) resolve()
      else reject(new Error('Portable archive extraction failed'))
    })
  })
}

export async function validatePortablePayload(directory: string, executableName: string): Promise<void> {
  const visit = async (root: string): Promise<void> => {
    for (const name of await readdir(root)) {
      const entry = await lstat(path.join(root, name))
      if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) {
        throw new Error('Portable archive contains unsupported entries')
      }
      if (entry.isDirectory()) await visit(path.join(root, name))
    }
  }
  await visit(directory)
  if ((await readdir(directory)).some(name => name.toLowerCase() === 'data')) {
    throw new Error('Portable archive must not replace user data')
  }
  for (const name of [executableName, 'resources/app.asar', 'PORTABLE']) {
    if (!(await lstat(path.join(directory, name))).isFile()) {
      throw new Error('Portable archive is missing required application files')
    }
  }
}

/** Do not quit the app until the installer has validated its inputs and is waiting for us. */
export async function startPortableInstaller(stage: string): Promise<void> {
  const child = spawn(
    path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/cmd.exe'),
    [
      '/d',
      '/v:off',
      '/s',
      '/c',
      // This command is constant: no release names or user paths enter cmd syntax.
      // START gives PowerShell a hidden console; directly detaching PowerShell
      // makes it exit before running the script. The detached launcher survives quit.
      'start "" /wait "%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File install.ps1',
    ],
    { detached: true, shell: false, windowsHide: true, windowsVerbatimArguments: true, stdio: 'ignore', cwd: stage },
  )
  await new Promise<void>((resolve, reject) => {
    let checking = false
    let stopped = false
    const timer = setInterval(async () => {
      if (checking || stopped) return
      checking = true
      try {
        await access(path.join(stage, 'ready'))
        if (stopped) return
        cleanup()
        child.unref()
        resolve()
      } catch {
        // The helper writes this only after all preflight checks succeed.
      } finally {
        checking = false
      }
    }, 100)
    const timeout = setTimeout(() => {
      stopped = true
      clearInterval(timer)
      child.kill()
      // Wait for close before the caller removes files that the helper may be using.
    }, 15_000)
    const cleanup = () => {
      stopped = true
      clearInterval(timer)
      clearTimeout(timeout)
      child.removeListener('error', fail)
      child.removeListener('close', closed)
    }
    const fail = () => {
      cleanup()
      reject(new Error('Could not start the portable update installer'))
    }
    const closed = () => fail()
    child.once('error', fail)
    child.once('close', closed)
  })
}
