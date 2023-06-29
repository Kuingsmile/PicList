import OSS from 'ali-oss'

interface IConfigMap {
  fileName: string
  config: {
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    area: string
    path?: string
  }
}

export default class AliyunApi {
  private static createClient (config: IConfigMap['config']): OSS {
    const { accessKeyId, accessKeySecret, bucket, area } = config
    return new OSS({
      accessKeyId,
      accessKeySecret,
      bucket,
      region: area
    })
  }

  private static getKey (fileName: string, path?: string): string {
    return path && path !== '/'
      ? `${path.replace(/^\//, '').replace(/\/$/, '')}/${fileName}`
      : fileName
  }

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      const client = AliyunApi.createClient(config)
      const key = AliyunApi.getKey(fileName, config.path)
      const result = await client.delete(key) as any
      return result.res.status === 204
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
