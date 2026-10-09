import { getAuthHeader } from './digestAuth'

export type PreviewKind = 'image' | 'video' | 'markdown' | 'text'

interface WebdavCredentials {
  authType?: string
  username: string
  password: string
}

export interface PreviewSource {
  url: string
  mimeType?: string
  sign?: () => Promise<string | undefined>
  read?: () => Promise<Uint8Array | undefined>
  webdav?: WebdavCredentials
}

export function getPreviewReferrerPolicy(url: string): ReferrerPolicy | undefined {
  // Imgur rejects loopback referrers sent by the development renderer.
  return /^https?:\/\/i\.imgur\.com\//i.test(url) ? 'no-referrer' : undefined
}

export async function fetchPreviewResponse(url: string, signal: AbortSignal, webdav?: WebdavCredentials) {
  const headers: Record<string, string> = {}
  if (webdav) {
    if (webdav.authType === 'digest') {
      // Digest must sign the same encoded path and query that will actually be requested.
      const target = new URL(url)
      const authorization = await getAuthHeader(
        'GET',
        target.origin,
        target.pathname + target.search,
        webdav.username,
        webdav.password,
        signal,
      )
      if (authorization) headers.Authorization = authorization
    } else {
      const credentials = new TextEncoder().encode(`${webdav.username}:${webdav.password}`)
      headers.Authorization = `Basic ${btoa(String.fromCharCode(...credentials))}`
    }
  }
  signal.throwIfAborted()
  const response = await fetch(url, { headers, signal })
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`Failed to load preview (HTTP ${response.status})`)
  }
  return response
}

export async function loadFilePreview(kind: PreviewKind, source: PreviewSource, signal: AbortSignal) {
  signal.throwIfAborted()
  const isMedia = kind === 'image' || kind === 'video'
  if (source.read) {
    const bytes = await source.read()
    signal.throwIfAborted()
    if (!bytes) throw new Error('Failed to read preview content')
    const blob = new Blob([new Uint8Array(bytes)], { type: source.mimeType })
    return isMedia ? blob : await blob.text()
  }

  const url = source.sign ? await source.sign() : source.url
  signal.throwIfAborted()
  if (!url || url === 'error') throw new Error('Failed to resolve preview URL')

  // Native media elements can stream signed/public URLs, but cannot attach auth headers.
  if (isMedia && !source.webdav) return url

  const response = await fetchPreviewResponse(url, signal, source.webdav)
  return isMedia ? await response.blob() : await response.text()
}
