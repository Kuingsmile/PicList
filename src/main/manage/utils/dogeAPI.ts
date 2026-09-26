import crypto from 'node:crypto'
import querystring from 'node:querystring'

import axios from 'axios'

export interface DogecloudToken {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

interface DogecloudAuthorization {
  channel: string
  scopes: readonly string[]
}

type TokenResult = DogecloudToken | Record<string, never>

interface TokenEntry {
  token?: DogecloudToken
  expires?: number
  pending?: Promise<TokenResult>
}

interface AccountCache {
  fingerprint: string
  tokens: Map<string, TokenEntry>
}

const EXPIRY_MARGIN_MS = 5 * 60 * 1000
const fingerprintKey = crypto.randomBytes(32)
// Temporary credentials stay in memory; the legacy Credentials.doge-token is never read or overwritten.
const accounts = new Map<string, AccountCache>()
const accountId = (accessKey: string) => crypto.createHash('sha256').update(accessKey).digest('hex')
const credentialFingerprint = (accessKey: string, secretKey: string) =>
  crypto
    .createHmac('sha256', fingerprintKey)
    .update(JSON.stringify([accessKey, secretKey]))
    .digest('hex')

function getAccount(accessKey: string, secretKey: string): AccountCache {
  const id = accountId(accessKey)
  const fingerprint = credentialFingerprint(accessKey, secretKey)
  let account = accounts.get(id)
  if (!account || account.fingerprint !== fingerprint) {
    account = { fingerprint, tokens: new Map() }
    accounts.set(id, account)
  }
  return account
}

export function invalidateDogecloudTokens(
  accessKey: string,
  secretKey: string,
  token?: Pick<DogecloudToken, 'sessionToken'>,
): void {
  if (typeof accessKey !== 'string' || typeof secretKey !== 'string') return
  const id = accountId(accessKey)
  const account = accounts.get(id)
  if (!account || account.fingerprint !== credentialFingerprint(accessKey, secretKey)) return
  // A delayed failure from an older S3 client must not evict a replacement token.
  if (token && ![...account.tokens.values()].some(entry => entry.token?.sessionToken === token.sessionToken)) return
  accounts.delete(id)
}

export function isDogecloudAuthenticationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const value = error as Record<string, any>
  const statuses = [
    value.status,
    value.statusCode,
    value.$metadata?.httpStatusCode,
    value.response?.status,
    value.response?.statusCode,
    value.code,
  ]
  return (
    statuses.some(status => status === 401 || status === 403 || status === '401' || status === '403') ||
    [value.name, value.code, value.Code].some(code =>
      [
        'AccessDenied',
        'ExpiredToken',
        'InvalidAccessKeyId',
        'InvalidSecurity',
        'InvalidToken',
        'SignatureDoesNotMatch',
        'TokenRefreshRequired',
        'ERROR_UNAUTHORIZED',
      ].includes(code),
    )
  )
}

export async function dogecloudApi(
  apiPath: string,
  data = {},
  jsonMode: boolean = false,
  accessKey: string,
  secretKey: string,
) {
  const account = getAccount(accessKey, secretKey)
  const body = jsonMode ? JSON.stringify(data) : querystring.encode(data)
  const sign = crypto
    .createHmac('sha1', secretKey)
    .update(Buffer.from(apiPath + '\n' + body, 'utf8'))
    .digest('hex')
  const authorization = `TOKEN ${accessKey}:${sign}`
  try {
    const res = await axios.request({
      url: 'https://api.dogecloud.com' + apiPath,
      method: 'POST',
      data: body,
      responseType: 'json',
      headers: {
        'Content-Type': jsonMode ? 'application/json' : 'application/x-www-form-urlencoded',
        Authorization: authorization,
      },
    })
    if (res.data.code !== 200) {
      if (isDogecloudAuthenticationError(res.data) && accounts.get(accountId(accessKey)) === account) {
        invalidateDogecloudTokens(accessKey, secretKey)
      }
      throw new Error('API Error')
    }
    return res.data.data
  } catch (error) {
    if (isDogecloudAuthenticationError(error) && accounts.get(accountId(accessKey)) === account) {
      invalidateDogecloudTokens(accessKey, secretKey)
    }
    // Axios errors include signed authorization headers and response bodies. Do not expose their cause.
    // eslint-disable-next-line preserve-caught-error -- The provider error can contain credentials.
    throw new Error('API Error')
  }
}

export async function getTempToken(
  accessKey: string,
  secretKey: string,
  authorization: DogecloudAuthorization = { channel: 'OSS_FULL', scopes: ['*'] },
): Promise<TokenResult> {
  if (!accessKey || !secretKey) return {}
  const account = getAccount(accessKey, secretKey)
  const request = { channel: authorization.channel, scopes: [...new Set(authorization.scopes)].sort() }
  const scopeKey = JSON.stringify(request)
  const cached = account.tokens.get(scopeKey)
  if (cached?.token && cached.expires! > Date.now() + EXPIRY_MARGIN_MS) return cached.token
  if (cached?.pending) return cached.pending

  const entry: TokenEntry = {}
  account.tokens.set(scopeKey, entry)
  entry.pending = (async () => {
    try {
      const data = await dogecloudApi('/auth/tmp_token.json', request, true, accessKey, secretKey)
      // Credential changes and invalidation detach the account, including any refresh already in flight.
      if (accounts.get(accountId(accessKey)) !== account) return {}
      const credentials = data?.Credentials
      const expires = data?.ExpiredAt * 1000
      if (
        !Number.isFinite(expires) ||
        expires <= Date.now() + EXPIRY_MARGIN_MS ||
        !credentials ||
        ![credentials.accessKeyId, credentials.secretAccessKey, credentials.sessionToken].every(
          value => typeof value === 'string' && value.length > 0,
        )
      ) {
        return {}
      }
      entry.token = Object.freeze({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      })
      entry.expires = expires
      return entry.token
    } catch {
      return {}
    } finally {
      entry.pending = undefined
      if (!entry.token) account.tokens.delete(scopeKey)
    }
  })()
  return entry.pending
}
