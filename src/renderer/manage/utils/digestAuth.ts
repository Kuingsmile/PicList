import crypto from 'crypto'
import axios from 'axios'

const AUTH_KEY_VALUE_RE = /(\w+)=["']?([^'"]{1,10000})["']?/
let NC = 0
const NC_PAD = '00000000'

function md5 (text: crypto.BinaryLike) {
  return crypto.createHash('md5').update(text).digest('hex')
}

export function digestAuthHeader (method: string, uri: string, wwwAuthenticate: string, username: string, password: string) {
  const parts = wwwAuthenticate.split(',')
  const opts = {} as IStringKeyMap
  for (let i = 0; i < parts.length; i++) {
    const m = AUTH_KEY_VALUE_RE.exec(parts[i])
    if (m) {
      opts[m[1]] = m[2].replace(/["']/g, '')
    }
  }

  if (!opts.realm || !opts.nonce) {
    return ''
  }

  let qop = opts.qop || ''

  const userpassArray = [username, password]

  let nc = String(++NC)
  nc = NC_PAD.substring(nc.length) + nc
  const cnonce = crypto.randomBytes(8).toString('hex')

  const ha1 = md5(userpassArray[0] + ':' + opts.realm + ':' + userpassArray[1])
  const ha2 = md5(method.toUpperCase() + ':' + uri)
  let s = ha1 + ':' + opts.nonce
  if (qop) {
    qop = qop.split(',')[0]
    s += ':' + nc + ':' + cnonce + ':' + qop
  }
  s += ':' + ha2
  const response = md5(s)
  let authstring =
    'Digest username="' +
    userpassArray[0] +
    '", realm="' +
    opts.realm +
    '", nonce="' +
    opts.nonce +
    '", uri="' +
    uri +
    '", response="' +
    response +
    '"'
  if (opts.opaque) {
    authstring += ', opaque="' + opts.opaque + '"'
  }
  if (qop) {
    authstring += ', qop=' + qop + ', nc=' + nc + ', cnonce="' + cnonce + '"'
  }
  return authstring
}

export async function getAuthHeader (method: string, host: string, uri: string, username: string, password: string) {
  try {
    await axios.get(
      `${host}${uri}`
    )
  } catch (error: any) {
    if (error.response.status === 401 && error.response.headers['www-authenticate']) {
      return digestAuthHeader(method, uri, error.response.headers['www-authenticate'], username, password)
    }
  }
}
