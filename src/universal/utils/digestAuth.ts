type DigestHash = (algorithm: string, text: string | Buffer) => string

const DIGEST_ALGORITHMS: Record<string, string> = {
  MD5: 'md5',
  'SHA-256': 'sha256',
  'SHA-512-256': 'sha512-256',
}
const AUTH_PARAMETER_RE = /^([\w-]+)\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^\s,"]+))$/

function parseDigestChallenges(header: string) {
  const challenges: Record<string, string>[] = []
  let current: Record<string, string> | undefined
  // Commas inside quoted values (including qop lists) do not separate parameters.
  const parts = header.match(/(?:[^,"]|"(?:\\.|[^"\\])*")+/g) ?? []
  for (const part of parts) {
    let parameter = AUTH_PARAMETER_RE.exec(part.trim())
    if (!parameter) {
      const scheme = /^([\w-]+)(?:\s+(.+))?$/.exec(part.trim())
      current = undefined
      if (scheme?.[1].toLowerCase() !== 'digest') continue
      current = {}
      challenges.push(current)
      parameter = AUTH_PARAMETER_RE.exec(scheme[2] ?? '')
    }
    if (current && parameter) {
      current[parameter[1].toLowerCase()] = (parameter[2] ?? parameter[3]).replace(/\\(.)/g, '$1')
    }
  }
  return challenges
}

function quote(value: string) {
  return `"${value.replace(/["\\]/g, '\\$&')}"`
}

export function createDigestAuthHeader(createHash: DigestHash, createCnonce: () => string) {
  const nonceCounts = new Map<string, number>()

  return (
    method: string,
    uri: string,
    header: string,
    username: string,
    password: string,
    body: string | Buffer = '',
  ) => {
    // RFC 7616: choose the first supported challenge in the server's preference order.
    for (const options of parseDigestChallenges(header)) {
      if (options.realm === undefined || !options.nonce) continue
      const algorithm = options.algorithm ?? 'MD5'
      const normalizedAlgorithm = algorithm.toUpperCase()
      const sessionAlgorithm = normalizedAlgorithm.endsWith('-SESS')
      const hashAlgorithm = DIGEST_ALGORITHMS[normalizedAlgorithm.replace(/-SESS$/, '')]
      if (!hashAlgorithm) continue

      const offeredQops = options.qop?.split(',').map(qop => qop.trim().toLowerCase())
      const qop = offeredQops?.includes('auth') ? 'auth' : offeredQops?.includes('auth-int') ? 'auth-int' : ''
      if (options.qop !== undefined && !qop) continue

      const hash = (text: string | Buffer) => createHash(hashAlgorithm, text)
      const cnonce = createCnonce()
      const nonceKey = JSON.stringify([username, options.realm, options.nonce, normalizedAlgorithm])
      const count = ((nonceCounts.get(nonceKey) ?? 0) % 0xffffffff) + 1
      // Bound cached challenge state; a fresh cnonce allows a new session after eviction.
      if (!nonceCounts.has(nonceKey) && nonceCounts.size >= 256) {
        nonceCounts.delete(nonceCounts.keys().next().value!)
      }
      nonceCounts.set(nonceKey, count)
      const nc = count.toString(16).padStart(8, '0')

      let ha1 = hash(`${username}:${options.realm}:${password}`)
      if (sessionAlgorithm) ha1 = hash(`${ha1}:${options.nonce}:${cnonce}`)
      // auth-int hashes the actual entity body, including the empty body of a GET.
      const ha2 = hash(`${method.toUpperCase()}:${uri}${qop === 'auth-int' ? `:${hash(body)}` : ''}`)
      const response = hash(`${ha1}:${options.nonce}${qop ? `:${nc}:${cnonce}:${qop}` : ''}:${ha2}`)
      const userhash = options.userhash?.toLowerCase() === 'true'
      const parameters = [
        `username=${quote(userhash ? hash(`${username}:${options.realm}`) : username)}`,
        `realm=${quote(options.realm)}`,
        `nonce=${quote(options.nonce)}`,
        `uri=${quote(uri)}`,
        `response=${quote(response)}`,
      ]
      if (options.algorithm !== undefined) parameters.push(`algorithm=${algorithm}`)
      if (options.opaque !== undefined) parameters.push(`opaque=${quote(options.opaque)}`)
      if (qop) parameters.push(`qop=${qop}`, `nc=${nc}`)
      if (qop || sessionAlgorithm) parameters.push(`cnonce=${quote(cnonce)}`)
      if (userhash) parameters.push('userhash=true')
      return `Digest ${parameters.join(', ')}`
    }
    return ''
  }
}
