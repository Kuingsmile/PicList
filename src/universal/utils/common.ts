import path from 'path'

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

/**
 * streamline the full plugin name to a simple one
 * for example:
 * 1. picgo-plugin-xxx -> xxx
 * 2. @xxx/picgo-plugin-yyy -> yyy
 * @param name pluginFullName
 */
export const handleStreamlinePluginName = (name: string) => name.replace(/(@[^/]+\/)?picgo-plugin-/, '')

export const simpleClone = (obj: any) => JSON.parse(JSON.stringify(obj))

export const enforceNumber = (num: number | string) => (isNaN(+num) ? 0 : +num)

export const isDev = process.env.NODE_ENV === 'development'

export const trimValues = <T extends IStringKeyMap>(
  obj: T
): { [K in keyof T]: T[K] extends string ? string : T[K] } => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  ) as { [K in keyof T]: T[K] extends string ? string : T[K] }
}

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

export function encodeFilePath(filePath: string) {
  return filePath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')
}

export const getExtension = (fileName: string) => path.extname(fileName).slice(1)

export const isImage = (fileName: string) =>
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif'].includes(getExtension(fileName))

export const formatEndpoint = (endpoint: string, sslEnabled: boolean): string => {
  const hasProtocol = /^https?:\/\//.test(endpoint)
  if (!hasProtocol) {
    return `${sslEnabled ? 'https' : 'http'}://${endpoint}`
  }
  return sslEnabled ? endpoint.replace(/^http:\/\//, 'https://') : endpoint.replace(/^https:\/\//, 'http://')
}

export const trimPath = (path: string) => path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')

export const formatHttpProxy = (
  proxy: string | undefined,
  type: 'object' | 'string'
): IHTTPProxy | undefined | string => {
  if (!proxy) return undefined
  if (/^https?:\/\//.test(proxy)) {
    const { protocol, hostname, port } = new URL(proxy)
    return type === 'string'
      ? `${protocol}//${hostname}:${port}`
      : {
          host: hostname,
          port: Number(port),
          protocol: protocol.slice(0, -1)
        }
  }
  const [host, port] = proxy.split(':')
  return type === 'string'
    ? `http://${host}:${port}`
    : {
        host,
        port: port ? Number(port) : 80,
        protocol: 'http'
      }
}
