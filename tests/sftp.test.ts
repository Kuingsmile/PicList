import { constants } from 'node:fs'
import path from 'node:path'

import { ipcMain } from 'electron'
import type { FileEntry } from 'ssh2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SftpApi from '../src/main/manage/apis/sftp'
import { removeFileFromSFTPInMain } from '../src/main/utils/deleteFunc'
import { commonTaskStatus, downloadTaskSpecialStatus, uploadTaskSpecialStatus } from '../src/main/utils/enum'
import SSHClient, { quoteShellArgument } from '../src/main/utils/sshClient'
import { listFromProvider, listingIdentity } from './listingTestUtils'

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
  once: vi.fn(),
  removeListener: vi.fn(),
  stat: vi.fn(),
  lstat: vi.fn(),
  mkdir: vi.fn(),
  rmdir: vi.fn(),
  chmod: vi.fn(),
  chown: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  ext_openssh_rename: vi.fn(),
  rename: vi.fn(),
}))
const state = vi.hoisted(() => ({
  send: vi.fn(),
  ensureDir: vi.fn(),
  queue: {
    getDownloadTask: vi.fn(),
    addDownloadTask: vi.fn(),
    updateDownloadTask: vi.fn(),
    getUploadTask: vi.fn(),
    addUploadTask: vi.fn(),
    updateUploadTask: vi.fn(),
  },
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
const directories = new Set<string>()
const channel = {
  ...ssh,
  end: ssh.endSFTP,
}

beforeEach(() => {
  vi.resetAllMocks()
  ipcMain.removeAllListeners()
  connections.length = 0
  directories.clear()
  ssh.connect.mockResolvedValue(undefined)
  ssh.isConnected.mockReturnValue(true)
  ssh.putFile.mockResolvedValue(undefined)
  ssh.execCommand.mockResolvedValue({ code: 0, stdout: 'total 0\n' })
  ssh.requestSFTP.mockResolvedValue(channel)
  ssh.readdir.mockImplementation((_remote, callback) => callback(undefined, []))
  ssh.unlink.mockImplementation((_remote, callback) => callback())
  ssh.stat.mockImplementation((remote, callback) =>
    directories.has(remote) ? callback(null, { isDirectory: () => true }) : callback({ code: 2 }),
  )
  ssh.lstat.mockImplementation((remote, callback) => callback(null, { isDirectory: () => directories.has(remote) }))
  ssh.mkdir.mockImplementation((remote, _attrs, callback) => {
    directories.add(remote)
    callback()
  })
  ssh.rmdir.mockImplementation((remote, callback) => {
    directories.delete(remote)
    callback()
  })
  ssh.chmod.mockImplementation((_remote, _mode, callback) => callback())
  ssh.open.mockImplementation((_remote, _flags, callback) => callback(null, Buffer.from('handle')))
  ssh.close.mockImplementation((_handle, callback) => callback())
  ssh.ext_openssh_rename.mockImplementation((_source, _destination, callback) => callback())
})

describe('SFTP command arguments', () => {
  it('preserves absolute upload paths and quotes symbolic permissions', async () => {
    const client = new SSHClient()
    await client.connect(config)
    await client.putFile('local.png', '\\images\\photo.png', { fileMode: 'u=rw,go=r' })
    const stagedPath = ssh.putFile.mock.calls[0][1]
    expect(ssh.execCommand.mock.calls).toEqual([[`chmod -- 'u=rw,go=r' '${stagedPath}'`]])
    expect(ssh.putFile).toHaveBeenCalledWith('local.png', stagedPath, channel)
    expect(ssh.ext_openssh_rename).toHaveBeenCalledWith(stagedPath, '/images/photo.png', expect.any(Function))
  })

  it('quotes directory names and custom permission values', async () => {
    const client = new SSHClient()
    await client.connect(config)
    await client.mkdir("/album's $(printf test)", { dirMode: '0700; printf test' })
    expect(ssh.execCommand).toHaveBeenCalledWith("chmod -- '0700; printf test' '/album'\\''s $(printf test)'")
  })

  it('does not upload when directory creation fails', async () => {
    const client = new SSHClient()
    await client.connect(config)
    ssh.mkdir.mockImplementationOnce((_remote, _attrs, callback) => callback(new Error('Permission denied')))
    await expect(client.putFile('local.png', '/missing/photo.png')).rejects.toThrow('Preparing upload directory failed')
    expect(ssh.putFile).not.toHaveBeenCalled()
  })

  it('passes filenames literally to SFTP for create, rename and delete operations', async () => {
    const key = "album's $(printf test) `printf test`; &\nfile"
    await api.createBucketFolder({ key })
    await api.renameBucketFile({ oldKey: key, newKey: '-new' })
    await api.deleteBucketFile({ key })
    await api.deleteBucketFolder({ key })
    expect(ssh.mkdir).toHaveBeenCalledWith(`/${key}`, { mode: 0o775 }, expect.any(Function))
    expect(ssh.ext_openssh_rename).toHaveBeenCalledWith(`/${key}`, '/-new', expect.any(Function))
    expect(ssh.unlink).toHaveBeenCalledWith(`/${key}`, expect.any(Function))
    expect(ssh.rmdir).toHaveBeenCalledWith(`/${key}`, expect.any(Function))
    expect(ssh.execCommand).not.toHaveBeenCalled()
  })

  it('passes listing prefixes literally and rejects null bytes before sending paths', async () => {
    await listFromProvider(
      api,
      'getBucketListBackstage',
      { prefix: "-album's $(printf test)", baseDir: '/' },
      state.send,
    )
    expect(ssh.readdir).toHaveBeenCalledWith("-album's $(printf test)", expect.any(Function))
    expect(await api.deleteBucketFile({ key: 'bad\0file' })).toBe(false)
    expect(ssh.unlink).not.toHaveBeenCalled()
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
  expect(state.send).toHaveBeenLastCalledWith(
    'refreshDownloadFileTransferList',
    expect.objectContaining({
      fullList: expect.any(Array),
      success: true,
      finished: true,
    }),
  )
  const { fullList } = state.send.mock.calls.at(-1)![1]
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

    await listFromProvider(api, 'getBucketListRecursively', { ...downloadConfig, prefix }, state.send)

    expectDownloadFiles([
      'album/direct.png',
      'album/child/nested.png',
      'album/child/grandchild/nested.png',
      'album/sibling/nested.png',
    ])
    expect(ssh.readdir).toHaveBeenCalledTimes(4)
    expect(ssh.connect).toHaveBeenCalledOnce()
    expect(ssh.requestSFTP).toHaveBeenCalledOnce()
    expect(ssh.endSFTP).not.toHaveBeenCalled()
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(ssh.execCommand).not.toHaveBeenCalled()
    expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
  })

  it('preserves whitespace, Unicode and shell metacharacters using SFTP attributes', async () => {
    const directory = "-album's $(printf test)"
    const filename = 'two  spaces\t雪\n`photo`; &.png'
    mockDirectories({ [`/${directory}`]: [folder('.hidden')], [`/${directory}/.hidden`]: [entry(filename)] })

    await listFromProvider(api, 'getBucketListRecursively', { ...downloadConfig, prefix: `/${directory}` }, state.send)

    expectDownloadFiles([`${directory}/.hidden/${filename}`])
    expect(state.send.mock.calls.at(-1)![1].fullList[0]).toMatchObject({
      fileSize: 123,
      mtime: new Date(1700000000000).toISOString(),
    })
    expect(ssh.execCommand).not.toHaveBeenCalled()
  })

  it('finishes an empty directory successfully', async () => {
    await listFromProvider(api, 'getBucketListRecursively', downloadConfig, state.send)

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

    await listFromProvider(api, 'getBucketListRecursively', { ...downloadConfig, prefix: '/' }, state.send)

    expectDownloadFiles(['direct.png', 'child/nested.png'])
    expect(ssh.readdir).toHaveBeenCalledTimes(2)
  })

  it('creates local parent directories and queues every file with the folder caller path convention', async () => {
    mockDirectories({ '/album': [entry('direct.png'), folder('child')], '/album/child': [entry('nested.png')] })
    await listFromProvider(api, 'getBucketListRecursively', downloadConfig, state.send)
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
      expect(ssh.getFile).toHaveBeenCalledWith(targetFilePath, `/${key}`, channel, {
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

    const scan = listFromProvider(api, 'getBucketListRecursively', downloadConfig, state.send)
    await reading
    ipcMain.emit('cancelDownloadLoadingFileList', {}, listingIdentity(downloadConfig, 'download'))
    completeRead(undefined, [folder('grandchild'), entry('nested.png')])
    await scan

    expect(ssh.readdir).toHaveBeenCalledTimes(2)
    expect(state.send).toHaveBeenCalledWith(
      'refreshDownloadFileTransferList',
      expect.objectContaining({
        fullList: [expect.objectContaining({ key: 'album/direct.png' })],
        success: false,
        finished: true,
      }),
    )
    expect(ssh.endSFTP).not.toHaveBeenCalled()
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(ipcMain.listeners('cancelDownloadLoadingFileList')).toEqual([otherListener])
  })

  it('checks cancellation before starting the first directory read', async () => {
    ssh.connect.mockImplementationOnce(async () => {
      ipcMain.emit('cancelDownloadLoadingFileList', {}, listingIdentity(downloadConfig, 'download'))
    })

    await listFromProvider(api, 'getBucketListRecursively', downloadConfig, state.send)

    expect(ssh.readdir).not.toHaveBeenCalled()
    expect(state.send).toHaveBeenCalledWith(
      'refreshDownloadFileTransferList',
      expect.objectContaining({
        fullList: [],
        success: false,
        finished: true,
      }),
    )
    expect(ssh.dispose).toHaveBeenCalledTimes(2)
    expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
  })

  it('ignores cancellation for another scan', async () => {
    mockDirectories({ '/album': [folder('child')], '/album/child': [entry('nested.png')] })
    ssh.connect.mockImplementationOnce(async () => {
      ipcMain.emit('cancelDownloadLoadingFileList', {}, 'another-download')
    })

    await listFromProvider(api, 'getBucketListRecursively', downloadConfig, state.send)

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

      await listFromProvider(api, 'getBucketListRecursively', downloadConfig, state.send)

      expect(state.send).toHaveBeenCalledWith(
        'refreshDownloadFileTransferList',
        expect.objectContaining({
          fullList: [],
          success: false,
          finished: true,
        }),
      )
      expect(ssh.dispose).toHaveBeenCalledOnce()
      expect(ssh.endSFTP).not.toHaveBeenCalled()
      expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
    },
  )

  it('does not report success for a partial tree when a nested directory is unreadable', async () => {
    ssh.readdir
      .mockImplementationOnce((_remote, callback) => callback(undefined, [entry('direct.png'), folder('child')]))
      .mockImplementationOnce((_remote, callback) => callback(new Error('Permission denied')))

    await listFromProvider(api, 'getBucketListRecursively', downloadConfig, state.send)

    expect(state.send).toHaveBeenCalledWith(
      'refreshDownloadFileTransferList',
      expect.objectContaining({
        fullList: [expect.objectContaining({ key: 'album/direct.png' })],
        success: false,
        finished: true,
      }),
    )
    expect(ssh.endSFTP).not.toHaveBeenCalled()
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(ipcMain.listenerCount('cancelDownloadLoadingFileList')).toBe(0)
  })
})

describe('SFTP connection ownership', () => {
  it('keeps overlapping operations on separate connections', async () => {
    let release!: () => void
    let entered!: () => void
    const started = new Promise<void>(resolve => (entered = resolve))
    ssh.unlink.mockImplementationOnce((_remote, callback) => {
      entered()
      release = () => callback()
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
    release()
    expect(await first).toBe(true)
    expect(connections[0].dispose).toHaveBeenCalledOnce()
  })

  it.each(['connect', 'unlink'] as const)('closes the operation connection when %s fails', async stage => {
    if (stage === 'unlink') ssh.unlink.mockImplementation((_remote, callback) => callback(new Error('Unlink failed')))
    else ssh.connect.mockRejectedValue(new Error('Connection failed'))
    expect(await api.deleteBucketFile({ key: 'image.png' })).toBe(false)
    expect(connections[0].dispose).toHaveBeenCalledOnce()
    if (stage === 'connect') expect(ssh.unlink).not.toHaveBeenCalled()
  })

  it('uses one connection for gallery deletion', async () => {
    expect(await removeFileFromSFTPInMain({ ...config, uploadPath: '\\images' }, 'photo.png')).toBe(true)
    expect(ssh.connect).toHaveBeenCalledOnce()
    expect(ssh.unlink).toHaveBeenCalledWith('/images/photo.png', expect.any(Function))
    expect(ssh.dispose).toHaveBeenCalledOnce()
  })

  it.each([
    '../outside.png',
    '../images/photo.png',
    '/absolute.png',
    'C:\\outside.png',
    '..\\outside.png',
    '.',
    'bad\0name',
    '*',
  ])('rejects gallery deletion outside its upload directory or with an invalid name: %s', async fileName => {
    expect(await removeFileFromSFTPInMain({ ...config, uploadPath: '/images' }, fileName)).toBe(false)
    expect(ssh.connect).not.toHaveBeenCalled()
    expect(ssh.unlink).not.toHaveBeenCalled()
  })

  it.each(['connect', 'requestSFTP', 'unlink'] as const)(
    'settles deletion and closes the connection on %s failure',
    async stage => {
      if (stage === 'unlink') {
        ssh.unlink.mockImplementation((_remote, callback) => callback(new Error('Unlink failed')))
      } else {
        ssh[stage].mockRejectedValue(new Error('Connection failed'))
      }
      expect(await removeFileFromSFTPInMain({ ...config, uploadPath: '/images' }, 'photo.png')).toBe(false)
      expect(ssh.dispose).toHaveBeenCalledOnce()
    },
  )
})

describe('SFTP batch transfers', () => {
  const fileArray = ['first.png', 'second.png'].map(fileName => ({
    alias: 'test',
    bucketName: 'sftp',
    region: 'sftp',
    key: `album/${fileName}`,
    filePath: fileName,
    fileName,
  }))

  it('reuses a connection, channel and prepared directories for a batch upload', async () => {
    await api.uploadBucketFile({ fileArray })

    expect(ssh.connect).toHaveBeenCalledOnce()
    expect(ssh.requestSFTP).toHaveBeenCalledOnce()
    expect(ssh.mkdir).toHaveBeenCalledOnce()
    expect(ssh.putFile).toHaveBeenCalledTimes(2)
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(state.queue.updateUploadTask.mock.calls.map(([task]) => task.status)).toEqual([
      uploadTaskSpecialStatus.uploaded,
      uploadTaskSpecialStatus.uploaded,
    ])
  })

  it('marks only the failed upload and continues using the active connection', async () => {
    ssh.putFile.mockRejectedValueOnce(new Error('Transfer failed'))

    await api.uploadBucketFile({ fileArray })

    expect(state.queue.updateUploadTask.mock.calls.map(([task]) => task.status)).toEqual([
      commonTaskStatus.failed,
      uploadTaskSpecialStatus.uploaded,
    ])
    expect(ssh.ext_openssh_rename).toHaveBeenCalledOnce()
    expect(ssh.unlink).toHaveBeenCalledOnce()
    expect(ssh.connect).toHaveBeenCalledOnce()
    expect(ssh.dispose).toHaveBeenCalledOnce()
  })

  it('reconnects for the next file after a lost connection and rebuilds the directory cache', async () => {
    ssh.putFile.mockImplementationOnce(async () => {
      ssh.isConnected.mockReturnValue(false)
      throw new Error('Connection lost')
    })
    ssh.connect.mockImplementation(async () => {
      ssh.isConnected.mockReturnValue(true)
    })

    await api.uploadBucketFile({ fileArray })

    expect(ssh.connect).toHaveBeenCalledTimes(2)
    expect(ssh.requestSFTP).toHaveBeenCalledTimes(2)
    expect(ssh.stat).toHaveBeenCalledTimes(2)
    expect(ssh.dispose).toHaveBeenCalledTimes(2)
    expect(state.queue.updateUploadTask.mock.calls.map(([task]) => task.status)).toEqual([
      commonTaskStatus.failed,
      uploadTaskSpecialStatus.uploaded,
    ])
  })

  it('reuses the download connection while reporting failures per file', async () => {
    ssh.getFile.mockRejectedValueOnce(new Error('Download failed'))

    await api.downloadBucketFile({ fileArray, downloadPath: path.resolve('downloads') })

    expect(ssh.connect).toHaveBeenCalledOnce()
    expect(ssh.requestSFTP).toHaveBeenCalledOnce()
    expect(ssh.getFile).toHaveBeenCalledTimes(2)
    expect(ssh.dispose).toHaveBeenCalledOnce()
    expect(state.queue.updateDownloadTask.mock.calls.map(([task]) => task.status)).toEqual([
      commonTaskStatus.failed,
      downloadTaskSpecialStatus.downloaded,
    ])
  })

  it('does not connect for empty or already queued batches', async () => {
    state.queue.getUploadTask.mockReturnValue({})
    state.queue.getDownloadTask.mockReturnValue({})

    for (const files of [[], fileArray]) {
      await api.uploadBucketFile({ fileArray: files })
      await api.downloadBucketFile({ fileArray: files, downloadPath: path.resolve('downloads') })
    }

    expect(ssh.connect).not.toHaveBeenCalled()
    expect(state.queue.addUploadTask).not.toHaveBeenCalled()
    expect(state.queue.addDownloadTask).not.toHaveBeenCalled()
  })

  it('reports every file when the batch cannot connect', async () => {
    ssh.connect.mockRejectedValue(new Error('Authentication failed'))

    await api.uploadBucketFile({ fileArray })

    expect(state.queue.updateUploadTask.mock.calls.map(([task]) => task.status)).toEqual([
      commonTaskStatus.failed,
      commonTaskStatus.failed,
    ])
    expect(ssh.putFile).not.toHaveBeenCalled()
    expect(ssh.dispose).toHaveBeenCalledTimes(2)
  })
})

describe('SFTP file management', () => {
  it('lists names and attributes without parsing shell output', async () => {
    const filename = 'two  spaces\t雪\nphoto.png'
    ssh.readdir.mockImplementationOnce((_remote, callback) =>
      callback(null, [
        folder('.'),
        folder('..'),
        folder('child'),
        entry(filename),
        entry('link', constants.S_IFLNK | 0o777),
      ]),
    )

    const result = await listFromProvider(
      api,
      'getBucketListBackstage',
      {
        prefix: '/album/',
        baseDir: '/album',
        webPath: 'images',
        customUrl: 'https://example.invalid',
      },
      state.send,
    )

    expect(result.success).toBe(true)
    expect(result.fullList).toHaveLength(3)
    expect(result.fullList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fileName: filename,
          key: `album/${filename}`,
          fileSize: 123,
          owner: '1000',
          group: '1000',
          permissions: '-rw-r--r--',
          mtime: new Date(1700000000000).toISOString(),
          url: `https://example.invalid/images/${filename}`,
        }),
        expect.objectContaining({ fileName: 'child', isDir: true, permissions: 'drwxr-xr-x' }),
        expect.objectContaining({ fileName: 'link', isDir: false, permissions: 'lrwxrwxrwx' }),
      ]),
    )
    expect(ssh.execCommand).not.toHaveBeenCalled()
  })

  it('removes directories from the leaves up and unlinks symlinks without traversing them', async () => {
    directories.add('/album')
    directories.add('/album/child')
    mockDirectories({
      '/album': [folder('.'), folder('..'), folder('child'), entry('link', constants.S_IFLNK | 0o777)],
      '/album/child': [entry('photo.png')],
    })

    expect(await api.deleteBucketFolder({ key: 'album' })).toBe(true)

    expect(ssh.readdir.mock.calls.map(([remote]) => remote)).toEqual(['/album', '/album/child'])
    expect(ssh.unlink.mock.calls.map(([remote]) => remote)).toEqual(['/album/child/photo.png', '/album/link'])
    expect(ssh.rmdir.mock.calls.map(([remote]) => remote)).toEqual(['/album/child', '/album'])
    expect(ssh.requestSFTP).toHaveBeenCalledOnce()
    expect(ssh.execCommand).not.toHaveBeenCalled()
  })

  it.each(['', '/', '.', '..', '/album/..', '\\album\\..', 'album/*'])(
    'refuses deletion of a normalized root or wildcard path: %s',
    async key => {
      expect(await api.deleteBucketFolder({ key })).toBe(false)
      expect(ssh.lstat).not.toHaveBeenCalled()
      expect(ssh.unlink).not.toHaveBeenCalled()
      expect(ssh.rmdir).not.toHaveBeenCalled()
    },
  )

  it('treats missing files as deleted but reports permission errors', async () => {
    ssh.unlink.mockImplementationOnce((_remote, callback) => callback({ code: 2 }))
    expect(await api.deleteBucketFile({ key: 'missing.png' })).toBe(true)
    ssh.unlink.mockImplementationOnce((_remote, callback) => callback({ code: 3 }))
    expect(await api.deleteBucketFile({ key: 'protected.png' })).toBe(false)
  })

  it('does not remove a parent when a child cannot be deleted', async () => {
    directories.add('/album')
    mockDirectories({ '/album': [entry('protected.png')] })
    ssh.unlink.mockImplementationOnce((_remote, callback) => callback({ code: 3 }))

    expect(await api.deleteBucketFolder({ key: 'album' })).toBe(false)
    expect(ssh.rmdir).not.toHaveBeenCalled()
  })

  it('unlinks a directory symlink even when its requested path has a trailing slash', async () => {
    expect(await api.deleteBucketFolder({ key: 'album/link/' })).toBe(true)
    expect(ssh.lstat).toHaveBeenCalledWith('/album/link', expect.any(Function))
    expect(ssh.unlink).toHaveBeenCalledWith('/album/link', expect.any(Function))
    expect(ssh.readdir).not.toHaveBeenCalled()
    expect(ssh.rmdir).not.toHaveBeenCalled()
  })
})
