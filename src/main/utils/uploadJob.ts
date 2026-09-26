import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { setMaxListeners } from 'node:events'

import type { WebContents } from 'electron'
import type { IUploadOptions } from 'piclist'

export const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000

export interface UploadJobOptions {
  origin?: WebContents
  profile?: IUploadOptions
  signal?: AbortSignal
  timeoutMs?: number
}

export interface UploadJobContext {
  readonly id: string
  // Keep the originating window's WebContents, never a later available window.
  readonly origin: WebContents | undefined
  readonly requestedProfile: Readonly<IUploadOptions>
}

export class UploadJobError extends Error {
  constructor(readonly reason: 'failed' | 'cancelled' | 'timeout') {
    super(`Upload ${reason}`)
  }
}

const jobs = new AsyncLocalStorage<UploadJob>()
export const currentUploadJob = () => jobs.getStore()

export function sendToWindow(origin: WebContents | undefined, channel: string, ...args: unknown[]): void {
  try {
    if (origin && !origin.isDestroyed()) origin.send(channel, ...args)
  } catch {
    // A renderer can disappear between the liveness check and send.
  }
}

export class UploadJob {
  readonly context: UploadJobContext
  private readonly controller = new AbortController()
  private readonly externalSignal?: AbortSignal
  private readonly timeoutMs: number
  private started = false
  private settled = false

  constructor(options: UploadJobOptions = {}) {
    this.context = Object.freeze({
      id: randomUUID(),
      origin: options.origin,
      requestedProfile: Object.freeze({ ...options.profile }),
    })
    this.externalSignal = options.signal
    this.timeoutMs =
      Number.isFinite(options.timeoutMs) && options.timeoutMs! > 0 ? options.timeoutMs! : UPLOAD_TIMEOUT_MS
    // A batch can have many rename dialogs, each owning an abort subscription.
    setMaxListeners(0, this.signal)
  }

  get signal(): AbortSignal {
    return this.controller.signal
  }

  cancel(reason: 'cancelled' | 'timeout' = 'cancelled'): void {
    if (!this.settled) this.controller.abort(new UploadJobError(reason))
  }

  throwIfStopped(): void {
    this.signal.throwIfAborted()
    if (this.settled) throw new UploadJobError('cancelled')
  }

  reportProgress(progress: number): void {
    if (!this.settled && !this.signal.aborted && Number.isFinite(progress)) {
      this.sendProgress(Math.max(0, Math.min(99, progress)), 'uploading')
    }
  }

  private sendProgress(progress: number, status: IUploadProgress['status']): void {
    sendToWindow(this.context.origin, 'uploadProgress', {
      jobId: this.context.id,
      progress,
      status,
    } satisfies IUploadProgress)
  }

  private wait<T>(work: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.throwIfStopped()
      const onAbort = () => reject(this.signal.reason)
      this.signal.addEventListener('abort', onAbort, { once: true })
      // Core plugins have no shared abort API. Consume late results and rejections after cancellation.
      Promise.resolve()
        .then(() => {
          this.throwIfStopped()
          return work()
        })
        .then(resolve, reject)
        .finally(() => this.signal.removeEventListener('abort', onAbort))
    })
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (currentUploadJob() === this) return this.wait(work)
    this.throwIfStopped()
    if (this.started) throw new Error('Upload job already started')
    this.started = true
    const onCancel = () => this.cancel()
    const origin = this.context.origin
    const timer = setTimeout(() => this.cancel('timeout'), this.timeoutMs)
    this.externalSignal?.addEventListener('abort', onCancel, { once: true })
    origin?.on('destroyed', onCancel)
    if (this.externalSignal?.aborted || origin?.isDestroyed()) onCancel()
    return jobs.run(this, async () => {
      try {
        this.reportProgress(0)
        const result = await this.wait(work)
        this.throwIfStopped()
        this.sendProgress(100, 'completed')
        return result
      } catch (error) {
        this.sendProgress(-1, error instanceof UploadJobError ? error.reason : 'failed')
        this.controller.abort(error instanceof UploadJobError ? error : new UploadJobError('failed'))
        throw error
      } finally {
        this.settled = true
        clearTimeout(timer)
        this.externalSignal?.removeEventListener('abort', onCancel)
        origin?.removeListener('destroyed', onCancel)
        // Close any still-pending dialogs, including siblings of a failed dialog.
        this.controller.abort(new UploadJobError('cancelled'))
      }
    })
  }
}

// Nested upload APIs propagate errors to the request boundary, which owns settlement.
export async function withUploadJob<T>(job: UploadJob, work: () => Promise<T>, fallback: () => T): Promise<T> {
  if (currentUploadJob() === job) return job.run(work)
  try {
    return await job.run(work)
  } catch {
    return fallback()
  }
}
