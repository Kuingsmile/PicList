import Qiniu from 'qiniu'

interface IConfigMap {
  fileName: string;
  config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    path?: string;
  }
}

export default class QiniuApi {
  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { fileName, config: { accessKey, secretKey, bucket, path } } = configMap
    const mac = new Qiniu.auth.digest.Mac(accessKey, secretKey)
    const qiniuConfig = new Qiniu.conf.Config()
    try {
      const bucketManager = new Qiniu.rs.BucketManager(mac, qiniuConfig)
      const formattedPath = path?.replace(/^\/+|\/+$/, '') || ''
      const key = path === '/' || !path ? fileName : `${formattedPath}/${fileName}`
      const res = await new Promise((resolve, reject) => {
        bucketManager.delete(bucket, key, (err, respBody, respInfo) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              respBody,
              respInfo
            })
          }
        })
      }) as any
      return res?.respInfo?.statusCode === 200
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
