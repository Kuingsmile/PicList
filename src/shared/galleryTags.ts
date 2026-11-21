export const galleryTagKey = (tag: string) => tag.trim().normalize().toLowerCase()

/** Keep the first spelling of each label, including when reading older or plugin-written records. */
export function normalizeGalleryTags(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length) return []
  const tags = new Map<string, string>()
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const label = entry.trim().normalize()
    const key = galleryTagKey(label)
    if (key && !tags.has(key)) tags.set(key, label)
  }
  return [...tags.values()]
}
