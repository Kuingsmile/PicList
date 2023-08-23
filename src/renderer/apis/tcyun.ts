import COS from 'cos-nodejs-sdk-v5'

interface IConfigMap {
  fileName: string;
  config: {
    secretId: string;
    secretKey: string;
    bucket: string;
    area: string;
    path?: string;
  };
}

export default class TcyunApi {
  private static createCOS (SecretId: string, SecretKey: string): COS {
    return new COS({
      SecretId,
      SecretKey
    })
  }

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { fileName, config: { secretId, secretKey, bucket, area, path } } = configMap
    try {
      const cos = TcyunApi.createCOS(secretId, secretKey)
      let key
      if (path === '/' || !path) {
        key = `/${fileName}`
      } else {
        key = `/${path.replace(/^\/+|\/+$/, '')}/${fileName}`
      }
      const result = await cos.deleteObject({
        Bucket: bucket,
        Region: area,
        Key: key
      })
      return result.statusCode === 204
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
