export const isS3SignedUrl = (url: string): boolean => {
  try {
    const params = new URL(url).searchParams
    const keys = new Set(Array.from(params.keys(), key => key.toLowerCase()))
    return keys.has('x-amz-signature') || (keys.has('awsaccesskeyid') && keys.has('signature'))
  } catch {
    return false
  }
}

export const addCacheBustParam = (url: string | undefined, token: string | number): string => {
  if (!url) return ''
  if (!/^https?:\/\//i.test(url) || isS3SignedUrl(url)) return url
  const fragmentIndex = url.indexOf('#')
  const base = fragmentIndex < 0 ? url : url.slice(0, fragmentIndex)
  const fragment = fragmentIndex < 0 ? '' : url.slice(fragmentIndex)
  return `${base}${base.includes('?') ? '&' : '?'}cbplist=${token}${fragment}`
}
