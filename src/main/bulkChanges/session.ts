import {
  type BulkCandidate,
  type BulkIssue,
  bulkMap,
  type BulkOutcome,
  type BulkPlan,
  type BulkPolicy,
  type BulkSnapshot,
  canCommitBulkPlan,
  isBulkPolicy,
} from '../../shared/bulkChanges'

export interface BulkObject {
  version: string
  isDirectory?: boolean
  /** Filesystem identity, when paths may be aliases of the same file. */
  identity?: string
}

export interface BulkAdapter {
  kind: BulkPlan['kind']
  identity: (item: BulkCandidate, key: string) => string
  validate: (item: BulkCandidate) => boolean
  source: (item: BulkCandidate) => Promise<BulkObject | undefined>
  target: (item: BulkCandidate) => Promise<BulkObject | undefined>
  write: (item: BulkCandidate, overwrite: boolean) => Promise<void>
  /** Refresh shared checks and hold the adapter's mutation lock for the entire commit. */
  withCommit?: (operation: () => Promise<BulkSnapshot>) => Promise<BulkSnapshot>
  /** Persist all checked items together, without a separate source-removal stage. */
  writeMany?: (items: readonly BulkCandidate[], overwrite: boolean) => Promise<void>
  /** Presence means write() copies; removal is a separate, resumable stage. */
  removeSource?: (item: BulkCandidate) => Promise<void>
}

interface Checkpoint {
  source?: BulkObject
  target?: BulkObject
  copiedTarget?: BulkObject
}

class ChangeError extends Error {
  constructor(readonly reason: NonNullable<BulkOutcome['error']>) {
    super(reason)
  }
}

const sameObject = (a?: BulkObject, b?: BulkObject) => a?.version === b?.version

/** Authoritative session owned by the main process. The renderer cannot edit a reviewed plan. */
export class BulkChangeSession {
  readonly plan: BulkPlan
  private readonly outcomes: BulkOutcome[]
  private readonly checkpoints: Checkpoint[]
  private active?: Promise<BulkSnapshot>
  private committed = false
  private policy?: BulkPolicy

  private constructor(
    plan: BulkPlan,
    private readonly adapter: BulkAdapter,
    checkpoints: Checkpoint[],
  ) {
    this.plan = plan
    this.checkpoints = checkpoints
    this.outcomes = plan.items.map(item => ({ id: item.id, status: 'pending', attempts: 0, stage: 'ready' }))
  }

  static async preview(id: string, candidates: readonly BulkCandidate[], adapter: BulkAdapter) {
    // Copy only public scalar fields. Never retain renderer objects or credentials in a plan.
    const items = candidates.map(item => ({
      id: item.id,
      source: item.source,
      target: item.target,
      context: Object.freeze({ ...item.context }),
      issues: [] as BulkIssue[],
    }))
    if (!items.length || new Set(items.map(item => item.id)).size !== items.length) {
      throw new Error('Invalid bulk selection')
    }
    const sources = new Map<string, string>()
    const targets = new Map<string, number>()
    for (const item of items) {
      const source = adapter.identity(item, item.source)
      if (sources.has(source) && adapter.kind === 'remote-rename') throw new Error('Duplicate bulk source')
      sources.set(source, item.id)
      const target = adapter.identity(item, item.target)
      targets.set(target, (targets.get(target) ?? 0) + 1)
    }
    const checkpoints: Checkpoint[] = items.map(() => ({}))
    await bulkMap(
      items.map((item, index) => ({ item, index })),
      async ({ item, index }) => {
        const source = adapter.identity(item, item.source)
        const target = adapter.identity(item, item.target)
        if (!adapter.validate(item)) item.issues.push('invalid-target')
        if (item.source === item.target) item.issues.push('unchanged')
        if (targets.get(target)! > 1) item.issues.push('duplicate-target')
        if (adapter.kind === 'remote-rename' && sources.has(target) && item.source !== item.target) {
          // Includes case-only filesystem aliases. Never delete a source through its own alias.
          item.issues.push('source-collision')
        }
        if (item.issues.includes('invalid-target')) return
        try {
          const original = await adapter.source(item)
          const destination = await adapter.target(item)
          checkpoints[index] = { source: original, target: destination }
          if (!original || original.isDirectory) item.issues.push('missing-source')
          if (destination && source !== target) item.issues.push('existing-target')
          if (destination?.isDirectory) item.issues.push('directory-target')
          if (original?.identity && original.identity === destination?.identity && item.source !== item.target) {
            item.issues.push('source-collision')
          }
        } catch {
          // A permission/network failure is not evidence that a destination is absent.
          item.issues.push('check-failed')
        }
      },
    )
    // Server-returned identities also catch filesystem aliases that string comparison cannot.
    const sourceIdentities = new Set(
      checkpoints.flatMap(check => (check.source?.identity ? [check.source.identity] : [])),
    )
    for (const [index, item] of items.entries()) {
      const targetIdentity = checkpoints[index].target?.identity
      if (
        targetIdentity &&
        sourceIdentities.has(targetIdentity) &&
        item.source !== item.target &&
        !item.issues.includes('source-collision')
      ) {
        item.issues.push('source-collision')
      }
    }
    const plan: BulkPlan = Object.freeze({
      id,
      kind: adapter.kind,
      createdAt: Date.now(),
      items: Object.freeze(items.map(item => Object.freeze({ ...item, issues: Object.freeze(item.issues) }))),
    })
    return new BulkChangeSession(plan, adapter, checkpoints)
  }

  snapshot(): BulkSnapshot {
    return {
      plan: this.plan,
      outcomes: this.outcomes.map(outcome => ({ ...outcome })),
      running: !!this.active,
      committed: this.committed,
      policy: this.policy,
    }
  }

  async run(policy: BulkPolicy, retryFailed = false): Promise<BulkSnapshot> {
    if (!isBulkPolicy(policy)) throw new Error('Choose a conflict policy')
    if (this.active) {
      await this.active
      return this.snapshot()
    }
    if (this.committed && (!retryFailed || policy !== this.policy)) return this.snapshot()
    if (!this.committed && (retryFailed || !canCommitBulkPlan(this.plan, policy))) return this.snapshot()
    this.policy = policy
    this.committed = true
    this.active = this.execute(policy, retryFailed)
    try {
      await this.active
    } finally {
      this.active = undefined
    }
    return this.snapshot()
  }

  private async check(index: number) {
    const item = this.plan.items[index]
    const checkpoint = this.checkpoints[index]
    const outcome = this.outcomes[index]
    const source = await this.adapter.source(item)
    const target = await this.adapter.target(item)
    if (outcome.stage === 'copied') {
      if (!checkpoint.copiedTarget) throw new ChangeError('verification-failed')
      if (!sameObject(target, checkpoint.copiedTarget)) throw new ChangeError('target-changed')
      // A delete may have succeeded even if its acknowledgement was lost.
      if (!source) return false
    }
    if (!source || !sameObject(source, checkpoint.source)) throw new ChangeError('source-changed')
    if (outcome.stage !== 'copied' && !sameObject(target, checkpoint.target)) throw new ChangeError('target-changed')
    return true
  }

  private fail(index: number, error: unknown) {
    const outcome = this.outcomes[index]
    outcome.error = error instanceof ChangeError ? error.reason : 'request-failed'
    outcome.status =
      this.policy === 'skip' && outcome.stage === 'ready' && outcome.error === 'target-changed' ? 'skipped' : 'failed'
  }

  private async execute(policy: BulkPolicy, retryFailed: boolean): Promise<BulkSnapshot> {
    const indexes: number[] = []
    for (const [index, item] of this.plan.items.entries()) {
      const outcome = this.outcomes[index]
      if (outcome.status !== (retryFailed ? 'failed' : 'pending')) continue
      if (item.issues.includes('unchanged') || (policy === 'skip' && item.issues.length > 0)) {
        outcome.status = 'skipped'
        continue
      }
      outcome.error = undefined
      indexes.push(index)
    }
    if (!indexes.length) return this.snapshot()
    const apply = () => this.apply(policy, indexes)
    try {
      return await (this.adapter.withCommit ? this.adapter.withCommit(apply) : apply())
    } catch (error) {
      for (const index of indexes) this.fail(index, error)
      return this.snapshot()
    }
  }

  private async apply(policy: BulkPolicy, indexes: number[]): Promise<BulkSnapshot> {
    // Preflight the entire commit before any writes, including objects changed since review.
    const checked = new Set<number>()
    await bulkMap(indexes, async index => {
      try {
        await this.check(index)
        checked.add(index)
      } catch (error) {
        this.fail(index, error)
      }
    })
    if (policy === 'abort' && checked.size !== indexes.length) {
      for (const index of checked) this.fail(index, new ChangeError('aborted'))
      return this.snapshot()
    }
    const ready = indexes.filter(index => checked.has(index))
    if (this.adapter.writeMany && !this.adapter.removeSource) {
      if (!ready.length) return this.snapshot()
      for (const index of ready) {
        this.outcomes[index].status = 'running'
        this.outcomes[index].attempts++
      }
      try {
        await this.adapter.writeMany(
          ready.map(index => this.plan.items[index]),
          policy === 'overwrite',
        )
        for (const index of ready) {
          this.outcomes[index].status = 'succeeded'
          this.outcomes[index].stage = 'complete'
        }
      } catch (error) {
        for (const index of ready) this.fail(index, error)
      }
      return this.snapshot()
    }
    await bulkMap(ready, async index => {
      const item = this.plan.items[index]
      const outcome = this.outcomes[index]
      const checkpoint = this.checkpoints[index]
      outcome.status = 'running'
      outcome.attempts++
      try {
        const sourceExists = await this.check(index)
        if (outcome.stage !== 'copied') {
          await this.adapter.write(item, policy === 'overwrite')
          if (this.adapter.removeSource) {
            outcome.stage = 'copied'
            checkpoint.copiedTarget = await this.adapter.target(item)
            if (!checkpoint.copiedTarget) throw new ChangeError('verification-failed')
          }
        }
        if (this.adapter.removeSource && sourceExists && (await this.check(index))) {
          await this.adapter.removeSource(item)
        }
        outcome.status = 'succeeded'
        outcome.stage = 'complete'
      } catch (error) {
        this.fail(index, error)
      }
    })
    return this.snapshot()
  }
}
