export interface TransferLimits {
  globalConcurrency: number
  accountConcurrency: number
  memoryBytes: number
  multipartConcurrency: number
}

export const DEFAULT_TRANSFER_LIMITS: TransferLimits = {
  globalConcurrency: 4,
  accountConcurrency: 2,
  memoryBytes: 256 * 1024 * 1024,
  multipartConcurrency: 2,
}

export type TransferFailure = 'file' | 'unsupported' | 'size' | 'memory' | 'provider' | 'aborted'
export type TransferOutcome =
  { success: true; status: 'uploaded' } | { success: false; status: 'failed' | 'canceled'; reason: TransferFailure }

// Only these known reasons may be exposed in the task list. SDK errors often contain secrets.
export class TransferError extends Error {
  constructor(readonly reason: TransferFailure) {
    super(reason)
  }
}

export interface TransferResources {
  slots: number
  memoryBytes: number
  partSize?: number
}

export interface TransferContext extends TransferResources {
  signal: AbortSignal
}

interface TransferJob {
  id: string
  accountId: string
  accountConcurrency?: number
  resources: (limits: TransferLimits) => TransferResources
  run: (context: TransferContext) => Promise<void>
  signal?: AbortSignal
  onStart?: () => void
  onCancel?: () => void
  onFinish?: (outcome: TransferOutcome) => void
}

interface PendingTransfer {
  job: TransferJob
  controller: AbortController
  resolve: (outcome: TransferOutcome) => void
  detach: () => void
  resources?: TransferResources
}

const positiveInteger = (value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.min(max, Math.floor(value)) : fallback

export class TransferScheduler {
  private limits: TransferLimits
  private pending: PendingTransfer[] = []
  private jobs = new Map<string, PendingTransfer>()
  private accounts = new Map<string, number>()
  private activeSlots = 0
  private activeMemory = 0
  private draining = false

  constructor(limits: Partial<TransferLimits> = {}) {
    this.limits = { ...DEFAULT_TRANSFER_LIMITS }
    this.configure(limits)
  }

  configure(limits: Partial<TransferLimits>): void {
    this.limits = {
      globalConcurrency: positiveInteger(limits.globalConcurrency, DEFAULT_TRANSFER_LIMITS.globalConcurrency, 64),
      accountConcurrency: positiveInteger(limits.accountConcurrency, DEFAULT_TRANSFER_LIMITS.accountConcurrency, 64),
      memoryBytes: positiveInteger(limits.memoryBytes, DEFAULT_TRANSFER_LIMITS.memoryBytes),
      multipartConcurrency: positiveInteger(
        limits.multipartConcurrency,
        DEFAULT_TRANSFER_LIMITS.multipartConcurrency,
        64,
      ),
    }
    // Running transfers keep their reservations; lower limits only affect subsequent admission.
    this.drain()
  }

  schedule(job: TransferJob): Promise<TransferOutcome> {
    if (this.jobs.has(job.id)) throw new Error('Transfer ID is already active')
    return new Promise(resolve => {
      const transfer: PendingTransfer = { job, controller: new AbortController(), resolve, detach: () => {} }
      this.jobs.set(job.id, transfer)
      this.pending.push(transfer)
      const cancel = () => this.cancel(job.id)
      job.signal?.addEventListener('abort', cancel, { once: true })
      transfer.detach = () => job.signal?.removeEventListener('abort', cancel)
      if (job.signal?.aborted) cancel()
      else this.drain()
    })
  }

  cancel(id: string): boolean {
    const transfer = this.jobs.get(id)
    if (!transfer || transfer.controller.signal.aborted) return false
    transfer.controller.abort()
    transfer.job.onCancel?.()
    if (!transfer.resources) {
      this.pending.splice(this.pending.indexOf(transfer), 1)
      this.finish(transfer, { success: false, status: 'canceled', reason: 'aborted' })
      this.drain()
    }
    // Never release an active reservation on abort alone. The provider must settle and close its inputs.
    return true
  }

  private finish(transfer: PendingTransfer, outcome: TransferOutcome): void {
    this.jobs.delete(transfer.job.id)
    transfer.detach()
    try {
      transfer.job.onFinish?.(outcome)
    } finally {
      transfer.resolve(outcome)
    }
  }

  private drain(): void {
    if (this.draining) return
    this.draining = true
    try {
      for (let index = 0; index < this.pending.length;) {
        const transfer = this.pending[index]
        const { job } = transfer
        const accountLimit = Math.min(this.limits.accountConcurrency, job.accountConcurrency ?? Infinity)
        let resources: TransferResources
        try {
          resources = job.resources({ ...this.limits, accountConcurrency: accountLimit })
          if (!Number.isSafeInteger(resources.memoryBytes) || resources.memoryBytes < 0)
            throw new TransferError('memory')
          if (resources.memoryBytes > this.limits.memoryBytes) throw new TransferError('memory')
          if (
            !Number.isInteger(resources.slots) ||
            resources.slots < 1 ||
            resources.slots > Math.min(accountLimit, this.limits.globalConcurrency)
          ) {
            throw new TransferError('unsupported')
          }
        } catch (error) {
          this.pending.splice(index, 1)
          this.finish(transfer, {
            success: false,
            status: 'failed',
            reason: error instanceof TransferError ? error.reason : 'file',
          })
          continue
        }
        const accountSlots = this.accounts.get(job.accountId) ?? 0
        if (
          this.activeSlots + resources.slots > this.limits.globalConcurrency ||
          accountSlots + resources.slots > accountLimit ||
          this.activeMemory + resources.memoryBytes > this.limits.memoryBytes
        ) {
          index++
          continue
        }
        this.pending.splice(index, 1)
        transfer.resources = resources
        this.activeSlots += resources.slots
        this.activeMemory += resources.memoryBytes
        this.accounts.set(job.accountId, accountSlots + resources.slots)
        void this.run(transfer)
      }
    } finally {
      this.draining = false
    }
  }

  private async run(transfer: PendingTransfer): Promise<void> {
    const { job, controller, resources } = transfer
    let outcome: TransferOutcome = { success: true, status: 'uploaded' }
    try {
      job.onStart?.()
      controller.signal.throwIfAborted()
      await job.run({ ...resources!, signal: controller.signal })
    } catch (error) {
      outcome = { success: false, status: 'failed', reason: error instanceof TransferError ? error.reason : 'provider' }
    }
    if (controller.signal.aborted) outcome = { success: false, status: 'canceled', reason: 'aborted' }
    this.activeSlots -= resources!.slots
    this.activeMemory -= resources!.memoryBytes
    const remaining = this.accounts.get(job.accountId)! - resources!.slots
    if (remaining) this.accounts.set(job.accountId, remaining)
    else this.accounts.delete(job.accountId)
    this.finish(transfer, outcome)
    this.drain()
  }
}

export const transferScheduler = new TransferScheduler()
