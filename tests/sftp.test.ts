import { beforeEach, describe, expect, it, vi } from 'vitest'

import SftpApi from '../src/main/manage/apis/sftp'
import SSHClient, { quoteShellArgument } from '../src/main/utils/sshClient'

const ssh = vi.hoisted(() => ({
  connect: vi.fn(),
  isConnected: vi.fn(),
  putFile: vi.fn(),
  execCommand: vi.fn(),
  dispose: vi.fn(),
  requestSFTP: vi.fn(),
  unlink: vi.fn(),
}))
const connections = vi.hoisted(() => [] as { connect: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }[])

vi.mock('node-ssh-no-cpu-features', () => ({
  NodeSSH: class {
    constructor() {
      connections.push(this)
    }

    connect = vi.fn((...args) => ssh.connect(...args))
    isConnected = ssh.isConnected
    putFile = ssh.putFile
    execCommand = ssh.execCommand
    dispose = vi.fn(() => ssh.dispose())
    requestSFTP = ssh.requestSFTP
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { error: vi.fn() } }))
vi.mock('apis/app/window/windowManager', () => ({ default: { get: vi.fn() } }))
vi.mock('electron', () => ({ ipcMain: { on: vi.fn(), removeAllListeners: vi.fn() } }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: {} }))
vi.mock('~/manage/utils/common', () => ({ formatError: () => 'Error' }))
vi.mock('~/utils/common', () => ({ isImage: () => false }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/sshClient', () => import('../src/main/utils/sshClient'))
vi.mock('~/utils/static', () => ({
  cancelDownloadLoadingFileList: 'cancelDownloadLoadingFileList',
  refreshDownloadFileTransferList: 'refreshDownloadFileTransferList',
}))

const config = { host: 'example.invalid', username: 'test' }
const api = new SftpApi(config.host, 22, config.username, '', '', '', '', '', { error: vi.fn() } as never)

beforeEach(() => {
  vi.resetAllMocks()
  connections.length = 0
  ssh.connect.mockResolvedValue(undefined)
  ssh.isConnected.mockReturnValue(true)
  ssh.putFile.mockResolvedValue(undefined)
  ssh.execCommand.mockResolvedValue({ code: 0, stdout: 'total 0\n' })
  ssh.requestSFTP.mockResolvedValue({ unlink: ssh.unlink })
  ssh.unlink.mockImplementation((_remote, callback) => callback())
})

describe('SFTP command arguments', () => {
  it('preserves absolute upload paths and quotes symbolic permissions', async () => {
    const client = new SSHClient()
    await client.connect(config)
    expect(await client.putFile('local.png', '\\images\\photo.png', { fileMode: 'u=rw,go=r' })).toBe(true)
    expect(ssh.execCommand.mock.calls).toEqual([
      ["mkdir -p -- '/images'"],
      ["chmod -- 'u=rw,go=r' '/images/photo.png'"],
    ])
    expect(ssh.putFile).toHaveBeenCalledWith('local.png', '/images/photo.png')
  })

  it('quotes directory names and custom permission values', async () => {
    const client = new SSHClient()
    await client.connect(config)
    await client.mkdir("/album's $(printf test)", { dirMode: '0700; printf test' })
    expect(ssh.execCommand).toHaveBeenCalledWith(
      "test -d '/album'\\''s $(printf test)' || (mkdir -- '/album'\\''s $(printf test)' && chmod -- '0700; printf test' '/album'\\''s $(printf test)')",
    )
  })

  it('does not upload when directory creation fails', async () => {
    const client = new SSHClient()
    await client.connect(config)
    ssh.execCommand.mockResolvedValue({ code: 1 })
    expect(await client.putFile('local.png', '/missing/photo.png')).toBe(false)
    expect(ssh.putFile).not.toHaveBeenCalled()
  })

  it('quotes filenames for create, rename and delete operations', async () => {
    const key = "album's $(printf test) `printf test`; &\nfile"
    const quoted = "'/album'\\''s $(printf test) `printf test`; &\nfile'"
    await api.createBucketFolder({ key })
    await api.renameBucketFile({ oldKey: key, newKey: '-new' })
    await api.deleteBucketFile({ key })
    await api.deleteBucketFolder({ key })
    expect(ssh.execCommand.mock.calls).toEqual([
      [`mkdir -p -- ${quoted}`],
      [`mv -f -- ${quoted} '/-new'`],
      [`rm -f -- ${quoted}`],
      [`rm -rf -- ${quoted}`],
    ])
  })

  it('quotes listing prefixes and rejects null bytes before running commands', async () => {
    await api.getBucketListRecursively({ prefix: "-album's $(printf test)" })
    expect(ssh.execCommand).toHaveBeenCalledWith("cd -- '-album'\\''s $(printf test)' && ls -la --time-style=long-iso")
    ssh.execCommand.mockClear()
    expect(await api.deleteBucketFile({ key: 'bad\0file' })).toBe(false)
    expect(ssh.execCommand).not.toHaveBeenCalled()
    expect(() => quoteShellArgument('bad\0argument')).toThrow('null bytes')
  })
})

describe('SFTP connection ownership', () => {
  it('keeps overlapping operations on separate connections', async () => {
    let release!: (value: unknown) => void
    let entered!: () => void
    const started = new Promise<void>(resolve => (entered = resolve))
    ssh.execCommand.mockImplementationOnce(() => {
      entered()
      return new Promise(resolve => (release = resolve))
    })
    const first = api.deleteBucketFile({ key: 'first.png' })
    await started
    const other = new SftpApi('other.invalid', 22, 'test', '', '', '', '', '', { error: vi.fn() } as never)
    expect(await other.createBucketFolder({ key: 'second' })).toBe(true)
    expect(connections).toHaveLength(2)
    expect(connections[0].connect).toHaveBeenCalledWith(expect.objectContaining({ host: config.host }))
    expect(connections[1].connect).toHaveBeenCalledWith(expect.objectContaining({ host: 'other.invalid' }))
    expect(connections[0].dispose).not.toHaveBeenCalled()
    expect(connections[1].dispose).toHaveBeenCalledOnce()
    release({ code: 0 })
    expect(await first).toBe(true)
    expect(connections[0].dispose).toHaveBeenCalledOnce()
  })

  it.each(['connect', 'execCommand'] as const)('closes the operation connection when %s fails', async stage => {
    ssh[stage].mockRejectedValue(new Error('Connection failed'))
    expect(await api.deleteBucketFile({ key: 'image.png' })).toBe(false)
    expect(connections[0].dispose).toHaveBeenCalledOnce()
    if (stage === 'connect') expect(ssh.execCommand).not.toHaveBeenCalled()
  })

  it('uses one connection for gallery deletion', async () => {
    expect(await new SSHClient().deleteFileSFTP(config, '\\images\\photo.png')).toBe(true)
    expect(ssh.connect).toHaveBeenCalledOnce()
    expect(ssh.unlink).toHaveBeenCalledWith('/images/photo.png', expect.any(Function))
    expect(ssh.dispose).toHaveBeenCalledOnce()
  })

  it.each(['connect', 'requestSFTP', 'unlink'] as const)(
    'settles deletion and closes the connection on %s failure',
    async stage => {
      if (stage === 'unlink') {
        ssh.unlink.mockImplementation((_remote, callback) => callback(new Error('Unlink failed')))
      } else {
        ssh[stage].mockRejectedValue(new Error('Connection failed'))
      }
      expect(await new SSHClient().deleteFileSFTP(config, '/images/photo.png')).toBe(false)
      expect(ssh.dispose).toHaveBeenCalledOnce()
    },
  )
})
