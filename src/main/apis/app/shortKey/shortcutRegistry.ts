import { RpcError } from '#/rpc'
import {
  findShortcutConflicts,
  normalizeShortcut,
  type ShortcutConfig,
  type ShortcutEntry,
  shortcutSource,
} from '#/shortcuts'

interface ShortcutAdapter {
  register(key: string, callback: () => void): boolean
  unregister(key: string): void
}

interface RegistryOptions {
  platform: string
  adapter: ShortcutAdapter
  read(): Record<string, ShortcutConfig>
  write(configs: Record<string, ShortcutConfig>): void
  available(id: string, config: ShortcutConfig): boolean
  execute(id: string): void
}

/** Own registrations by command, never by an untrusted key supplied by a settings window. */
export class ShortcutRegistry {
  private readonly bindings = new Map<string, string>()
  private readonly failures = new Set<string>()
  private readonly previousOwners = new Map<string, string>()
  private paused = false

  constructor(private readonly options: RegistryOptions) {}

  private release(id: string) {
    const key = this.bindings.get(id)
    if (key) this.options.adapter.unregister(key)
    this.bindings.delete(id)
  }

  private register(id: string, key: string): boolean {
    try {
      return this.options.adapter.register(key, () => {
        const config = this.options.read()[id]
        if (!this.paused && config?.enable) this.options.execute(id)
      })
    } catch {
      return false
    }
  }

  reconcile() {
    const configs = this.options.read()
    for (const [id, key] of this.bindings) {
      const config = configs[id]
      if (
        this.paused ||
        !config?.enable ||
        !this.options.available(id, config) ||
        normalizeShortcut(config.key, this.options.platform) !== key
      )
        this.release(id)
    }
    this.failures.clear()
    if (this.paused) return
    const owners = new Set(this.bindings.values())
    const orderedIds = new Set([...this.previousOwners.keys(), ...Object.keys(configs)])
    for (const id of orderedIds) {
      const config = configs[id]
      if (!config) continue
      if (!config.enable || !this.options.available(id, config) || this.bindings.has(id)) continue
      const key = normalizeShortcut(config.key, this.options.platform)
      if (!key || owners.has(key)) continue
      if (this.register(id, key)) {
        this.bindings.set(id, key)
        owners.add(key)
      } else this.failures.add(id)
    }
  }

  setPaused(paused: boolean) {
    if (paused === this.paused) return
    if (paused) {
      this.previousOwners.clear()
      for (const [id, key] of this.bindings) this.previousOwners.set(id, key)
    }
    this.paused = paused
    this.reconcile()
    if (!paused) this.previousOwners.clear()
  }

  list(): ShortcutEntry[] {
    const entries = Object.entries(this.options.read()).map(([id, config]) => ({
      ...config,
      id,
      from: shortcutSource(id),
      available: this.options.available(id, config),
    }))
    return entries.map(entry => {
      const conflicts = findShortcutConflicts(entries, entry.id, entry.key, this.options.platform)
      const status = !entry.enable
        ? 'disabled'
        : !entry.available
          ? 'unavailable'
          : !entry.key
            ? 'unbound'
            : !normalizeShortcut(entry.key, this.options.platform)
              ? 'invalid'
              : this.bindings.has(entry.id)
                ? 'active'
                : this.paused && this.previousOwners.has(entry.id)
                  ? 'paused'
                  : conflicts.length
                    ? 'conflict'
                    : this.paused
                      ? 'paused'
                      : this.failures.has(entry.id)
                        ? 'failed'
                        : 'unbound'
      return { ...entry, conflicts, status }
    })
  }

  save(id: string, next: ShortcutConfig) {
    const configs = this.options.read()
    const normalized = next.key ? normalizeShortcut(next.key, this.options.platform) : ''
    // An invalid legacy binding must still be possible to disable.
    if (normalized === null && (next.enable || next.key !== configs[id]?.key)) throw new RpcError('SHORTCUT_INVALID')
    const key = normalized || ''
    // Keep portable aliases such as CommandOrControl in the saved settings.
    next = { ...next, key: next.key.trim(), enable: !!next.key && next.enable }
    if (next.enable && !this.options.available(id, next)) throw new RpcError('SHORTCUT_UNAVAILABLE')
    const oldKey = this.bindings.get(id)
    let acquired = false
    if (next.enable) {
      const retainedKey = oldKey || (this.paused ? this.previousOwners.get(id) : undefined)
      if (retainedKey !== key && findShortcutConflicts(this.list(), id, key, this.options.platform).length)
        throw new RpcError('SHORTCUT_CONFLICT')
      if (oldKey !== key) {
        if (!this.register(id, key)) throw new RpcError('SHORTCUT_UNAVAILABLE')
        acquired = true
      }
    }
    try {
      this.options.write({ ...configs, [id]: next })
    } catch (error) {
      if (acquired) this.options.adapter.unregister(key)
      throw error
    }
    if (oldKey && (oldKey !== key || !next.enable)) this.release(id)
    if (acquired) {
      if (this.paused) this.options.adapter.unregister(key)
      else this.bindings.set(id, key)
    }
    this.reconcile()
  }

  remove(ids: string[]) {
    const configs = { ...this.options.read() }
    for (const id of ids) delete configs[id]
    this.options.write(configs)
    for (const id of ids) this.release(id)
    this.reconcile()
  }
}
