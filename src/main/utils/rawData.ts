import { isProxy, isRef, toRaw, unref } from 'vue'

/**
 * get raw data from reactive or ref
 */
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
