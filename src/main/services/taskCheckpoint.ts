import { randomUUID } from 'node:crypto'
import { chmodSync, readFileSync, renameSync } from 'node:fs'
import { mkdir, open } from 'node:fs/promises'
import path from 'node:path'

import writeFile from 'write-file-atomic'

export const TASK_CHECKPOINT_VERSION = 1
export const TASK_HISTORY_LIMIT = 500
export const TASK_HISTORY_MAX_AGE = 30 * 24 * 60 * 60 * 1000

export const isRecord = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function quarantineTaskStore(file: string): void {
  // Do not include parser errors, paths, or contents in logs. Legacy stores may contain credentials.
  chmodSync(file, 0o600)
  renameSync(file, `${file}.corrupt-${Date.now()}-${randomUUID()}`)
}

export async function writeAtomicTaskFile(file: string, contents: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, contents, { mode: 0o600, fsync: true })
  // Persist the rename as well as the file contents. Windows does not support opening directories this way.
  if (process.platform !== 'win32') {
    const directory = await open(path.dirname(file), 'r')
    try {
      await directory.sync()
    } finally {
      await directory.close()
    }
  }
}

export function retainTaskHistory<T>(
  tasks: T[],
  terminal: (task: T) => boolean,
  finishedAt: (task: T) => number | undefined,
  now = Date.now(),
): T[] {
  const retained = new Set(
    tasks
      .map((task, index) => ({ task, index, time: finishedAt(task) || 0 }))
      .filter(({ task, time }) => terminal(task) && (!time || time >= now - TASK_HISTORY_MAX_AGE))
      .sort((a, b) => b.time - a.time || b.index - a.index)
      .slice(0, TASK_HISTORY_LIMIT)
      .map(({ task }) => task),
  )
  return tasks.filter(task => !terminal(task) || retained.has(task))
}

// URLs with authentication or queries cannot be replayed safely after restart. Require fresh input instead.
export function checkpointSource(value: string): string | undefined {
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(value)) return value
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return
    return value
  } catch {
    return undefined
  }
}

interface CheckpointOptions<T> {
  file: string
  snapshot: () => T | Promise<T>
  decode: (data: unknown, legacy: boolean) => T
  onError?: () => void
  debounceMs?: number
  maxWaitMs?: number
  write?: typeof writeAtomicTaskFile
}

export class TaskCheckpoint<T> {
  private revision = 0
  private savedRevision = 0
  private timer?: NodeJS.Timeout
  private firstChangeAt?: number
  private writing?: Promise<void>
  private blocked = false

  constructor(private readonly options: CheckpointOptions<T>) {}

  load(): T | undefined {
    let contents: string
    try {
      contents = readFileSync(this.options.file, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        // A permission/IO failure is not an empty or corrupt store; never overwrite it.
        this.blocked = true
        this.options.onError?.()
      }
      return
    }
    try {
      const envelope: unknown = JSON.parse(contents)
      if (!isRecord(envelope)) throw new Error('Invalid task checkpoint')
      const legacy = !Object.hasOwn(envelope, 'version')
      if (!legacy && (envelope.version !== TASK_CHECKPOINT_VERSION || !Number.isFinite(envelope.savedAt))) {
        throw new Error('Invalid task checkpoint version')
      }
      return this.options.decode(legacy ? envelope : envelope.data, legacy)
    } catch {
      try {
        quarantineTaskStore(this.options.file)
      } catch {
        // Preserve the original if quarantine failed rather than overwriting recovery evidence.
        this.blocked = true
      }
      this.options.onError?.()
    }
  }

  schedule(): void {
    this.revision++
    this.firstChangeAt ??= Date.now()
    if (this.timer) clearTimeout(this.timer)
    const remaining = (this.options.maxWaitMs ?? 2000) - (Date.now() - this.firstChangeAt)
    this.timer = setTimeout(
      () => {
        void this.flush().catch(() => {
          this.options.onError?.()
          // Keep the dirty revision for an explicit flush or a later mutation to retry.
        })
      },
      Math.max(0, Math.min(this.options.debounceMs ?? 200, remaining)),
    )
    this.timer.unref()
  }

  async flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    this.firstChangeAt = undefined
    if (this.blocked) throw new Error('Task checkpoint is unavailable')
    if (!this.writing) {
      this.writing = this.drain().finally(() => {
        this.writing = undefined
      })
    }
    await this.writing
    // A mutation may arrive as the previous drain settles.
    if (this.savedRevision < this.revision) await this.flush()
  }

  private async drain(): Promise<void> {
    while (this.savedRevision < this.revision) {
      const revision = this.revision
      const data = await this.options.snapshot()
      await (this.options.write ?? writeAtomicTaskFile)(
        this.options.file,
        JSON.stringify({ version: TASK_CHECKPOINT_VERSION, savedAt: Date.now(), data }),
      )
      this.savedRevision = revision
    }
  }
}
