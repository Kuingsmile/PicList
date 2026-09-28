/** LRU budget for ASCII data URLs. One oversized image is retained so a large preview remains usable. */
export class PreviewCache {
  private order = new Map<string, number>()
  private characters = 0

  constructor(
    readonly entries: Record<string, string>,
    private readonly maxCharacters = 16 * 1024 * 1024,
    private readonly maxEntries = 64,
  ) {}

  touch(key: string) {
    const size = this.order.get(key)
    if (size === undefined) return
    this.order.delete(key)
    this.order.set(key, size)
  }

  delete(key: string) {
    this.characters -= this.order.get(key) ?? 0
    this.order.delete(key)
    delete this.entries[key]
  }

  set(key: string, value: string) {
    this.delete(key)
    this.entries[key] = value
    this.order.set(key, value.length)
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
