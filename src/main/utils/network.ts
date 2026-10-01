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
  if (/^https?:\/\//.test(proxy)) {
    const { protocol, hostname, port } = new URL(proxy)
    return type === 'string'
      ? `${protocol}//${hostname}:${port}`
      : {
          host: hostname,
          port: Number(port),
          protocol: protocol.slice(0, -1),
        }
  }
  const [host, port] = proxy.split(':')
  return type === 'string'
    ? `http://${host}:${port}`
    : {
        host,
        port: port ? Number(port) : 80,
        protocol: 'http',
      }
}
