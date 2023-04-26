import Qiniu from 'qiniu'

export default class QiniuApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config: { accessKey, secretKey, bucket, path } } = configMap
    const mac = new Qiniu.auth.digest.Mac(accessKey, secretKey)
    const qiniuConfig = new Qiniu.conf.Config()
    try {
      const bucketManager = new Qiniu.rs.BucketManager(mac, qiniuConfig)
      let key = ''
      if (path === '/' || !path) {
        key = fileName
      } else {
        key = `${path.replace(/^\//, '').replace(/\/$/, '')}/${fileName}`
      }
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
      return res && res.respInfo.statusCode === 200
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
