import path from 'node:path'

import logger from '@core/picgo/logger'
import { Config, NodeSSH, SSHExecCommandResponse } from 'node-ssh-no-cpu-features'
import { ISftpPlistConfig } from 'piclist/dist/types'
import type { FileEntry } from 'ssh2'

export const quoteShellArgument = (value: string): string => {
  if (value.includes('\0')) throw new Error('SSH command arguments must not contain null bytes')
  return `'${value.replace(/'/g, "'\\''")}'`
}

class SSHClient {
  private readonly client = new NodeSSH()
  private _isConnected = false

  private changeWinStylePathToUnix(path: string): string {
    return path.replace(/\\/g, '/')
  }

  async connect(config: ISftpPlistConfig): Promise<boolean> {
    const { username, password, privateKey, passphrase } = config
    const loginInfo: Config = privateKey
      ? {
          username,
          privateKeyPath: privateKey,
          passphrase: passphrase || undefined,
        }
      : { username, password }
    try {
      await this.client.connect({
        host: config.host,
        port: Number(config.port) || 22,
        ...loginInfo,
      })
      this._isConnected = true
      return true
    } catch (err: any) {
      throw new Error(err, { cause: err })
    }
  }

  async deleteFileSFTP(config: ISftpPlistConfig, remote: string): Promise<boolean> {
    try {
      remote = this.changeWinStylePathToUnix(remote)
      if (remote === '/' || remote.includes('*')) return false
      await this.connect(config)
      const sftp = await this.client.requestSFTP()
      await new Promise<void>((resolve, reject) => {
        sftp.unlink(remote, (error?: Error | null) => (error ? reject(error) : resolve()))
      })
      return true
    } catch (err: any) {
      logger.error(err)
      return false
    } finally {
      this.close()
    }
  }

  private async exec(script: string): Promise<boolean> {
    const execResult = await this.client.execCommand(script)
    return execResult.code === 0
  }

  async execCommand(script: string): Promise<SSHExecCommandResponse> {
    const execResult = await this.client.execCommand(script)
    return execResult || { code: 1, stdout: '', stderr: '' }
  }

  async readDirectory(remote: string): Promise<FileEntry[]> {
    const sftp = await this.client.requestSFTP()
    try {
      return await new Promise<FileEntry[]>((resolve, reject) => {
        sftp.readdir(remote, (error: Error | undefined, entries: FileEntry[]) =>
          error ? reject(error) : resolve(entries),
        )
      })
    } finally {
      sftp.end()
    }
  }

  async getFile(local: string, remote: string): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('SSH 未连接')
    }
    try {
      remote = this.changeWinStylePathToUnix(remote)
      local = this.changeWinStylePathToUnix(local)
      await this.client.getFile(local, remote, undefined, {
        concurrency: 1,
      })
      return true
    } catch (err: any) {
      logger.error(err)
      return false
    }
  }

  async putFile(
    local: string,
    remote: string,
    config: {
      fileMode?: string
      dirMode?: string
    } = {},
  ): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('SSH 未连接')
    }
    try {
      remote = this.changeWinStylePathToUnix(remote)
      if (!(await this.mkdir(path.posix.dirname(remote), config))) return false
      await this.client.putFile(local, remote)
      const fileMode = config.fileMode || '0644'
      if (fileMode !== '0644') {
        const script = `chmod -- ${quoteShellArgument(String(fileMode))} ${quoteShellArgument(remote)}`
        return await this.exec(script)
      }
      return true
    } catch (err: any) {
      logger.error(err)
      return false
    }
  }

  async mkdir(
    dirPath: string,
    config: {
      dirMode?: string
    } = {},
  ): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('SSH 未连接')
    }
    try {
      const directoryMode = config.dirMode || '0755'
      if (directoryMode === '0755') {
        const script = `mkdir -p -- ${quoteShellArgument(dirPath)}`
        return await this.exec(script)
      } else {
        const dirs = dirPath.split('/')
        let currentPath = dirPath.startsWith('/') ? '/' : ''
        for (const dir of dirs) {
          if (dir) {
            currentPath = path.posix.join(currentPath, dir)
            const quotedPath = quoteShellArgument(currentPath)
            const script = `test -d ${quotedPath} || (mkdir -- ${quotedPath} && chmod -- ${quoteShellArgument(String(directoryMode))} ${quotedPath})`
            const result = await this.exec(script)
            if (!result) {
              return false
            }
          }
        }
        return true
      }
    } catch (err: any) {
      logger.error(err)
      return false
    }
  }

  get isConnected(): boolean {
    return this.client.isConnected()
  }

  close(): void {
    this.client.dispose()
    this._isConnected = false
  }
}

export default SSHClient
