export function appendThumbnailSuffix(url: string, suffix?: string): string {
  const normalizedSuffix = suffix?.trim() ?? ''
  if (!url || !normalizedSuffix) return url

  if (normalizedSuffix.startsWith('?')) {
    return `${url}${url.includes('?') ? '&' : '?'}${normalizedSuffix.slice(1)}`
  }

  if (normalizedSuffix.startsWith('&')) {
    return `${url}${url.includes('?') ? '&' : '?'}${normalizedSuffix.slice(1)}`
  }

  return `${url}${normalizedSuffix}`
}
