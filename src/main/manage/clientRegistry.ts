import { createHash } from 'node:crypto'

const fingerprint = (config: unknown) => createHash('sha256').update(JSON.stringify(config)).digest('hex')

/** The owner of an account's lazy provider, transports and configuration snapshot. */
export class ClientRegistry<T extends { destroy(): void | Promise<void> }> {
  private readonly accounts = new Map<string, { hash: string; client: T }>()

  private readonly closing = new Set<Promise<void>>()

  private retire(client: T) {
    const done = Promise.resolve(client.destroy())
      .catch(() => console.error('Management client cleanup failed'))
      .finally(() => this.closing.delete(done))
    this.closing.add(done)
  }

  get(id: string, config: unknown, create: () => T): T {
    if (!config) return create() // Let listing requests report an unavailable account to their renderer.
    const cached = this.accounts.get(id)
    if (cached) return cached.client
    const client = create()
    this.accounts.set(id, { hash: fingerprint(config), client })
    return client
  }

  reconcile(getConfig: (id: string) => unknown) {
    for (const [id, entry] of this.accounts) {
      const config = getConfig(id)
      if (config && entry.hash === fingerprint(config)) continue
      this.accounts.delete(id)
      this.retire(entry.client)
    }
  }

  async destroy() {
    for (const { client } of this.accounts.values()) this.retire(client)
    this.accounts.clear()
    await Promise.all(this.closing)
  }
}
