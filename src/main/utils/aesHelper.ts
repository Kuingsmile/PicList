import crypto from 'crypto'
import picgo from '@core/picgo'

function getDerivedKey (): Buffer {
  const userPassword = picgo.getConfig<string>('settings.aesPassword') || 'PicList-aesPassword'
  const fixedSalt = Buffer.from('a8b3c4d2e4f5098712345678feedc0de', 'hex')
  const fixedIterations = 100000
  const keyLength = 32
  return crypto.pbkdf2Sync(userPassword, fixedSalt, fixedIterations, keyLength, 'sha512')
}

export class AESHelper {
  key: Buffer
  constructor () {
    this.key = getDerivedKey()
  }

  encrypt (plainText: string) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv)
    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const encryptedData = `${iv.toString('hex')}:${encrypted}`
    return encryptedData
  }

  decrypt (encryptedData: string) {
    const parts = encryptedData.split(':')
    if (parts.length !== 2) {
      return '{}'
    }
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedText = parts[1]
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}
