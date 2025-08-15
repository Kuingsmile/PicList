import { isReactive, isRef, toRaw, unref } from 'vue'

/**
 * get raw data from reactive or ref
 */
export const getRawData = (args: any): any => {
  if (isRef(args)) return unref(args)
  if (isReactive(args)) return toRaw(args)
  if (Array.isArray(args)) return args.map(getRawData)
  if (typeof args === 'object' && args !== null) {
    const data = {} as Record<string, any>
    for (const key in args) {
      data[key] = getRawData(args[key])
    }
    return data
  }
  return args
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
