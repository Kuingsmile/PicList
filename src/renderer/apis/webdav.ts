import { AuthType, WebDAVClientOptions, createClient } from 'webdav'
import { formatEndpoint } from '~/main/manage/utils/common'

export default class WebdavApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config: { host, username, password, path, sslEnabled, authType } } = configMap
    const endpoint = formatEndpoint(host, sslEnabled)
    const options: WebDAVClientOptions = {
      username,
      password
    }
    if (authType === 'digest') {
      options.authType = AuthType.Digest
    }
    const ctx = createClient(
      endpoint,
      options
    )
    let key
    if (path === '/' || !path) {
      key = fileName
    } else {
      key = `${path.replace(/^\/+|\/+$/, '')}/${fileName}`
    }
    try {
      await ctx.deleteFile(key)
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
