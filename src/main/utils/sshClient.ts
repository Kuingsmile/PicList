import { randomUUID } from 'node:crypto'
import path from 'node:path'
import type { Writable } from 'node:stream'
import { finished, pipeline } from 'node:stream/promises'

import type { Config, SSHExecCommandResponse } from 'node-ssh-no-cpu-features'
import { NodeSSH } from 'node-ssh-no-cpu-features'
import type { ISftpPlistConfig } from 'piclist/dist/types'
import type { FileEntry, Stats } from 'ssh2'

type SFTP = Awaited<ReturnType<NodeSSH['requestSFTP']>>
type FileOptions = Pick<ISftpPlistConfig, 'fileMode' | 'dirMode' | 'fileUser'>

export const quoteShellArgument = (value: string): string => {
  if (value.includes('\0')) throw new Error('SSH command arguments must not contain null bytes')
  return `'${value.replace(/'/g, "'\\''")}'`
}

const remotePath = (value: string): string => {
  if (!value || value.includes('\0')) throw new Error('SFTP paths must be nonempty and must not contain null bytes')
  // Remote paths are POSIX paths on every host; a backslash can be part of a filename.
  return path.posix.normalize(value)
}

const isMissing = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 2

class SSHClient {
  private client?: NodeSSH
  private connected = false
  private sftp?: Promise<SFTP>
  private readonly preparedDirectories = new Set<string>()
  private readonly pendingDirectoryModes = new Map<string, string>()

  async connect(config: ISftpPlistConfig): Promise<void> {
    this.close()
    const client = new NodeSSH()
    this.client = client
    const { username, password, privateKey, passphrase } = config
    const loginInfo: Config = privateKey
      ? { username, privateKeyPath: privateKey, passphrase: passphrase || undefined }
      : { username, password }
    try {
      await client.connect({ host: config.host, port: Number(config.port) || 22, ...loginInfo })
    } catch (error) {
      if (this.client === client) this.close()
      else client.dispose()
      throw error
    }
    // Key-file loading may finish after a listing was cancelled and its connection closed.
    if (this.client !== client) {
      client.dispose()
      throw new Error('SSH connection was closed while connecting')
    }
    this.connected = true
  }

  private requireClient(): NodeSSH {
    if (!this.isConnected) throw new Error('SSH client is not connected')
    return this.client!
  }

  /** All operations in a batch share one channel, including concurrent requests for it. */
  private async getSftp(): Promise<SFTP> {
    const client = this.requireClient()
    if (!this.sftp) {
      const pending = client.requestSFTP().then(
        sftp => {
          if (this.client !== client || this.sftp !== pending) {
            sftp.end()
            throw new Error('SSH connection was closed while opening SFTP')
          }
          const invalidate = () => {
            if (this.sftp === pending) {
              this.sftp = undefined
              this.clearDirectories()
            }
          }
          sftp.once('close', invalidate)
          sftp.once('end', invalidate)
          sftp.once('error', invalidate)
          return sftp
        },
        error => {
          if (this.sftp === pending) this.sftp = undefined
          throw error
        },
      )
      this.sftp = pending
    }
    const pending = this.sftp
    const sftp = await pending
    if (this.sftp !== pending) throw new Error('SFTP channel was closed')
    return sftp
  }

  async execCommand(script: string): Promise<SSHExecCommandResponse> {
    return this.requireClient().execCommand(script)
  }

  private async exec(script: string, operation: string): Promise<void> {
    const result = await this.execCommand(script)
    if (result.code !== 0) throw new Error(`${operation} failed (exit code: ${result.code ?? 'unavailable'})`)
  }

  async readDirectory(remote: string): Promise<FileEntry[]> {
    remote = remotePath(remote)
    const sftp = await this.getSftp()
    return new Promise((resolve, reject) => {
      sftp.readdir(remote, (error, entries) => (error ? reject(error) : resolve(entries)))
    })
  }

  /** Listing metadata must describe the link itself, never its target. */
  async lstat(remote: string): Promise<Stats> {
    remote = remotePath(remote).replace(/\/+$/, '') || '/'
    const sftp = await this.getSftp()
    return new Promise((resolve, reject) => {
      sftp.lstat(remote, (error, stats) => (error ? reject(error) : resolve(stats)))
    })
  }

  async getFile(local: string, remote: string): Promise<void> {
    remote = remotePath(remote)
    const sftp = await this.getSftp()
    await this.transfer(sftp, () => this.requireClient().getFile(local, remote, sftp, { concurrency: 1 }))
  }

  async getFileToStream(remote: string, createWriteStream: () => Writable): Promise<void> {
    remote = remotePath(remote)
    const sftp = await this.getSftp()
    const output = createWriteStream()
    let input: ReturnType<SFTP['createReadStream']> | undefined
    let completed: Promise<void> | undefined
    try {
      input = sftp.createReadStream(remote)
      completed = pipeline(input, output)
      await this.transfer(sftp, () => completed!)
    } finally {
      // Disconnection can win the transfer race before the streams settle.
      input?.destroy()
      output.destroy()
      await completed?.catch(() => {})
      await finished(output).catch(() => {})
    }
  }

  /** The SDK can wait for a handle-close response after disconnection; do not let that stall a batch. */
  private async transfer(sftp: SFTP, action: () => Promise<void>): Promise<void> {
    let onClose!: () => void
    let onError!: (error: Error) => void
    const interrupted = new Promise<never>((_resolve, reject) => {
      onClose = () => reject(new Error('SFTP channel closed during transfer'))
      onError = reject
      sftp.once('end', onClose)
      sftp.once('close', onClose)
      sftp.once('error', onError)
    })
    try {
      await Promise.race([interrupted, action()])
    } finally {
      sftp.removeListener('end', onClose)
      sftp.removeListener('close', onClose)
      sftp.removeListener('error', onError)
    }
  }

  /** Publish only complete uploads, with metadata applied before the destination is replaced. */
  async putFile(local: string, remote: string, config: FileOptions = {}): Promise<void> {
    remote = remotePath(remote)
    await this.mkdir(path.posix.dirname(remote), config)
    const sftp = await this.getSftp()
    const channel = this.sftp
    const stagedPath = path.posix.join(path.posix.dirname(remote), `.piclist-upload-${randomUUID()}.tmp`)
    let created = false
    try {
      const handle = await new Promise<Buffer>((resolve, reject) => {
        sftp.open(stagedPath, 'wx', (error, handle) => (error ? reject(error) : resolve(handle)))
      })
      created = true
      await new Promise<void>((resolve, reject) => {
        sftp.close(handle, error => (error ? reject(error) : resolve()))
      })
      await this.transfer(sftp, () => this.requireClient().putFile(local, stagedPath, sftp, { concurrency: 1 }))
      if (config.fileUser) await this.chown(stagedPath, config.fileUser)
      if (config.fileMode) await this.chmod(stagedPath, config.fileMode, 'Setting file permissions')
      await this.rename(sftp, stagedPath, remote)
    } catch (error) {
      if (created && this.isConnected && this.sftp === channel) {
        // Cleanup must never remove the destination or hide the original failure.
        // Closed channels cannot answer cleanup requests; the temporary file may remain.
        await new Promise<void>((resolve, reject) => {
          sftp.unlink(stagedPath, cause => (cause ? reject(cause) : resolve()))
        }).catch(() => {})
      }
      throw error
    }
  }

  private async rename(sftp: SFTP, source: string, destination: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        sftp.ext_openssh_rename(source, destination, error => (error ? reject(error) : resolve()))
      })
    } catch (error: any) {
      if (error.code !== 8 && error.message !== 'Server does not support this extended request') throw error
      if (await this.stat(sftp, destination, false)) {
        throw new Error('SFTP server does not support atomic replacement of existing files', { cause: error })
      }
      // Standard SFTP rename also rejects a destination created after the existence check.
      await new Promise<void>((resolve, reject) => {
        sftp.rename(source, destination, cause => (cause ? reject(cause) : resolve()))
      })
    }
  }

  async renameFile(source: string, destination: string): Promise<void> {
    source = remotePath(source)
    destination = remotePath(destination)
    const sftp = await this.getSftp()
    try {
      await this.rename(sftp, source, destination)
    } finally {
      this.clearDirectories()
    }
  }

  async deleteFile(remote: string, ignoreMissing = false): Promise<void> {
    remote = remotePath(remote)
    const sftp = await this.getSftp()
    await new Promise<void>((resolve, reject) => {
      sftp.unlink(remote, error => (error && !(ignoreMissing && isMissing(error)) ? reject(error) : resolve()))
    })
  }

  /** Remove a tree without following directory symlinks or invoking a remote shell. */
  async deleteDirectory(remote: string): Promise<void> {
    // A trailing slash can make lstat follow the final symbolic link on POSIX servers.
    remote = remotePath(remote).replace(/\/+$/, '') || '/'
    if (['/', '.', '..'].includes(remote) || path.posix.resolve('/', remote) === '/' || remote.includes('*')) {
      throw new Error('Deleting the remote root or a wildcard path is not allowed')
    }
    const sftp = await this.getSftp()
    try {
      await this.removeDirectory(sftp, remote)
    } finally {
      this.clearDirectories()
    }
  }

  private async removeDirectory(sftp: SFTP, remote: string): Promise<void> {
    const stats = await this.stat(sftp, remote, false)
    if (!stats) return
    if (!stats.isDirectory()) return this.deleteFile(remote, true)
    const entries = await this.readDirectory(remote)
    for (const { filename } of entries) {
      if (filename === '.' || filename === '..') continue
      if (!filename || /[/\\\0]/.test(filename)) throw new Error('Invalid SFTP directory entry')
      await this.removeDirectory(sftp, path.posix.join(remote, filename))
    }
    await new Promise<void>((resolve, reject) => {
      sftp.rmdir(remote, error => (error && !isMissing(error) ? reject(error) : resolve()))
    })
  }

  /** Prepare directories once per connection and mode; preserve permissions on existing directories. */
  async mkdir(directory: string, config: Pick<FileOptions, 'dirMode'> = {}): Promise<void> {
    directory = remotePath(directory)
    const sftp = await this.getSftp()
    if (directory === '/' || directory === '.') return
    const cacheKey = `${config.dirMode || ''}\0${directory}`
    if (this.preparedDirectories.has(cacheKey)) return
    const stats = await this.stat(sftp, directory)
    if (stats && !stats.isDirectory()) throw new Error('Remote upload parent is not a directory')
    if (!stats) {
      await this.mkdir(path.posix.dirname(directory), config)
      try {
        const attributes =
          config.dirMode && /^[0-7]{1,4}$/.test(config.dirMode) ? { mode: Number.parseInt(config.dirMode, 8) } : {}
        await new Promise<void>((resolve, reject) => {
          sftp.mkdir(directory, attributes, error => (error ? reject(error) : resolve()))
        })
        if (config.dirMode) this.pendingDirectoryModes.set(directory, config.dirMode)
      } catch (cause) {
        const racedDirectory = await this.stat(sftp, directory)
        if (!racedDirectory?.isDirectory()) throw new Error('Preparing upload directory failed', { cause })
      }
    }
    const pendingMode = this.pendingDirectoryModes.get(directory)
    if (pendingMode) {
      await this.chmod(directory, pendingMode, 'Setting directory permissions')
      this.pendingDirectoryModes.delete(directory)
    }
    this.preparedDirectories.add(cacheKey)
  }

  private async stat(sftp: SFTP, remote: string, followLinks = true): Promise<Stats | undefined> {
    return new Promise((resolve, reject) => {
      const callback = (error: Error | undefined, stats: Stats) => {
        if (!error) resolve(stats)
        else if (isMissing(error)) resolve(undefined)
        else reject(error)
      }
      if (followLinks) sftp.stat(remote, callback)
      else sftp.lstat(remote, callback)
    })
  }

  private async chmod(remote: string, mode: string, operation: string): Promise<void> {
    if (!/^[0-7]{1,4}$/.test(mode)) {
      await this.exec(`chmod -- ${quoteShellArgument(mode)} ${quoteShellArgument(remote)}`, operation)
      return
    }
    const sftp = await this.getSftp()
    try {
      await new Promise<void>((resolve, reject) => {
        sftp.chmod(remote, Number.parseInt(mode, 8), error => (error ? reject(error) : resolve()))
      })
    } catch (cause) {
      throw new Error(`${operation} failed`, { cause })
    }
  }

  async chown(remote: string, user: string, group?: string): Promise<void> {
    remote = remotePath(remote)
    const [uid, gid] = group ? [user, group] : user.includes(':') ? user.split(':') : [user, user]
    if ([uid, gid].every(value => /^\d+$/.test(value) && Number(value) < 0xffffffff)) {
      const sftp = await this.getSftp()
      try {
        await new Promise<void>((resolve, reject) => {
          sftp.chown(remote, Number(uid), Number(gid), error => (error ? reject(error) : resolve()))
        })
      } catch (cause) {
        throw new Error('Setting file ownership failed', { cause })
      }
      return
    }
    await this.exec(
      `chown -- ${quoteShellArgument(`${uid}:${gid}`)} ${quoteShellArgument(remote)}`,
      'Setting file ownership',
    )
  }

  get isConnected(): boolean {
    return this.connected && !!this.client?.isConnected()
  }

  private clearDirectories(): void {
    this.preparedDirectories.clear()
    this.pendingDirectoryModes.clear()
  }

  close(): void {
    const client = this.client
    this.client = undefined
    this.connected = false
    this.sftp = undefined
    this.clearDirectories()
    client?.dispose()
  }
}

export default SSHClient
