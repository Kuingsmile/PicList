import { waitWithSignal } from './waitWithSignal'

export class ResourceCache<T> {
  private entries = new Map<string, { value: T; weight: number; expires: number }>()
  private used = 0
  private active = 0
  private queue = new Set<() => void>()
  private pending = new Map<string, { controller: AbortController; users: number; result: Promise<T> }>()

  constructor(
    private readonly budget: number,
    private readonly weightOf: (value: T) => number,
    private readonly concurrency = 4,
  ) {}

  clear() {
    for (const request of this.pending.values()) request.controller.abort()
    this.pending.clear()
    this.entries.clear()
    this.used = 0
  }

  delete(key: string) {
    this.used -= this.entries.get(key)?.weight ?? 0
    this.entries.delete(key)
  }

  private async run(signal: AbortSignal, load: (signal: AbortSignal) => Promise<T>) {
    signal.throwIfAborted()
    if (this.active >= this.concurrency) {
      await new Promise<void>((resolve, reject) => {
        const start = () => {
          signal.removeEventListener('abort', abort)
          this.queue.delete(start)
          resolve()
        }
        const abort = () => {
          this.queue.delete(start)
          reject(signal.reason)
        }
        this.queue.add(start)
        signal.addEventListener('abort', abort, { once: true })
      })
    } else this.active++
    try {
      signal.throwIfAborted()
      return await load(signal)
    } finally {
      const next = this.queue.values().next().value
      if (next) next()
      else this.active--
    }
  }

  async get(key: string, signal: AbortSignal, ttl: number, load: (signal: AbortSignal) => Promise<T>) {
    signal.throwIfAborted()
    const cached = this.entries.get(key)
    if (cached && cached.expires > Date.now()) {
      this.entries.delete(key)
      this.entries.set(key, cached)
      return cached.value
    }
    this.delete(key)
    let request = this.pending.get(key)
    if (!request || request.controller.signal.aborted) {
      const controller = new AbortController()
      const result = this.run(controller.signal, async signal => {
        const expires = Date.now() + ttl
        const value = await load(signal)
        signal.throwIfAborted()
        const weight = this.weightOf(value)
        if (expires > Date.now() && weight <= this.budget) {
          this.entries.set(key, { value, weight, expires })
          this.used += weight
          while (this.used > this.budget || this.entries.size > 512) this.delete(this.entries.keys().next().value!)
        }
        return value
      }).finally(() => {
        if (this.pending.get(key)?.controller === controller) this.pending.delete(key)
      })
      request = { controller, users: 0, result }
      this.pending.set(key, request)
    }
    const shared = request
    shared.users++
    try {
      return await waitWithSignal(shared.result, signal)
    } finally {
      if (--shared.users === 0) shared.controller.abort()
    }
  }
}
