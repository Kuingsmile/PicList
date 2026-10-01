export const handleStreamlinePluginName = (name: string) => name.replace(/(@[^/]+\/)?picgo-plugin-/, '')

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

const mask = 0b111111

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomStringGenerator(length: number): string {
  const out = new Array(length)
  let i = 0
  let pool = 0
  let bits = 0
  while (i < length) {
    if (bits < 6) {
      pool = (pool << 30) | ((Math.random() * 0x40000000) >>> 0)
      bits += 30
      continue
    }
    const idx = pool & mask
    pool >>>= 6
    bits -= 6
    if (idx < 62) out[i++] = chars[idx]
  }
  return out.join('')
}

export function customStrMatch(str: string, pattern: string): boolean {
  if (!str || !pattern) return false
  try {
    const reg = new RegExp(pattern, 'ug')
    return reg.test(str)
  } catch {
    return false
  }
}
