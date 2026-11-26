/** LRU budget for ASCII data URLs. One oversized image is retained so a large preview remains usable. */
export class PreviewCache {
  private order = new Map<string, { size: number; expiresAt: number }>()
  private characters = 0

  constructor(
    readonly entries: Record<string, string>,
    private readonly maxCharacters = 16 * 1024 * 1024,
    private readonly maxEntries = 64,
  ) {}

  get(key: string): string | undefined {
    const entry = this.order.get(key)
    if (!entry) return
    if (entry.expiresAt <= Date.now()) {
      this.delete(key)
      return
    }
    this.touch(key)
    return this.entries[key]
  }

  touch(key: string) {
    const entry = this.order.get(key)
    if (!entry) return
    this.order.delete(key)
    this.order.set(key, entry)
  }

  delete(key: string) {
    this.characters -= this.order.get(key)?.size ?? 0
    this.order.delete(key)
    delete this.entries[key]
  }

  set(key: string, value: string, expiresAt = Infinity) {
    this.delete(key)
    this.entries[key] = value
    this.order.set(key, { size: value.length, expiresAt })
    this.characters += value.length
    while (this.order.size > 1 && (this.characters > this.maxCharacters || this.order.size > this.maxEntries)) {
      this.delete(this.order.keys().next().value!)
    }
  }

  clear() {
    for (const key of this.order.keys()) delete this.entries[key]
    this.order.clear()
    this.characters = 0
  }
}
