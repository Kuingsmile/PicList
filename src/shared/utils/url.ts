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

export const isUrl = (url: string): boolean => {
  try {
    return Boolean(new URL(url))
  } catch {
    return false
  }
}

export const isUrlEncode = (url: string): boolean => {
  url = url || ''
  try {
    return url !== decodeURI(url)
  } catch {
    return false
  }
}

export const handleUrlEncode = (url: string): string => (isUrlEncode(url) ? url : encodeURI(url))

export const formatEndpoint = (endpoint: string, sslEnabled: boolean): string => {
  const hasProtocol = /^https?:\/\//.test(endpoint)
  if (!hasProtocol) {
    return `${sslEnabled ? 'https' : 'http'}://${endpoint}`
  }
  return sslEnabled ? endpoint.replace(/^http:\/\//, 'https://') : endpoint.replace(/^https:\/\//, 'http://')
}

export const trimPath = (path: string) => path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
