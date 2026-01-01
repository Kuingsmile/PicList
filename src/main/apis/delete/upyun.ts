import Upyun from 'upyun'

import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'

interface IConfigMap {
  fileName: string
  config: PartialKeys<IUpYunConfig, 'path'>
}

export default class UpyunApi {
  static async delete(configMap: IConfigMap): Promise<boolean> {
    const {
      fileName,
      config: { bucket, operator, password, path },
    } = configMap
    try {
      const service = new Upyun.Service(bucket, operator, password)
      const client = new Upyun.Client(service)
      let key
      if (path === '/' || !path) {
        key = fileName
      } else {
        key = `${path.replace(/^\/+|\/+$/, '')}/${fileName}`
      }
      const result = await client.deleteFile(key)
      deleteLog(fileName, 'Upyun', !!result)
      return !!result
    } catch (error: any) {
      deleteFailedLog(fileName, 'Upyun', error)
      return false
    }
  }
}
