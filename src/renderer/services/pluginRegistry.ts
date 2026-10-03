const REGISTRY_TIMEOUT_MS = 10_000

export async function fetchRegistryJson(url: string, controller: AbortController) {
  const timeout = setTimeout(() => controller.abort(), REGISTRY_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`Registry request failed (${res.status})`)
    // Keep the timeout active until the response body has also been read.
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}
