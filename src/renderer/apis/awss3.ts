import { S3 } from 'aws-sdk'

export default class AwsS3Api {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { imgUrl, config: { accessKeyID, secretAccessKey, bucketName, region, endpoint, pathStyleAccess, bucketEndpoint, rejectUnauthorized } } = configMap
    try {
      const url = new URL((!imgUrl.startsWith('http') && !imgUrl.startsWith('https')) ? `http://${imgUrl}` : imgUrl)
      const fileKey = url.pathname
      let endpointUrl
      if (endpoint) {
        if (!endpoint.startsWith('http') && !endpoint.startsWith('https')) {
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
            rejectUnauthorized
          })
        }
      })
      const result = await client.deleteObject({
        Bucket: bucketName,
        Key: fileKey.replace(/^\//, '')
      }).promise()
      return result.$response.httpResponse.statusCode === 204
    } catch (error) {
      return false
    }
  }
}
