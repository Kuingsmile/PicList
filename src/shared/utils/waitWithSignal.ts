/** Stop waiting for shared work without cancelling another consumer's request. */
export async function waitWithSignal<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return operation
  let abort!: () => void
  const interrupted = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
  try {
    return await Promise.race([operation, interrupted])
  } finally {
    signal.removeEventListener('abort', abort)
  }
}
