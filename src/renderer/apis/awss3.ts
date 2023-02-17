import { S3 } from 'aws-sdk'

export default class AwsS3Api {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { imgUrl, config: { accessKeyID, secretAccessKey, bucketName, region, endpoint, pathStyleAccess } } = configMap
    try {
      const url = new URL(imgUrl)
      const fileKey = url.pathname
      let endpointUrl
      if (endpoint) {
        endpointUrl = endpoint
      } else {
        if (region) {
          endpointUrl = `https://s3.${region}.amazonaws.com`
        } else {
          endpointUrl = 'https://s3.us-east-1.amazonaws.com'
        }
      }
      let sslEnabled = true
      const endpointUrlObj = new URL(endpointUrl)
      sslEnabled = endpointUrlObj.protocol === 'https:'
      const client = new S3({
        accessKeyId: accessKeyID,
        secretAccessKey,
        endpoint: endpointUrl,
        s3ForcePathStyle: pathStyleAccess,
        sslEnabled,
        region: region || 'us-east-1'
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
