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
        key = `${path.replace(/^\/+|\/+$/, '')}/${fileName}`
      }
      return await client.deleteFile(key)
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
