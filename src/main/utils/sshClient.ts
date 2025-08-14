import path from 'node:path'

import logger from '@core/picgo/logger'
import fs from 'fs-extra'
import { Config, NodeSSH, SSHExecCommandResponse } from 'node-ssh-no-cpu-features'
import { ISftpPlistConfig } from 'piclist/dist/types'
import { Client } from 'ssh2-no-cpu-features'

class SSHClient {
  private static _instance: SSHClient
  private static _client: NodeSSH
  private _isConnected = false

  static get instance (): SSHClient {
    return this._instance || (this._instance = new this())
  }

  static get client (): NodeSSH {
    return this._client || (this._client = new NodeSSH())
  }

  private changeWinStylePathToUnix (path: string): string {
    return path.replace(/\\/g, '/')
  }

  async connect (config: ISftpPlistConfig): Promise<boolean> {
    const { username, password, privateKey, passphrase } = config
    const loginInfo: Config = privateKey
      ? {
          username,
          privateKeyPath: privateKey,
          passphrase: passphrase || undefined
        }
      : { username, password }
    try {
      await SSHClient.client.connect({
        host: config.host,
        port: Number(config.port) || 22,
        ...loginInfo
      })
      this._isConnected = true
      return true
    } catch (err: any) {
      throw new Error(err)
    }
  }

  async deleteFileSFTP (config: ISftpPlistConfig, remote: string): Promise<boolean> {
    try {
      const client = new Client()
      const { username, password, privateKey, passphrase } = config
      const loginInfo: Config = privateKey
        ? {
            username,
            privateKey: fs.readFileSync(privateKey),
            passphrase: passphrase || undefined
          }
        : { username, password }
      remote = this.changeWinStylePathToUnix(remote)
      if (remote === '/' || remote.includes('*')) return false
      const promise = new Promise((resolve, reject) => {
        client
          .on('ready', () => {
            client.sftp(
              (
                err: any,
                sftp: {
                  unlink: (arg0: string, arg1: (err: any) => void) => void
                }
              ) => {
                // eslint-disable-next-line prefer-promise-reject-errors
                if (err) reject(false)
                sftp.unlink(remote, (err: any) => {
                  // eslint-disable-next-line prefer-promise-reject-errors
                  if (err) reject(false)
                  client.end()
                  resolve(true)
                })
              }
            )
          })
          .connect({
            host: config.host,
            port: Number(config.port) || 22,
            ...loginInfo
          })
      })
      return (await promise) as boolean
    } catch (err: any) {
      logger.error(err)
      return false
    }
  }

  private async exec (script: string): Promise<boolean> {
    const execResult = await SSHClient.client.execCommand(script)
    return execResult.code === 0
  }

  async execCommand (script: string): Promise<SSHExecCommandResponse> {
    const execResult = await SSHClient.client.execCommand(script)
    return execResult || { code: 1, stdout: '', stderr: '' }
  }

  async getFile (local: string, remote: string): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('SSH 未连接')
    }
    try {
      remote = this.changeWinStylePathToUnix(remote)
      local = this.changeWinStylePathToUnix(local)
      await SSHClient.client.getFile(local, remote, undefined, {
        concurrency: 1
      })
      return true
    } catch (err: any) {
      logger.error(err)
      return false
    }
  }

  async putFile (
    local: string,
    remote: string,
    config: {
      fileMode?: string
      dirMode?: string
    } = {}
  ): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('SSH 未连接')
    }
    try {
      remote = this.changeWinStylePathToUnix(remote)
      await this.mkdir(path.dirname(remote).replace(/^\/+|\/+$/g, ''), config)
      await SSHClient.client.putFile(local, remote)
      const fileMode = config.fileMode || '0644'
      if (fileMode !== '0644') {
        const script = `chmod ${fileMode} "${remote}"`
        return await this.exec(script)
      }
      return true
    } catch (err: any) {
      logger.error(err)
      return false
    }
  }

  async mkdir (
    dirPath: string,
    config: {
      dirMode?: string
    } = {}
  ): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('SSH 未连接')
    }
    try {
      const directoryMode = config.dirMode || '0755'
      if (directoryMode === '0755') {
        const script = `mkdir -p "${dirPath}"`
        return await this.exec(script)
      } else {
        const dirs = dirPath.split('/')
        let currentPath = ''
        for (const dir of dirs) {
          if (dir) {
            currentPath += `/${dir}`
            const script = `mkdir "${currentPath}" && chmod ${directoryMode} "${currentPath}"`
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

  get isConnected (): boolean {
    return SSHClient.client.isConnected()
  }

  close (): void {
    SSHClient.client.dispose()
    this._isConnected = false
  }
}

export default SSHClient
