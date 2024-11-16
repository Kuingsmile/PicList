import crypto from 'crypto'

import picgo from '@core/picgo'

import { configPaths } from '#/utils/configPaths'
import { DEFAULT_AES_PASSWORD } from '#/utils/static'

export class AESHelper {
  private key: Buffer = crypto.pbkdf2Sync(
    picgo.getConfig<string>(configPaths.settings.aesPassword) || DEFAULT_AES_PASSWORD,
    Buffer.from('a8b3c4d2e4f5098712345678feedc0de', 'hex'),
    100000,
    32,
    'sha512'
  )

  encrypt(plainText: string) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv)
    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  }

  decrypt(encryptedData: string) {
    const [ivHex, encryptedText] = encryptedData.split(':')
    if (!ivHex || !encryptedText) return '{}'

    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, Buffer.from(ivHex, 'hex'))
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}
