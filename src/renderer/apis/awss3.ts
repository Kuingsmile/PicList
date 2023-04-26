import { S3 } from 'aws-sdk'

export default class AwsS3Api {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { imgUrl, config: { accessKeyID, secretAccessKey, bucketName, region, endpoint, pathStyleAccess, bucketEndpoint, rejectUnauthorized } } = configMap
    try {
      const url = new URL(!/^https?:\/\//.test(imgUrl) ? `http://${imgUrl}` : imgUrl)
      const fileKey = url.pathname
      let endpointUrl
      if (endpoint) {
        if (!/^https?:\/\//.test(endpoint)) {
          endpointUrl = `http://${endpoint}`
        } else {
          endpointUrl = endpoint
        }
      }
      let sslEnabled = true
      if (endpointUrl) {
        sslEnabled = endpointUrl.startsWith('https')
      }
      const http = sslEnabled ? require('https') : require('http')
      const client = new S3({
        accessKeyId: accessKeyID,
        secretAccessKey,
        endpoint: endpointUrl,
        s3ForcePathStyle: pathStyleAccess,
        sslEnabled,
        region,
        s3BucketEndpoint: bucketEndpoint,
        httpOptions: {
          agent: new http.Agent({
            rejectUnauthorized,
            timeout: 30000
          })
        }
      })
      const result = await client.deleteObject({
        Bucket: bucketName,
        Key: fileKey.replace(/^\//, '')
      }).promise()
      return result.$response.httpResponse.statusCode === 204
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
