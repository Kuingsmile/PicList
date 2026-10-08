import crypto from 'node:crypto'

import axios from 'axios'

import { createDigestAuthHeader } from '#/utils/digestAuth'

export const digestAuthHeader = createDigestAuthHeader(
  (algorithm, text) => crypto.createHash(algorithm).update(text).digest('hex'),
  () => crypto.randomBytes(8).toString('hex'),
)

export async function getAuthHeader(
  method: string,
  url: string,
  username: string,
  password: string,
  body: string | Buffer = '',
) {
  const target = new URL(url)
  try {
    await axios.get(target.href)
  } catch (error: any) {
    if (error.response.status === 401 && error.response.headers['www-authenticate']) {
      return digestAuthHeader(
        method,
        target.pathname + target.search,
        error.response.headers['www-authenticate'],
        username,
        password,
        body,
      )
    }
  }
}
