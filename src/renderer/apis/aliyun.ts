import { IAliYunConfig, PartialKeys } from '#/types/types'
import { deleteFailedLog, deleteLog } from '#/utils/deleteLog'

interface IConfigMap {
  fileName: string
  config: PartialKeys<IAliYunConfig, 'path'>
}

export default class AliyunApi {
  static #getKey (fileName: string, path?: string): string {
    return path && path !== '/' ? `${path.replace(/^\/+|\/+$/, '')}/${fileName}` : fileName
  }

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      const client = new window.node.OSS({ ...config, region: config.area })
      const key = AliyunApi.#getKey(fileName, config.path)
      const result = await client.delete(key)
      if (result.res.status === 204) {
        deleteLog(fileName, 'Aliyun')
        return true
      }
      deleteLog(fileName, 'Aliyun', false)
      return false
    } catch (error: any) {
      deleteFailedLog(fileName, 'Aliyun', error)
      return false
    }
  }
}
