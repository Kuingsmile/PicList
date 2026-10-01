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
  onProgress?: (event: IUploadProgress) => void
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

const activeProgress = new Map<string, IUploadProgress>()
const progressObservers = new Map<WebContents, () => void>()

export function unsubscribeFromUploadProgress(observer: WebContents): void {
  progressObservers.get(observer)?.()
}

export function subscribeToUploadProgress(observer: WebContents): void {
  if (observer.isDestroyed()) return
  if (!progressObservers.has(observer)) {
    const cleanup = () => {
      progressObservers.delete(observer)
      observer.removeListener('destroyed', cleanup)
      observer.removeListener('did-start-loading', cleanup)
    }
    progressObservers.set(observer, cleanup)
    observer.once('destroyed', cleanup)
    observer.once('did-start-loading', cleanup)
  }
  // Subscribe only after the renderer has installed its listener, then replay
  // active jobs so opening/reloading the mini window cannot miss their start.
  for (const event of activeProgress.values()) sendToWindow(observer, 'uploadProgress', event)
}

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
  private readonly onProgress?: UploadJobOptions['onProgress']
  private started = false
  private settled = false
  private failureReason: unknown
  private progressDetails: Partial<IUploadProgress> = {}

  constructor(options: UploadJobOptions = {}) {
    this.context = Object.freeze({
      id: randomUUID(),
      origin: options.origin,
      requestedProfile: Object.freeze({ ...options.profile }),
    })
    this.externalSignal = options.signal
    this.onProgress = options.onProgress
    this.timeoutMs =
      Number.isFinite(options.timeoutMs) && options.timeoutMs! > 0 ? options.timeoutMs! : UPLOAD_TIMEOUT_MS
    // A batch can have many rename dialogs, each owning an abort subscription.
    setMaxListeners(0, this.signal)
  }

  get signal(): AbortSignal {
    return this.controller.signal
  }

  get failure(): unknown {
    return this.failureReason
  }

  cancel(reason: 'cancelled' | 'timeout' = 'cancelled'): void {
    if (!this.settled) this.controller.abort(new UploadJobError(reason))
  }

  throwIfStopped(): void {
    this.signal.throwIfAborted()
    if (this.settled) throw new UploadJobError('cancelled')
  }

  reportProgress(progress: number, details?: ICoreUploadProgress): void {
    if (this.settled || this.signal.aborted || !Number.isFinite(progress)) return
    if (details) {
      const phase = details.phase === 'preparing' || details.phase === 'uploading' ? details.phase : 'finalizing'
      this.progressDetails = {
        phase,
        indeterminate: phase !== 'uploading' || details.progress === null,
        destination: details.destination,
        transferredBytes: details.transferredBytes,
        totalBytes: details.totalBytes,
        completedFiles: details.completedFiles,
        totalFiles: details.totalFiles,
      }
      this.sendProgress(Math.max(0, Math.min(100, details.progress ?? 0)), 'uploading')
    } else {
      this.progressDetails = {
        phase: progress <= 0 ? 'preparing' : progress >= 100 ? 'finalizing' : 'uploading',
        indeterminate: progress <= 0 || progress >= 100,
      }
      this.sendProgress(Math.max(0, Math.min(99, progress)), 'uploading')
    }
  }

  private sendProgress(progress: number, status: IUploadProgress['status']): void {
    const event: IUploadProgress = {
      ...this.progressDetails,
      jobId: this.context.id,
      progress,
      status,
      indeterminate: status === 'uploading' && this.progressDetails.indeterminate,
    }
    if (status === 'uploading') activeProgress.set(event.jobId, event)
    else activeProgress.delete(event.jobId)
    try {
      this.onProgress?.(event)
    } catch {
      // Progress observers do not own the transfer and must not fail it.
      console.error('Upload progress status update failed')
    }

    // The owner still receives its own events. Observers never become owners
    // and closing one must not cancel an upload started in another window.
    const recipients = new Set([this.context.origin, ...progressObservers.keys()])
    for (const recipient of recipients) sendToWindow(recipient, 'uploadProgress', event)
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
        this.failureReason = error
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
