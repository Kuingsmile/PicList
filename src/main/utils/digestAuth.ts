import crypto from 'node:crypto'

import axios from 'axios'

import { createDigestAuthHeader } from '#/utils/digestAuth'

export const digestAuthHeader = createDigestAuthHeader(
  (algorithm, text) => crypto.createHash(algorithm).update(text).digest('hex'),
  () => crypto.randomBytes(8).toString('hex'),
)

export async function getAuthHeader(
  method: string,
  host: string,
  uri: string,
  username: string,
  password: string,
  body: string | Buffer = '',
) {
  try {
    await axios.get(`${host}${uri}`)
  } catch (error: any) {
    if (error.response.status === 401 && error.response.headers['www-authenticate']) {
      return digestAuthHeader(method, uri, error.response.headers['www-authenticate'], username, password, body)
    }
  }
}
