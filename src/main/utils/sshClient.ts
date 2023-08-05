import { NodeSSH, Config } from 'node-ssh-no-cpu-features'
import { ISftpPlistConfig } from 'piclist/dist/types'

class SSHClient {
  // eslint-disable-next-line no-use-before-define
  private static _instance: SSHClient
  private static _client: NodeSSH
  private _isConnected = false

  public static get instance (): SSHClient {
    return this._instance || (this._instance = new this())
  }

  public static get client (): NodeSSH {
    return this._client || (this._client = new NodeSSH())
  }

  private changeWinStylePathToUnix (path: string): string {
    return path.replace(/\\/g, '/')
  }

  public async connect (config: ISftpPlistConfig): Promise<boolean> {
    const { username, password, privateKey, passphrase } = config
    const loginInfo: Config = privateKey
      ? { username, privateKeyPath: privateKey, passphrase: passphrase || undefined }
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

  public async deleteFile (remote: string): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('SSH 未连接')
    }
    try {
      remote = this.changeWinStylePathToUnix(remote)
      const script = `rm -f ${remote}`
      return await this.exec(script)
    } catch (err: any) {
      return false
    }
  }

  private async exec (script: string): Promise<boolean> {
    const execResult = await SSHClient.client.execCommand(script)
    return execResult.code === 0
  }

  public close (): void {
    SSHClient.client.dispose()
    this._isConnected = false
  }
}

export default SSHClient
