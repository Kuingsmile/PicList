import { AuthType, createClient, WebDAVClientOptions } from 'webdav'

import { formatEndpoint } from '~/utils/common'
import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'

interface IConfigMap {
  fileName: string
  config: PartialKeys<IWebdavPlistConfig, 'path'>
}

export default class WebdavApi {
  static async delete(configMap: IConfigMap): Promise<boolean> {
    const {
      fileName,
      config: { host, username, password, path, sslEnabled, authType },
    } = configMap
    const endpoint = formatEndpoint(host, sslEnabled)
    const options: WebDAVClientOptions = {
      username,
      password,
    }
    if (authType === 'digest') {
      options.authType = AuthType.Digest
    }
    const ctx = createClient(endpoint, options)
    let key
    if (path === '/' || !path) {
      key = fileName
    } else {
      key = `${path.replace(/^\/+|\/+$/, '')}/${fileName}`
    }
    try {
      await ctx.deleteFile(key)
      deleteLog(fileName, 'WebDAV')
      return true
    } catch (error: any) {
      deleteFailedLog(fileName, 'WebDAV', error)
      return false
    }
  }
}
