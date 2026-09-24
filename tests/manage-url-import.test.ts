import os from 'node:os'
import path from 'node:path'
import { PassThrough, Readable } from 'node:stream'

import axios from 'axios'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import UpDownTaskQueue from '../src/main/manage/datastore/upDownTaskQueue'
import { clearTempFolder, downloadFileFromUrl } from '../src/main/manage/utils/common'
import { commonTaskStatus, uploadTaskSpecialStatus } from '../src/main/utils/enum'

const state = vi.hoisted(() => ({ tempDir: '' }))

vi.mock('axios', () => ({ default: vi.fn() }))
vi.mock('@core/datastore/dirs', () => ({ dataDir: () => state.tempDir }))
vi.mock('electron', () => ({ app: { getPath: () => state.tempDir } }))
vi.mock('#/utils/url', () => import('../src/universal/utils/url'))
vi.mock('~/utils/common', () => ({ formatHttpProxy: vi.fn() }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))

const contents = [Buffer.from('first image bytes'), Buffer.from('second image bytes')]
let imported: IUrlImportFile[]

async function download(urls: string[]) {
  const files = await downloadFileFromUrl(urls)
  imported.push(...files)
  return files
}

function queueUpload(file: IUrlImportFile, id = file.filePath) {
  UpDownTaskQueue.getInstance().addUploadTask({
    id,
    sourceFilePath: file.filePath.replace(/\\/g, '/'),
    sourceFileName: file.fileName,
    targetFilePath: file.fileName,
    progress: 0,
    status: commonTaskStatus.queuing,
  })
  return id
}

beforeEach(() => {
  vi.resetAllMocks()
  state.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'piclist-url-import-'))
  imported = []
  contents.forEach(content => {
    vi.mocked(axios).mockResolvedValueOnce({ data: Readable.from([content]) })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  const queue = UpDownTaskQueue.getInstance()
  for (const task of queue.getAllUploadTask()) {
    queue.updateUploadTask({ id: task.id, status: commonTaskStatus.failed })
  }
  for (const file of imported) {
    const id = queueUpload(file)
    queue.updateUploadTask({ id, status: commonTaskStatus.failed })
  }
  queue.clearAllTaskQueue()
  fs.removeSync(state.tempDir)
})

describe('URL imports', () => {
  it.each([
    ['different hosts', ['https://first.example.invalid/photo.png', 'https://second.example.invalid/photo.png']],
    ['different queries', ['https://example.invalid/photo.png?image=1', 'https://example.invalid/photo.png?image=2']],
  ])('keeps separate paths and content for the same basename with %s', async (_, urls) => {
    const files = await download(urls)

    expect(new Set(files.map(file => file.filePath)).size).toBe(2)
    expect(new Set(files.map(file => path.dirname(file.filePath))).size).toBe(2)
    expect(files.map(file => file.fileName)).toEqual(['photo.png', 'photo.png'])
    expect(files.map(file => file.fileSize)).toEqual(contents.map(content => content.length))
    expect(await Promise.all(files.map(file => fs.readFile(file.filePath)))).toEqual(contents)
    urls.forEach((url, index) => {
      expect(axios).toHaveBeenNthCalledWith(index + 1, { method: 'get', url, responseType: 'stream' })
    })
  })

  it('isolates simultaneous imports of the same URL', async () => {
    const url = 'https://example.invalid/photo.png'
    const batches = await Promise.all([download([url]), download([url])])
    const files = batches.flat()

    expect(new Set(files.map(file => file.filePath)).size).toBe(2)
    const downloaded = await Promise.all(files.map(file => fs.readFile(file.filePath)))
    expect(downloaded).toEqual(expect.arrayContaining(contents))
  })

  it('keeps the display name independent of local filename sanitization and ignores query paths and fragments', async () => {
    const [file] = await download(['https://example.invalid/photo:original.png?next=/other.png#preview'])

    expect(file.fileName).toBe('photo:original.png')
    expect(path.basename(file.filePath)).toBe('photo_original.png')
    expect(await fs.readFile(file.filePath)).toEqual(contents[0])
  })

  it.each(['request', 'response', 'writer'])('removes only the failed batch on a %s error', async failure => {
    const [earlierFile] = await download(['https://earlier.example.invalid/photo.png'])
    const error = new Error('Download failed')
    if (failure === 'request') {
      vi.mocked(axios).mockRejectedValueOnce(error)
    } else if (failure === 'response') {
      vi.mocked(axios).mockResolvedValueOnce({
        data: Readable.from(
          (async function* () {
            yield Buffer.from('partial image')
            throw error
          })(),
        ),
      })
    } else {
      vi.mocked(axios).mockResolvedValueOnce({ data: Readable.from([contents[0]]) })
      const createWriteStream = fs.createWriteStream.bind(fs)
      vi.spyOn(fs, 'createWriteStream')
        .mockImplementationOnce(createWriteStream)
        .mockImplementationOnce(filePath => createWriteStream(path.join(filePath.toString(), 'missing', 'file')))
    }

    const result = downloadFileFromUrl([
      'https://first.example.invalid/photo.png',
      'https://second.example.invalid/photo.png',
    ])
    if (failure === 'writer') {
      await expect(result).rejects.toMatchObject({ code: 'ENOENT' })
    } else {
      await expect(result).rejects.toBe(error)
    }

    expect(await fs.readdir(path.join(state.tempDir, 'piclistTemp'))).toEqual([
      path.basename(path.dirname(earlierFile.filePath)),
    ])
    expect(await fs.readFile(earlierFile.filePath)).toEqual(contents[0])
  })

  it('protects an unfinished download from temporary-folder cleanup', async () => {
    const response = new PassThrough()
    vi.mocked(axios).mockReset().mockResolvedValue({ data: response })
    const pending = download(['https://example.invalid/photo.png'])
    await vi.waitFor(() => expect(axios).toHaveBeenCalledOnce())

    clearTempFolder()
    response.end(contents[0])

    const [file] = await pending
    expect(await fs.readFile(file.filePath)).toEqual(contents[0])
  })
})

describe('imported file lifetime', () => {
  it.each([uploadTaskSpecialStatus.uploaded, commonTaskStatus.failed, commonTaskStatus.canceled])(
    'cleans up a completed upload (%s) without touching pending uploads or local files',
    async status => {
      const files = await download([
        'https://first.example.invalid/photo.png',
        'https://second.example.invalid/photo.png',
      ])
      const queue = UpDownTaskQueue.getInstance()
      const ids = files.map(file => queueUpload(file))
      const localFile = path.join(state.tempDir, 'photo.png')
      await fs.writeFile(localFile, 'local file')
      queueUpload({ filePath: localFile, fileName: 'photo.png', fileSize: 10 }, 'local')

      queue.updateUploadTask({ id: ids[0], progress: 100, status: uploadTaskSpecialStatus.uploading })
      clearTempFolder()
      expect(await Promise.all(files.map(file => fs.readFile(file.filePath)))).toEqual(contents)
      expect(queue.getAllUploadTask().map(task => task.sourceFileName)).toEqual(['photo.png', 'photo.png', 'photo.png'])

      queue.updateUploadTask({ id: ids[0], status })
      expect(fs.existsSync(path.dirname(files[0].filePath))).toBe(false)
      expect(await fs.readFile(files[1].filePath)).toEqual(contents[1])

      queue.updateUploadTask({ id: ids[1], status })
      queue.updateUploadTask({ id: 'local', status })
      expect(await fs.readdir(path.join(state.tempDir, 'piclistTemp'))).toEqual([])
      expect(await fs.readFile(localFile, 'utf8')).toBe('local file')
    },
  )

  it('retains a file until all consuming uploads finish, even after clearing their visible tasks', async () => {
    const [file] = await download(['https://example.invalid/photo.png'])
    const queue = UpDownTaskQueue.getInstance()
    queueUpload(file, 'first')
    queueUpload(file, 'second')
    queue.clearUploadTaskQueue()
    clearTempFolder()

    expect(await fs.readFile(file.filePath)).toEqual(contents[0])
    queue.updateUploadTask({ id: 'first', status: uploadTaskSpecialStatus.uploaded })
    expect(await fs.readFile(file.filePath)).toEqual(contents[0])

    queue.updateUploadTask({ id: 'second', status: commonTaskStatus.failed })
    expect(fs.existsSync(path.dirname(file.filePath))).toBe(false)
  })

  it('cleans old temporary files without deleting an import waiting to be queued', async () => {
    const [file] = await download(['https://example.invalid/photo.png'])
    const oldFile = path.join(state.tempDir, 'piclistTemp', 'photo.png')
    await fs.writeFile(oldFile, 'old import')

    clearTempFolder()

    expect(fs.existsSync(oldFile)).toBe(false)
    expect(await fs.readFile(file.filePath)).toEqual(contents[0])
  })
})
