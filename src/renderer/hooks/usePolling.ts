import { type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

/** Poll after each response; slow requests never overlap and hidden views stop work. */
export function usePolling<T>(
  load: () => Promise<T>,
  accept: (result: T) => void,
  enabled: MaybeRefOrGetter<boolean>,
  interval: MaybeRefOrGetter<number>,
) {
  const failed = ref(false)
  let refreshCurrent: () => Promise<void> = async () => {}
  let inFlight: Promise<T> | undefined

  function request() {
    // Changing a polling interval or quickly reopening a panel must share its uncancellable RPC.
    if (!inFlight) {
      const result = Promise.resolve()
        .then(load)
        .finally(() => {
          if (inFlight === result) inFlight = undefined
        })
      inFlight = result
    }
    return inFlight
  }

  watch(
    [() => toValue(enabled), () => toValue(interval)],
    ([active, delay], _previous, onCleanup) => {
      let stopped = false
      let timer: ReturnType<typeof setTimeout> | undefined
      let pending: Promise<void> | undefined
      failed.value = false

      const refresh = (): Promise<void> => {
        if (stopped || !active) return Promise.resolve()
        clearTimeout(timer)
        if (pending) return pending
        // Schedule the loader after assigning pending, including loaders that throw synchronously.
        pending = Promise.resolve().then(async () => {
          try {
            const result = await request()
            if (!stopped) {
              accept(result)
              failed.value = false
            }
          } catch {
            // Keep the last successful snapshot so a transient failure cannot erase tasks.
            if (!stopped) failed.value = true
          } finally {
            pending = undefined
            if (!stopped) timer = setTimeout(refresh, Number.isFinite(delay) ? Math.max(100, delay) : 1500)
          }
        })
        return pending
      }

      refreshCurrent = refresh
      onCleanup(() => {
        stopped = true
        clearTimeout(timer)
      })
      if (active) void refresh()
    },
    { immediate: true },
  )

  return { failed, refresh: () => refreshCurrent() }
}
