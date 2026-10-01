import { ref, watch, type WatchSource } from 'vue'

export function useThumbnail(
  enabled: () => boolean,
  sources: WatchSource[],
  load: (signal: AbortSignal) => Promise<string | Blob>,
) {
  const source = ref('')
  const isLoading = ref(false)
  const hasError = ref(false)

  watch(
    [enabled, ...sources],
    async ([showThumbnail], _previous, onCleanup) => {
      source.value = ''
      isLoading.value = false
      hasError.value = false
      if (!showThumbnail) return

      const controller = new AbortController()
      let objectUrl = ''
      // Runs on source changes, disabling thumbnails, and component unmount.
      onCleanup(() => {
        controller.abort()
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        source.value = ''
        isLoading.value = false
      })

      isLoading.value = true
      try {
        const result = await load(controller.signal)
        // Local reads and signing RPCs cannot be cancelled through the preload bridge.
        if (controller.signal.aborted) return
        if (typeof result === 'string') {
          source.value = result
        } else {
          objectUrl = URL.createObjectURL(result)
          source.value = objectUrl
        }
      } catch {
        if (!controller.signal.aborted) hasError.value = true
      } finally {
        if (!controller.signal.aborted) isLoading.value = false
      }
    },
    { immediate: true },
  )

  return { source, isLoading, hasError }
}
