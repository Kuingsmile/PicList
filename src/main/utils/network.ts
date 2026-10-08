import picgo from '@core/picgo'

import { handleUrlEncode } from '#/utils/url'
import { configPaths } from '~/utils/configPaths'

export const handleUrlEncodeWithSetting = (url: string) =>
  picgo.getConfig<boolean>(configPaths.settings.encodeOutputURL) ? handleUrlEncode(url) : url

export const formatHttpProxy = (
  proxy: string | undefined,
  type: 'object' | 'string',
): IHTTPProxy | undefined | string => {
  if (!proxy) return undefined
  try {
    const { protocol, host, hostname, port, username, password } = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(proxy) ? proxy : `http://${proxy}`,
    )
    if (protocol !== 'http:' && protocol !== 'https:') throw new Error('Unsupported proxy protocol')
    const auth =
      username || password
        ? { username: decodeURIComponent(username), password: decodeURIComponent(password) }
        : undefined
    return type === 'string'
      ? `${protocol}//${auth ? `${username}:${password}@` : ''}${host}`
      : {
          host: hostname,
          port: Number(port || (protocol === 'https:' ? 443 : 80)),
          protocol: protocol.slice(0, -1),
          ...(auth && { auth }),
        }
  } catch {
    // URL parsing errors can retain the input, including proxy credentials.
    throw new Error('Invalid HTTP proxy URL')
  }
}
