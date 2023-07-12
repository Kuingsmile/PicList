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
  } catch (e) {
    // if some error caught, try to let it go
    return false
  }
}

export const handleUrlEncode = (url: string): string => isUrlEncode(url) ? url : encodeURI(url)

/**
 * streamline the full plugin name to a simple one
 * for example:
 * 1. picgo-plugin-xxx -> xxx
 * 2. @xxx/picgo-plugin-yyy -> yyy
 * @param name pluginFullName
 */
export const handleStreamlinePluginName = (name: string) => {
  if (/^@[^/]+\/picgo-plugin-/.test(name)) {
    return name.replace(/^@[^/]+\/picgo-plugin-/, '')
  } else {
    return name.replace(/picgo-plugin-/, '')
  }
}

export const simpleClone = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}

export const enforceNumber = (num: number | string) => isNaN(+num) ? 0 : +num

export const isDev = process.env.NODE_ENV === 'development'

export const trimValues = <T extends IStringKeyMap>(obj: T): {[K in keyof T]: T[K] extends string ? string : T[K]} => {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])) as {[K in keyof T]: T[K] extends string ? string : T[K]}
}
