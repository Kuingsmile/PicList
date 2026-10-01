import { isProxy, isRef, toRaw, unref } from 'vue'

/** Unwrap Vue state while preserving the object graph and structured-clone types used by IPC. */
export function getRawData(value: any, seen = new WeakMap<object, any>()): any {
  const unwrapped = isRef(value) ? unref(value) : value
  const raw = isProxy(unwrapped) ? toRaw(unwrapped) : unwrapped
  if (raw === null || typeof raw !== 'object') return raw
  // IPC already clones these native values. Enumerating them would discard binary data.
  if (raw instanceof Date || raw instanceof RegExp || raw instanceof ArrayBuffer || ArrayBuffer.isView(raw)) return raw
  if (seen.has(raw)) return seen.get(raw)
  if (raw instanceof Map) {
    const result = new Map()
    seen.set(raw, result)
    raw.forEach((item, key) => result.set(getRawData(key, seen), getRawData(item, seen)))
    return result
  }
  if (raw instanceof Set) {
    const result = new Set()
    seen.set(raw, result)
    raw.forEach(item => result.add(getRawData(item, seen)))
    return result
  }
  const result: any = Array.isArray(raw) ? new Array(raw.length) : {}
  seen.set(raw, result)
  for (const key of Object.keys(raw)) result[key] = getRawData(raw[key], seen)
  return result
}
