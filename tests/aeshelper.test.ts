// AESHelper.spec.ts
import crypto from 'node:crypto'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AESHelper } from '../src/main/utils/aesHelper'

vi.mock('@core/picgo', () => ({
  default: { getConfig: vi.fn(() => undefined) },
}))
vi.mock('~/utils/configPaths', () => ({
  configPaths: { settings: { aesPassword: 'settings.aesPassword' } },
}))

const HEX_RE = /^[0-9a-f]+$/i

describe('AESHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('round-trips (encrypt -> decrypt) with explicit password', () => {
    const helper = new AESHelper('testPass123')
    const plaintext = JSON.stringify({ hello: 'world', n: 42 })
    const enc = helper.encrypt(plaintext)
    const dec = helper.decrypt(enc)
    expect(dec).toBe(plaintext)
  })

  it('produces iv:cipher hex format with 16-byte IV', () => {
    const helper = new AESHelper('formatPass')
    const enc = helper.encrypt('format-check')
    const parts = enc.split(':')
    expect(parts.length).toBe(2)
    const [ivHex, cipherHex] = parts
    expect(ivHex.length).toBe(32)
    expect(HEX_RE.test(ivHex)).toBe(true)
    expect(cipherHex.length).toBeGreaterThan(0)
    expect(HEX_RE.test(cipherHex)).toBe(true)
  })

  it('is non-deterministic (random IV) for the same plaintext', () => {
    const helper = new AESHelper('randomIvPass')
    const pt = 'same-plaintext'
    const a = helper.encrypt(pt)
    const b = helper.encrypt(pt)
    expect(a).not.toBe(b)
    expect(helper.decrypt(a)).toBe(pt)
    expect(helper.decrypt(b)).toBe(pt)
  })

  it('returns "{}" on malformed inputs (compatibility behavior)', () => {
    const helper = new AESHelper('badInputPass')
    expect(helper.decrypt('')).toBe('{}') // empty
    expect(helper.decrypt('nocolonhere')).toBe('{}') // no separator
    expect(helper.decrypt('00:abcd')).toBe('{}') // IV too short
  })

  it('returns "{}" if ciphertext is tampered', () => {
    const helper = new AESHelper('tamperPass')
    const enc = helper.encrypt('secure-data')
    const [ivHex, cipherHex] = enc.split(':')
    const last = cipherHex.at(-1)!
    const flipped = last.toLowerCase() === 'a' ? 'b' : 'a'
    const tampered = `${ivHex}:${cipherHex.slice(0, -1)}${flipped}`
    expect(helper.decrypt(tampered)).toBe('{}')
  })

  it('two instances with the same password can decrypt each other', () => {
    const h1 = new AESHelper('sharedPass')
    const h2 = new AESHelper('sharedPass')
    const enc1 = h1.encrypt('hello')
    const enc2 = h2.encrypt('world')
    expect(h2.decrypt(enc1)).toBe('hello')
    expect(h1.decrypt(enc2)).toBe('world')
  })

  it('works with default constructor (uses picgo fallback password)', async () => {
    const h1 = new AESHelper()
    const h2 = new AESHelper()
    const enc = h1.encrypt('fallback-ok')
    expect(h2.decrypt(enc)).toBe('fallback-ok')
  })

  it('caches derived keys for the same password (pbkdf2Sync called once)', () => {
    const spy = vi.spyOn(crypto, 'pbkdf2Sync')
    const uniquePwd = 'cache-me-please-' + Math.random().toString(36).slice(2)

    const a = new AESHelper(uniquePwd)
    const b = new AESHelper(uniquePwd)
    a.encrypt('x')
    b.encrypt('y')

    const callsForPwd = spy.mock.calls.filter(args => args[0] === uniquePwd)
    expect(callsForPwd.length).toBe(1)
  })
})
