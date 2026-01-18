import { isProxy, isRef, toRaw, unref } from 'vue'

export const getRawData = (args: any): any => {
  if (args === null || typeof args !== 'object') {
    return args
  }
  const raw = isRef(args) ? unref(args) : isProxy(args) ? toRaw(args) : args
  if (raw instanceof Date) return new Date(raw)
  if (raw instanceof RegExp) return new RegExp(raw)
  if (raw instanceof Map) {
    const result = new Map()
    raw.forEach((value, key) => {
      result.set(getRawData(key), getRawData(value))
    })
    return result
  }
  if (raw instanceof Set) {
    const result = new Set()
    raw.forEach(value => {
      result.add(getRawData(value))
    })
    return result
  }
  if (Array.isArray(raw)) {
    return raw.map(item => getRawData(item))
  }
  if (typeof raw === 'object') {
    const data: Record<string, any> = {}
    for (const key in raw) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        data[key] = getRawData(raw[key])
      }
    }
    return data
  }
  return raw
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

export const handleStreamlinePluginName = (name: string) => name.replace(/(@[^/]+\/)?picgo-plugin-/, '')
export const enforceNumber = (num: number | string) => (isNaN(+num) ? 0 : +num)

export function isNeedToShorten(alias: string, cutOff = 20) {
  return [...alias].reduce((len, char) => len + (char.charCodeAt(0) > 255 ? 2 : 1), 0) > cutOff
}

export function safeSliceF(str: string, total: number) {
  let result = ''
  let totalLen = 0
  for (const s of str) {
    if (totalLen >= total) {
      break
    }
    result += s
    totalLen += s.charCodeAt(0) > 255 ? 2 : 1
  }
  return result
}

export const formatEndpoint = (endpoint: string, sslEnabled: boolean): string => {
  const hasProtocol = /^https?:\/\//.test(endpoint)
  if (!hasProtocol) {
    return `${sslEnabled ? 'https' : 'http'}://${endpoint}`
  }
  return sslEnabled ? endpoint.replace(/^http:\/\//, 'https://') : endpoint.replace(/^https:\/\//, 'http://')
}

export const trimPath = (path: string) => path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
