import { constants } from 'node:fs'
import path from 'node:path'

import { ipcMain } from 'electron'
import type { FileEntry } from 'ssh2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SftpApi from '../src/main/manage/apis/sftp'
import { downloadTaskSpecialStatus } from '../src/main/utils/enum'
import SSHClient, { quoteShellArgument } from '../src/main/utils/sshClient'

const ssh = vi.hoisted(() => ({
  connect: vi.fn(),
  isConnected: vi.fn(),
  getFile: vi.fn(),
  putFile: vi.fn(),
  execCommand: vi.fn(),
  dispose: vi.fn(),
  requestSFTP: vi.fn(),
  readdir: vi.fn(),
  endSFTP: vi.fn(),
  unlink: vi.fn(),
}))
const state = vi.hoisted(() => ({
  send: vi.fn(),
  ensureDir: vi.fn(),
  queue: { getDownloadTask: vi.fn(), addDownloadTask: vi.fn(), updateDownloadTask: vi.fn() },
}))
const connections = vi.hoisted(() => [] as { connect: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }[])

vi.mock('node-ssh-no-cpu-features', () => ({
  NodeSSH: class {
    constructor() {
      connections.push(this)
    }

    connect = vi.fn((...args) => ssh.connect(...args))
    isConnected = ssh.isConnected
    getFile = ssh.getFile
    putFile = ssh.putFile
    execCommand = ssh.execCommand
    dispose = vi.fn(() => ssh.dispose())
    requestSFTP = ssh.requestSFTP
  },
}))
vi.mock('@core/picgo/logger', () => ({ default: { error: vi.fn() } }))
vi.mock('apis/app/window/windowManager', () => ({
  default: { get: () => ({ webContents: { send: state.send } }) },
}))
vi.mock('electron', async () => {
  const { EventEmitter } = await import('node:events')
  return { ipcMain: new EventEmitter() }
})
vi.mock('fs-extra', () => ({ default: { ensureDir: state.ensureDir } }))
vi.mock('~/manage/datastore/upDownTaskQueue', () => ({ default: { getInstance: () => state.queue } }))
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
  ipcMain.removeAllListeners()
  connections.length = 0
  ssh.connect.mockResolvedValue(undefined)
  ssh.isConnected.mockReturnValue(true)
  ssh.putFile.mockResolvedValue(undefined)
  ssh.execCommand.mockResolvedValue({ code: 0, stdout: 'total 0\n' })
  ssh.requestSFTP.mockResolvedValue({ unlink: ssh.unlink, readdir: ssh.readdir, end: ssh.endSFTP })
  ssh.readdir.mockImplementation((_remote, callback) => callback(undefined, []))
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
    await api.getBucketListBackstage({ prefix: "-album's $(printf test)", baseDir: '/' })
    expect(ssh.execCommand).toHaveBeenCalledWith("cd -- '-album'\\''s $(printf test)' && ls -la --time-style=long-iso")
    ssh.execCommand.mockClear()
    expect(await api.deleteBucketFile({ key: 'bad\0file' })).toBe(false)
    expect(ssh.execCommand).not.toHaveBeenCalled()
    expect(() => quoteShellArgument('bad\0argument')).toThrow('null bytes')
  })
})

const downloadConfig = { prefix: '/album/', cancelToken: 'album-download' }
const entry = (filename: string, mode = constants.S_IFREG | 0o644): FileEntry => ({
  filename,
  longname: 'Display text must not be parsed',
  attrs: { mode, size: 123, uid: 1000, gid: 1000, atime: 1700000000, mtime: 1700000000 },
})
const folder = (filename: string) => entry(filename, constants.S_IFDIR | 0o755)

function mockDirectories(directories: Record<string, FileEntry[]>) {
  const visited = new Set<string>()
  ssh.readdir.mockImplementation((remote: string, callback) => {
    const directory = remote.replace(/\/+$/, '') || '/'
    if (!directories[directory] || visited.has(directory)) {
      callback(new Error('Unexpected or repeated directory'))
      return
    }
    visited.add(directory)
    callback(undefined, directories[directory])
  })
}

function expectDownloadFiles(keys: string[]) {
  expect(state.send).toHaveBeenCalledOnce()
  expect(state.send).toHaveBeenCalledWith('refreshDownloadFileTransferList', {
    fullList: expect.any(Array),
    success: true,
    finished: true,
  })
  const { fullList } = state.send.mock.calls[0][1]
  expect(fullList).toHaveLength(keys.length)
  expect(fullList).toEqual(
    expect.arrayContaining(
      keys.map(key => expect.objectContaining({ key, Key: key, fileName: path.posix.basename(key), isDir: false })),
    ),
  )
  return fullList as { key: string; fileName: string }[]
}

describe('SFTP recursive folder downloads', () => {
  it.each(['/album/', '/album'])('includes nested files and preserves each parent path from %s', async prefix => {
    mockDirectories({
      '/album': [entry('direct.png'), folder('child'), folder('sibling')],
      '/album/child': [entry('nested.png'), folder('grandchild')],
      '/album/child/grandchild': [entry('nested.png')],
      '/album/sibling': [entry('nested.png')],
    })

    await api.getBucketListRecursively({ ...downloadConfig, prefix })

    expectDownloadFiles([
      'album/direct.png',
      'album/child/nested.png',
      'album/child/grandchild/nested.png',
      'album/sibling/nested.png',
    ])
    expect(ssh.readdir).toHaveBeenCalledTimes(4)
    expect(ssh.connect).toHaveBeenCalledOnce()
    expect(ssh.endSFTP).toHaveBeenCalledTimes(4)
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(ssh.execCommand).not.toHaveBeenCalled()
    expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
  })

  it('preserves whitespace, Unicode and shell metacharacters using SFTP attributes', async () => {
    const directory = "-album's $(printf test)"
    const filename = 'two  spaces\t雪\n`photo`; &.png'
    mockDirectories({ [`/${directory}`]: [folder('.hidden')], [`/${directory}/.hidden`]: [entry(filename)] })

    await api.getBucketListRecursively({ ...downloadConfig, prefix: `/${directory}` })

    expectDownloadFiles([`${directory}/.hidden/${filename}`])
    expect(state.send.mock.calls[0][1].fullList[0]).toMatchObject({
      fileSize: 123,
      mtime: new Date(1700000000000).toISOString(),
    })
    expect(ssh.execCommand).not.toHaveBeenCalled()
  })

  it('finishes an empty directory successfully', async () => {
    await api.getBucketListRecursively(downloadConfig)

    expectDownloadFiles([])
    expect(ssh.dispose).toHaveBeenCalledOnce()
  })

  it('skips dot entries, symlinks and special files when traversing the remote root', async () => {
    mockDirectories({
      '/': [
        folder('.'),
        folder('..'),
        entry('cycle', constants.S_IFLNK | 0o777),
        entry('pipe', constants.S_IFIFO | 0o600),
        entry('direct.png'),
        folder('child'),
      ],
      '/child': [entry('nested.png')],
    })

    await api.getBucketListRecursively({ ...downloadConfig, prefix: '/' })

    expectDownloadFiles(['direct.png', 'child/nested.png'])
    expect(ssh.readdir).toHaveBeenCalledTimes(2)
  })

  it('creates local parent directories and queues every file with the folder caller path convention', async () => {
    mockDirectories({ '/album': [entry('direct.png'), folder('child')], '/album/child': [entry('nested.png')] })
    await api.getBucketListRecursively(downloadConfig)
    const files = expectDownloadFiles(['album/direct.png', 'album/child/nested.png'])
    const downloadPath = path.resolve('downloads')
    const fileArray = files.map(({ key }) => ({
      alias: 'test',
      bucketName: 'sftp',
      region: 'sftp',
      key,
      fileName: `/${key}`,
    }))
    ssh.getFile.mockImplementation(async local => {
      expect(state.ensureDir).toHaveBeenCalledWith(path.dirname(path.normalize(local)))
    })

    await api.downloadBucketFile({ downloadPath, fileArray })

    expect(state.queue.addDownloadTask).toHaveBeenCalledTimes(2)
    expect(state.ensureDir).toHaveBeenCalledTimes(2)
    expect(ssh.getFile).toHaveBeenCalledTimes(2)
    for (const { key } of files) {
      const targetFilePath = path.join(downloadPath, key)
      expect(state.queue.addDownloadTask).toHaveBeenCalledWith(expect.objectContaining({ targetFilePath }))
      expect(ssh.getFile).toHaveBeenCalledWith(targetFilePath.replace(/\\/g, '/'), `/${key}`, undefined, {
        concurrency: 1,
      })
      expect(state.queue.updateDownloadTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: `test-sftp-sftp-${key}`,
          progress: 100,
          status: downloadTaskSpecialStatus.downloaded,
        }),
      )
    }
  })

  it('stops after the in-flight directory read when cancelled and keeps unrelated listeners', async () => {
    const otherListener = vi.fn()
    ipcMain.on('cancelDownloadLoadingFileList', otherListener)
    let completeRead!: (error: undefined, entries: FileEntry[]) => void
    let started!: () => void
    const reading = new Promise<void>(resolve => (started = resolve))
    ssh.readdir.mockImplementationOnce((_remote, callback) =>
      callback(undefined, [folder('child'), entry('direct.png')]),
    )
    ssh.readdir.mockImplementationOnce((_remote, callback) => {
      completeRead = callback
      started()
    })

    const scan = api.getBucketListRecursively(downloadConfig)
    await reading
    ipcMain.emit('cancelDownloadLoadingFileList', {}, downloadConfig.cancelToken)
    completeRead(undefined, [folder('grandchild'), entry('nested.png')])
    await scan

    expect(ssh.readdir).toHaveBeenCalledTimes(2)
    expect(state.send).toHaveBeenCalledWith('refreshDownloadFileTransferList', {
      fullList: [expect.objectContaining({ key: 'album/direct.png' })],
      success: false,
      finished: true,
    })
    expect(ssh.endSFTP).toHaveBeenCalledTimes(2)
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(ipcMain.listeners('cancelDownloadLoadingFileList')).toEqual([otherListener])
  })

  it('checks cancellation before starting the first directory read', async () => {
    ssh.connect.mockImplementationOnce(async () => {
      ipcMain.emit('cancelDownloadLoadingFileList', {}, downloadConfig.cancelToken)
    })

    await api.getBucketListRecursively(downloadConfig)

    expect(ssh.readdir).not.toHaveBeenCalled()
    expect(state.send).toHaveBeenCalledWith('refreshDownloadFileTransferList', {
      fullList: [],
      success: false,
      finished: true,
    })
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
  })

  it('ignores cancellation for another scan', async () => {
    mockDirectories({ '/album': [folder('child')], '/album/child': [entry('nested.png')] })
    ssh.connect.mockImplementationOnce(async () => {
      ipcMain.emit('cancelDownloadLoadingFileList', {}, 'another-download')
    })

    await api.getBucketListRecursively(downloadConfig)

    expectDownloadFiles(['album/child/nested.png'])
  })

  it.each(['connect', 'requestSFTP', 'readdir'] as const)(
    'reports failure and cleans up when %s fails',
    async stage => {
      if (stage === 'readdir') {
        ssh.readdir.mockImplementationOnce((_remote, callback) => callback(new Error('Permission denied')))
      } else {
        ssh[stage].mockRejectedValueOnce(new Error('Connection failed'))
      }

      await api.getBucketListRecursively(downloadConfig)

      expect(state.send).toHaveBeenCalledWith('refreshDownloadFileTransferList', {
        fullList: [],
        success: false,
        finished: true,
      })
      expect(ssh.dispose).toHaveBeenCalledOnce()
      expect(ssh.endSFTP).toHaveBeenCalledTimes(stage === 'readdir' ? 1 : 0)
      expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
    },
  )

  it('does not report success for a partial tree when a nested directory is unreadable', async () => {
    ssh.readdir
      .mockImplementationOnce((_remote, callback) => callback(undefined, [entry('direct.png'), folder('child')]))
      .mockImplementationOnce((_remote, callback) => callback(new Error('Permission denied')))

    await api.getBucketListRecursively(downloadConfig)

    expect(state.send).toHaveBeenCalledWith('refreshDownloadFileTransferList', {
      fullList: [expect.objectContaining({ key: 'album/direct.png' })],
      success: false,
      finished: true,
    })
    expect(ssh.endSFTP).toHaveBeenCalledTimes(2)
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
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
