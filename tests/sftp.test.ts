import { beforeEach, describe, expect, it, vi } from 'vitest'

import SftpApi from '../src/main/manage/apis/sftp'
import SSHClient, { quoteShellArgument } from '../src/main/utils/sshClient'

const ssh = vi.hoisted(() => ({
  connect: vi.fn(),
  isConnected: vi.fn(),
  putFile: vi.fn(),
  execCommand: vi.fn(),
  dispose: vi.fn(),
}))

vi.mock('node-ssh-no-cpu-features', () => ({
  NodeSSH: class {
    connect = ssh.connect
    isConnected = ssh.isConnected
    putFile = ssh.putFile
    execCommand = ssh.execCommand
    dispose = ssh.dispose
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
  ssh.connect.mockResolvedValue(undefined)
  ssh.isConnected.mockReturnValue(true)
  ssh.putFile.mockResolvedValue(undefined)
  ssh.execCommand.mockResolvedValue({ code: 0, stdout: 'total 0\n' })
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
      "mkdir -- '/album'\\''s $(printf test)' && chmod -- '0700; printf test' '/album'\\''s $(printf test)'",
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
