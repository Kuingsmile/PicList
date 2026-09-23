import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type UploadTaskQueueManager from '../src/main/utils/uploadTaskQueue'

const state = vi.hoisted(() => ({
  upload: vi.fn(),
  insert: vi.fn(),
  pasteTemplate: vi.fn(),
  copyUrl: vi.fn(),
  remove: vi.fn(),
  persist: vi.fn(),
  send: vi.fn(),
  notification: vi.fn(),
}))

vi.mock('@core/datastore', () => ({ GalleryDB: { getInstance: () => ({ insert: state.insert }) } }))
vi.mock('@core/datastore/dirs', () => ({ dataDir: () => '/mock-app' }))
vi.mock('@core/picgo', () => ({
  default: {
    getConfig: () => ({ settings: { deleteLocalFile: true } }),
    log: { info: vi.fn(), error: vi.fn() },
  },
}))
vi.mock('apis/app/uploader', () => ({
  default: { setWebContents: () => ({ uploadReturnCtx: state.upload }) },
}))
vi.mock('apis/app/window/windowManager', () => ({
  default: { getAvailableWindow: vi.fn(), get: () => ({ webContents: { send: state.send } }) },
}))
vi.mock('electron', () => ({
  Notification: class {
    show = state.notification
  },
}))
vi.mock('fs-extra', () => ({
  default: {
    existsSync: () => false,
    statSync: () => ({ size: 1024 }),
    ensureFileSync: vi.fn(),
    writeFileSync: state.persist,
    remove: state.remove,
  },
}))
vi.mock('~/i18n/index', () => ({ t: (key: string) => key }))
vi.mock('~/utils/common', () => ({ handleCopyUrl: state.copyUrl, handleUrlEncodeWithSetting: (url: string) => url }))
vi.mock('~/utils/configPaths', () => import('../src/main/utils/configPaths'))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))
vi.mock('~/utils/pasteTemplate', () => ({ default: state.pasteTemplate }))
vi.mock('~/utils/uploadResult', () => import('../src/main/utils/uploadResult'))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const uploaded = () => ({ ctx: { output: [{ imgUrl: 'https://example.invalid/upload.png', inputIndex: 0 }] } })
const flushTasks = () => new Promise<void>(resolve => setImmediate(resolve))
let queue: UploadTaskQueueManager
let uploads: ReturnType<typeof deferred<ReturnType<typeof uploaded>>>[]
let activeUploads: number
let maxActiveUploads: number

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  uploads = []
  activeUploads = 0
  maxActiveUploads = 0
  state.upload.mockImplementation(() => {
    const upload = deferred<ReturnType<typeof uploaded>>()
    uploads.push(upload)
    activeUploads++
    maxActiveUploads = Math.max(maxActiveUploads, activeUploads)
    return upload.promise.finally(() => activeUploads--)
  })
  state.insert.mockImplementation(async item => ({ ...item, id: 'saved' }))
  state.pasteTemplate.mockResolvedValue(['link', ''])
  state.remove.mockResolvedValue(undefined)
  const { default: Manager } = await import('../src/main/utils/uploadTaskQueue')
  queue = Manager.getInstance()
})

afterEach(async () => {
  queue.cancelQueue()
  uploads.forEach(upload => upload.resolve(uploaded()))
  await flushTasks()
  vi.useRealTimers()
})

async function startTwoTasks() {
  const tasks = queue.addTasks([{ path: '/first.png' }, { path: '/second.png' }])
  void queue.startQueue(1)
  await flushTasks()
  expect(state.upload).toHaveBeenCalledOnce()
  return tasks
}

async function settleUpload(outcome: string, index = 0) {
  if (outcome === 'success') uploads[index].resolve(uploaded())
  else uploads[index].reject(new Error('Test upload failed'))
  await flushTasks()
}

describe('upload task queue worker', () => {
  it('keeps one upload active through repeated pause/resume and honors the interval', async () => {
    const tasks = await startTwoTasks()
    for (let i = 0; i < 3; i++) {
      queue.pauseQueue()
      void queue.resumeQueue()
      await flushTasks()
    }
    expect(tasks.map(task => task.status)).toEqual(['uploading', 'pending'])
    expect(state.upload).toHaveBeenCalledOnce()

    await settleUpload('success')
    expect(tasks.map(task => task.status)).toEqual(['completed', 'pending'])
    await vi.advanceTimersByTimeAsync(999)
    expect(state.upload).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(state.upload).toHaveBeenCalledTimes(2)
    await settleUpload('success', 1)

    expect(tasks.map(task => task.status)).toEqual(['completed', 'completed'])
    expect(maxActiveUploads).toBe(1)
    expect(queue.isRunning()).toBe(false)
    expect(state.notification).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('acknowledges start and resume while an upload is still pending', async () => {
    queue.addTasks([{ path: '/first.png' }])
    const started = vi.fn()
    const resumed = vi.fn()
    void queue.startQueue().then(started)
    await flushTasks()
    expect(started).toHaveBeenCalledOnce()
    queue.pauseQueue()
    void queue.resumeQueue().then(resumed)
    await flushTasks()
    expect(resumed).toHaveBeenCalledOnce()
    expect(activeUploads).toBe(1)
  })

  it.each([500, 1500])('preserves the interval when paused for %s ms between uploads', async pauseMs => {
    await startTwoTasks()
    await settleUpload('success')
    await vi.advanceTimersByTimeAsync(250)
    queue.pauseQueue()
    await vi.advanceTimersByTimeAsync(pauseMs)
    expect(state.upload).toHaveBeenCalledOnce()
    void queue.resumeQueue()
    void queue.resumeQueue()
    await flushTasks()
    if (pauseMs < 750) {
      expect(state.upload).toHaveBeenCalledOnce()
      await vi.advanceTimersByTimeAsync(249)
      expect(state.upload).toHaveBeenCalledOnce()
      await vi.advanceTimersByTimeAsync(1)
    }
    expect(state.upload).toHaveBeenCalledTimes(2)
    expect(maxActiveUploads).toBe(1)
  })

  it('lets the current upload finish while paused and wakes on resume', async () => {
    const tasks = await startTwoTasks()
    queue.pauseQueue()
    await settleUpload('success')
    await vi.advanceTimersByTimeAsync(2000)
    expect(tasks.map(task => task.status)).toEqual(['completed', 'pending'])
    expect(queue.isPaused()).toBe(true)
    void queue.resumeQueue()
    await flushTasks()
    expect(state.upload).toHaveBeenCalledTimes(2)
  })

  it('retries serially and pauses after retry exhaustion until resumed', async () => {
    queue.updateSettings({ maxRetryCount: 1, pauseOnError: true })
    const tasks = await startTwoTasks()
    await settleUpload('failure')
    expect(tasks[0]).toMatchObject({ status: 'pending', retryCount: 1 })
    await vi.advanceTimersByTimeAsync(1000)
    expect(state.upload).toHaveBeenCalledTimes(2)
    await settleUpload('failure', 1)
    expect(tasks[0]).toMatchObject({ status: 'failed', retryCount: 1 })
    expect(queue.isPaused()).toBe(true)
    await vi.advanceTimersByTimeAsync(2000)
    expect(state.upload).toHaveBeenCalledTimes(2)
    void queue.resumeQueue()
    await flushTasks()
    expect(state.upload).toHaveBeenCalledTimes(3)
    await settleUpload('success', 2)
    expect(queue.isRunning()).toBe(false)
    expect(maxActiveUploads).toBe(1)
  })

  it('starts newly added work while the previous worker is exiting', async () => {
    void queue.startQueue()
    const [task] = queue.addTasks([{ path: '/new.png' }])
    void queue.startQueue()
    await flushTasks()
    expect(state.upload).toHaveBeenCalledExactlyOnceWith(['/new.png'])
    await settleUpload('success')
    expect(task.status).toBe('completed')
    expect(queue.isRunning()).toBe(false)
  })
})

describe('upload task queue cancellation', () => {
  it.each([
    { outcome: 'success', maxRetryCount: 3 },
    { outcome: 'failure', maxRetryCount: 3 },
    { outcome: 'failure', maxRetryCount: 0 },
  ])(
    'keeps Cancel All terminal after $outcome with maxRetryCount=$maxRetryCount',
    async ({ outcome, maxRetryCount }) => {
      queue.updateSettings({ maxRetryCount, pauseOnError: true })
      const tasks = await startTwoTasks()
      queue.cancelQueue()
      const cancelledTasks = tasks.map(task => ({ ...task }))
      const persisted = state.persist.mock.calls.length
      await settleUpload(outcome)
      await vi.advanceTimersByTimeAsync(5000)

      expect(tasks).toEqual(cancelledTasks)
      expect(tasks.map(task => task.status)).toEqual(['cancelled', 'cancelled'])
      expect(queue.getQueueStatus().config).toMatchObject({ isRunning: false, isPaused: false })
      expect(state.upload).toHaveBeenCalledOnce()
      expect(state.persist).toHaveBeenCalledTimes(persisted)
      expect(state.insert).not.toHaveBeenCalled()
      expect(state.copyUrl).not.toHaveBeenCalled()
      expect(state.remove).not.toHaveBeenCalled()
      expect(state.notification).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it.each(['success', 'failure'])('keeps an individually cancelled upload terminal after %s', async outcome => {
    const tasks = await startTwoTasks()
    expect(queue.cancelTask(tasks[0].id)).toBe(true)
    const cancelledTask = { ...tasks[0] }
    void queue.resumeQueue()
    await flushTasks()
    expect(state.upload).toHaveBeenCalledOnce()
    await settleUpload(outcome)
    expect(tasks[0]).toEqual(cancelledTask)
    await vi.advanceTimersByTimeAsync(999)
    expect(state.upload).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    await settleUpload('success', 1)
    expect(tasks.map(task => task.status)).toEqual(['cancelled', 'completed'])
    expect(maxActiveUploads).toBe(1)
  })

  it.each([
    ['cancel', 'success'],
    ['cancel', 'failure'],
    ['clear', 'success'],
    ['clear', 'failure'],
  ])('waits for an old transfer after %s followed by %s', async (action, outcome) => {
    queue.updateSettings({ maxRetryCount: 0, pauseOnError: true })
    const tasks = await startTwoTasks()
    if (action === 'clear') queue.clearAllTasks()
    else queue.cancelQueue()
    const cancelledTasks = tasks.map(task => ({ ...task }))
    queue.updateSettings({ autoStart: true })
    const [newTask] = queue.addTasks([{ path: '/new.png' }])
    void queue.startQueue()
    void queue.resumeQueue()
    await flushTasks()
    expect(state.upload).toHaveBeenCalledOnce()
    expect(newTask.status).toBe('pending')
    await settleUpload(outcome)
    expect(tasks).toEqual(cancelledTasks)
    expect(state.insert).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(999)
    expect(state.upload).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(state.upload).toHaveBeenLastCalledWith(['/new.png'])
    await settleUpload('success', 1)
    expect(newTask.status).toBe('completed')
    expect(maxActiveUploads).toBe(1)
    expect(queue.isRunning()).toBe(false)
  })

  it('skips pending tasks cancelled before their turn', async () => {
    const tasks = await startTwoTasks()
    expect(queue.cancelTask(tasks[1].id)).toBe(true)
    await settleUpload('success')
    await vi.advanceTimersByTimeAsync(5000)
    expect(state.upload).toHaveBeenCalledOnce()
    expect(tasks.map(task => task.status)).toEqual(['completed', 'cancelled'])
    expect(queue.isRunning()).toBe(false)
  })

  it('ignores the result of an upload removed before settlement', async () => {
    const tasks = await startTwoTasks()
    expect(queue.removeTask(tasks[0].id)).toBe(true)
    const removedTask = { ...tasks[0] }
    await settleUpload('success')
    expect(tasks[0]).toEqual(removedTask)
    expect(state.insert).not.toHaveBeenCalled()
    expect(queue.getAllTasks()).toEqual([tasks[1]])
    await vi.advanceTimersByTimeAsync(1000)
    await settleUpload('success', 1)
    expect(tasks[1].status).toBe('completed')
  })

  it.each(['template', 'gallery'])('checks cancellation after awaiting %s processing', async stage => {
    const processing = deferred<void>()
    if (stage === 'template') {
      state.pasteTemplate.mockImplementationOnce(async () => {
        await processing.promise
        return ['link', '']
      })
    } else {
      state.insert.mockImplementationOnce(async item => {
        await processing.promise
        return { ...item, id: 'saved' }
      })
    }
    const tasks = await startTwoTasks()
    await settleUpload('success')
    expect(tasks[0].status).toBe('uploading')
    queue.cancelQueue()
    const cancelledTask = { ...tasks[0] }
    const [newTask] = queue.addTasks([{ path: '/new.png' }])
    void queue.startQueue()
    await flushTasks()
    expect(state.upload).toHaveBeenCalledOnce()
    processing.resolve()
    await flushTasks()
    expect(tasks[0]).toEqual(cancelledTask)
    expect(state.insert).toHaveBeenCalledTimes(stage === 'template' ? 0 : 1)
    expect(state.copyUrl).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1000)
    await settleUpload('success', 1)
    expect(newTask.status).toBe('completed')
  })

  it.each(['paused', 'interval'])('can cancel and restart a worker waiting on %s', async waitingOn => {
    await startTwoTasks()
    if (waitingOn === 'paused') queue.pauseQueue()
    await settleUpload('success')
    queue.cancelQueue()
    const [newTask] = queue.addTasks([{ path: '/new.png' }])
    void queue.startQueue()
    await flushTasks()
    expect(state.upload).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1000)
    expect(state.upload).toHaveBeenCalledTimes(2)
    await settleUpload('success', 1)
    expect(newTask.status).toBe('completed')
    expect(vi.getTimerCount()).toBe(0)
  })
})
