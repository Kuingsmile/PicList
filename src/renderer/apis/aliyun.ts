import OSS from 'ali-oss'

export default class AliyunApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config: { accessKeyId, accessKeySecret, bucket, area, path } } = configMap
    try {
      const client = new OSS({
        accessKeyId,
        accessKeySecret,
        bucket,
        region: area
      })
      let key
      if (path === '/' || !path) {
        key = fileName
      } else {
        key = `${path.replace(/^\//, '').replace(/\/$/, '')}/${fileName}`
      }
      const result = await client.delete(key) as any
      return result.res.status === 204
    } catch (error) {
      return false
    }
  }
}
