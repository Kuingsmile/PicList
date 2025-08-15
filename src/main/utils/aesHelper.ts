import crypto from 'node:crypto'

import picgo from '@core/picgo'

import { configPaths } from '~/utils/configPaths'

export class AESHelper {
  static readonly #SALT = Buffer.from('a8b3c4d2e4f5098712345678feedc0de', 'hex')
  static readonly #ITERATIONS = 100_000
  static readonly #KEYLEN = 32
  static readonly #DIGEST = 'sha512' as const
  static readonly #ALGO = 'aes-256-cbc'
  static readonly #IV_LENGTH = 16
  static readonly #SEP = ':'

  static #keyCache = new Map<string, Buffer>()

  readonly key: Buffer

  constructor(password?: string) {
    const pwd = password ?? picgo.getConfig<string>(configPaths.settings.aesPassword) ?? 'aesPassword'
    this.key = AESHelper.#deriveKey(pwd)
  }

  static #deriveKey(password: string): Buffer {
    const cached = this.#keyCache.get(password)
    if (cached) return cached
    const key = crypto.pbkdf2Sync(password, this.#SALT, this.#ITERATIONS, this.#KEYLEN, this.#DIGEST)
    this.#keyCache.set(password, key)
    return key
  }

  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(AESHelper.#IV_LENGTH)
    const cipher = crypto.createCipheriv(AESHelper.#ALGO, this.key, iv)
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
    return `${iv.toString('hex')}${AESHelper.#SEP}${encrypted.toString('hex')}`
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return '{}'

    const sepIndex = encryptedData.indexOf(AESHelper.#SEP)
    if (sepIndex <= 0) return '{}'

    const ivHex = encryptedData.slice(0, sepIndex)
    const encryptedHex = encryptedData.slice(sepIndex + 1)

    try {
      const iv = Buffer.from(ivHex, 'hex')
      if (iv.length !== AESHelper.#IV_LENGTH) return '{}'

      const decipher = crypto.createDecipheriv(AESHelper.#ALGO, this.key, iv)
      const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()])
      return decrypted.toString('utf8')
    } catch {
      return '{}'
    }
  }
}
