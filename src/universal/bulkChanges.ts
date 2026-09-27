export interface BulkContext {
  readonly provider: string
  readonly accountId: string
  readonly bucketName: string
  readonly region: string
}

export interface BulkCandidate {
  readonly id: string
  readonly source: string
  readonly target: string
  readonly context: BulkContext
}

export type BulkPolicy = 'overwrite' | 'skip' | 'abort'
export type BulkIssue =
  | 'invalid-target'
  | 'duplicate-target'
  | 'source-collision'
  | 'existing-target'
  | 'directory-target'
  | 'missing-source'
  | 'check-failed'
  | 'unchanged'

export interface BulkPlanItem extends BulkCandidate {
  readonly issues: readonly BulkIssue[]
}

export interface BulkPlan {
  readonly id: string
  readonly kind: 'remote-rename' | 'gallery-url'
  readonly createdAt: number
  readonly items: readonly BulkPlanItem[]
}

export interface BulkOutcome {
  id: string
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped'
  attempts: number
  /** A successful copy is never repeated when only source deletion failed. */
  stage: 'ready' | 'copied' | 'complete'
  error?: 'request-failed' | 'source-changed' | 'target-changed' | 'verification-failed' | 'aborted'
}

export interface BulkSnapshot {
  plan: BulkPlan
  outcomes: BulkOutcome[]
  running: boolean
  committed: boolean
  policy?: BulkPolicy
}

export interface BulkInput {
  id: string
  source: string
  target: string
}

export const BULK_CONCURRENCY = 4

export function isBulkPolicy(value: unknown): value is BulkPolicy {
  return value === 'overwrite' || value === 'skip' || value === 'abort'
}

export function hasBlockingIssue(item: BulkPlanItem, kind: BulkPlan['kind']): boolean {
  return item.issues.some(
    issue =>
      issue !== 'unchanged' && issue !== 'existing-target' && !(kind === 'gallery-url' && issue === 'duplicate-target'),
  )
}

export function canCommitBulkPlan(plan: BulkPlan, policy: BulkPolicy): boolean {
  const changed = plan.items.filter(item => !item.issues.includes('unchanged'))
  if (policy === 'abort') return changed.length > 0 && changed.every(item => item.issues.length === 0)
  if (policy === 'overwrite') return changed.length > 0 && changed.every(item => !hasBlockingIssue(item, plan.kind))
  return changed.some(item => item.issues.length === 0)
}

/** Work is pulled by a fixed number of workers; one rejection never drops other outcomes. */
export async function bulkMap<T>(items: readonly T[], action: (item: T) => Promise<void>): Promise<void> {
  let index = 0
  await Promise.all(
    Array.from({ length: Math.min(BULK_CONCURRENCY, items.length) }, async () => {
      while (index < items.length) await action(items[index++])
    }),
  )
}
