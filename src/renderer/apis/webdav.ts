import { createClient } from 'webdav'
import { formatEndpoint } from '~/main/manage/utils/common'

export default class WebdavApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config: { host, username, password, path, sslEnabled } } = configMap
    const endpoint = formatEndpoint(host, sslEnabled)
    const ctx = createClient(
      endpoint,
      {
        username,
        password
      }
    )
    let key
    if (path === '/' || !path) {
      key = fileName
    } else {
      key = `${path.replace(/^\//, '').replace(/\/$/, '')}/${fileName}`
    }
    try {
      await ctx.deleteFile(key)
      return true
    } catch (error) {
      return false
    }
  }
}
