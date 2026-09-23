import { describe, expect, it, vi } from 'vitest'

import { ConcurrencyPromisePool } from '../src/main/manage/utils/common'

vi.mock('electron', () => ({ app: {} }))
vi.mock('#/utils/url', () => import('../src/universal/utils/url'))
vi.mock('~/utils/common', () => ({ formatHttpProxy: vi.fn() }))
vi.mock('~/utils/enum', () => import('../src/main/utils/enum'))

const flushTasks = () => new Promise<void>(resolve => setImmediate(resolve))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })
  return { promise, resolve }
}

describe('ConcurrencyPromisePool', () => {
  it.each([false, true])('runs queued downloads after a failure (synchronous: %s)', async synchronous => {
    const pool = new ConcurrencyPromisePool(1)
    const error = new Error('Download failed')
    const second = vi.fn(async () => 'second')
    const third = vi.fn(async () => 'third')

    const result = pool.all([
      () => {
        if (synchronous) throw error
        return Promise.reject(error)
      },
      second,
      third,
    ])

    await expect(result).rejects.toBe(error)
    await flushTasks()

    expect(second).toHaveBeenCalledOnce()
    expect(third).toHaveBeenCalledOnce()
    expect(pool.runningNum).toBe(0)
    expect(pool.queue).toHaveLength(0)
  })

  it('rejects with the first failure while continuing after multiple failures', async () => {
    const pool = new ConcurrencyPromisePool(2)
    const pending = deferred<string>()
    const third = vi.fn(() => pending.promise)
    const fourth = vi.fn(async () => 'fourth')

    const result = pool.all([
      () => Promise.reject(false),
      () => Promise.reject(new Error('Another download failed')),
      third,
      fourth,
    ])

    await expect(result).rejects.toBe(false)
    await flushTasks()

    expect(third).toHaveBeenCalledOnce()
    expect(fourth).toHaveBeenCalledOnce()
    expect(pool.runningNum).toBe(1)
    expect(pool.queue).toHaveLength(0)

    pending.resolve('third')
    await flushTasks()
    expect(pool.runningNum).toBe(0)
  })

  it('limits active tasks and returns successful results in input order', async () => {
    const pool = new ConcurrencyPromisePool(2)
    const first = deferred<string>()
    const second = deferred<string>()
    const third = vi.fn(async () => 'third')
    const result = pool.all([() => first.promise, () => second.promise, third])

    await flushTasks()
    expect(third).not.toHaveBeenCalled()
    expect(pool.runningNum).toBe(2)

    second.resolve('second')
    await flushTasks()
    expect(third).toHaveBeenCalledOnce()
    expect(pool.runningNum).toBe(1)

    first.resolve('first')
    await expect(result).resolves.toEqual(['first', 'second', 'third'])
    expect(pool.runningNum).toBe(0)
    expect(pool.queue).toHaveLength(0)
  })

  it('resolves empty and omitted batches immediately', async () => {
    const pool = new ConcurrencyPromisePool(1)
    const empty = vi.fn()
    const omitted = vi.fn()

    void pool.all([]).then(empty)
    void pool.all().then(omitted)
    await flushTasks()

    expect(empty).toHaveBeenCalledExactlyOnceWith([])
    expect(omitted).toHaveBeenCalledExactlyOnceWith([])
    expect(pool.runningNum).toBe(0)
  })

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity])('rejects invalid concurrency limit %s', limit => {
    expect(() => new ConcurrencyPromisePool(limit)).toThrow(RangeError)
    expect(() => new ConcurrencyPromisePool(limit)).toThrow('Concurrency limit must be a positive integer')
  })

  it('keeps results separate when the pool is reused', async () => {
    const pool = new ConcurrencyPromisePool(1)

    await expect(pool.all([async () => 'first'])).resolves.toEqual(['first'])
    await expect(pool.all([async () => 'second'])).resolves.toEqual(['second'])
    await expect(pool.all([])).resolves.toEqual([])
    expect(pool.runningNum).toBe(0)
  })

  it('shares the limit across overlapping batches without mixing their outcomes', async () => {
    const pool = new ConcurrencyPromisePool(1)
    const pending = deferred<string>()
    const firstResult = pool.all([() => pending.promise])
    const error = new Error('Second batch failed')
    const secondResult = pool.all([() => Promise.reject(error)])
    const rejected = expect(secondResult).rejects.toBe(error)
    const last = vi.fn(async () => 'last')
    const lastResult = pool.all([last])

    await expect(pool.all([])).resolves.toEqual([])
    expect(last).not.toHaveBeenCalled()
    expect(pool.runningNum).toBe(1)

    pending.resolve('first')
    await expect(firstResult).resolves.toEqual(['first'])
    await rejected
    await expect(lastResult).resolves.toEqual(['last'])
    expect(last).toHaveBeenCalledOnce()
    expect(pool.runningNum).toBe(0)
    expect(pool.queue).toHaveLength(0)
  })
})
