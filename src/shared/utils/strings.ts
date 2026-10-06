export const handleStreamlinePluginName = (name: string) => name.replace(/(@[^/]+\/)?picgo-plugin-/, '')

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
