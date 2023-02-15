import COS from 'cos-nodejs-sdk-v5'

export default class TcyunApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config: { secretId, secretKey, bucket, area, path } } = configMap
    try {
      const cos = new COS({
        SecretId: secretId,
        SecretKey: secretKey
      })
      let key
      if (path === '/' || !path) {
        key = `/${fileName}`
      } else {
        key = `/${path.replace(/^\//, '').replace(/\/$/, '')}${fileName}`
      }
      const result = await cos.deleteObject({
        Bucket: bucket,
        Region: area,
        Key: key
      })
      return result.statusCode === 204
    } catch (error) {
      return false
    }
  }
}
