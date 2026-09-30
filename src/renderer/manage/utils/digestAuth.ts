import { createDigestAuthHeader } from '#/utils/digestAuth'

export const digestAuthHeader = createDigestAuthHeader(
  (algorithm, text) => window.node.crypto.createHash(algorithm, text),
  () => window.node.crypto.randomBytes(8).toString('hex'),
)

export async function getAuthHeader(
  method: string,
  host: string,
  uri: string,
  username: string,
  password: string,
  signal?: AbortSignal,
  body: string | Buffer = '',
) {
  const response = await fetch(`${host}${uri}`, { signal })
  try {
    if (response.status === 401 && response.headers.get('www-authenticate')) {
      return digestAuthHeader(method, uri, response.headers.get('www-authenticate')!, username, password, body)
    }
  } finally {
    // Only the challenge headers are needed; do not keep downloading its body.
    await response.body?.cancel()
  }
}
