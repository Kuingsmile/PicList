import { AsyncLocalStorage } from 'node:async_hooks'

const context = new AsyncLocalStorage<{ active: boolean }>()
let pending: Promise<unknown> = Promise.resolve()

export const galleryLockHeld = () => !!context.getStore()?.active

// Shared by preview/apply, recovery, uploads, plugin mutations and gallery RPCs.
export function withGalleryLock<T>(operation: () => Promise<T>): Promise<T> {
  if (galleryLockHeld()) return operation()
  const result = pending.then(() => {
    const ownership = { active: true }
    return context.run(ownership, async () => {
      try {
        return await operation()
      } finally {
        ownership.active = false
      }
    })
  })
  pending = result.catch(() => {})
  return result
}
