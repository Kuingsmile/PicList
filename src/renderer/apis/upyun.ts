// @ts-ignore
import Upyun from 'upyun'

export default class UpyunApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config: { bucket, operator, password, path } } = configMap
    try {
      const service = new Upyun.Service(bucket, operator, password)
      const client = new Upyun.Client(service)
      let key
      if (path === '/' || !path) {
        key = fileName
      } else {
        key = `${path.replace(/^\//, '').replace(/\/$/, '')}/${fileName}`
      }
      const result = await client.deleteFile(key)
      return result
    } catch (error) {
      return false
    }
  }
}
