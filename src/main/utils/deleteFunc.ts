import { S3Client, DeleteObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import http, { AgentOptions } from 'http'
import https from 'https'
import { getAgent } from '../manage/utils/common'

export async function removeFileFromS3InMain (configMap: IStringKeyMap) {
  try {
    const { imgUrl, config: { accessKeyID, secretAccessKey, bucketName, region, endpoint, pathStyleAccess, rejectUnauthorized, proxy } } = configMap
    const url = new URL(!/^https?:\/\//.test(imgUrl) ? `http://${imgUrl}` : imgUrl)
    const fileKey = url.pathname.replace(/^\/+/, '')
    const endpointUrl: string | undefined = endpoint
      ? /^https?:\/\//.test(endpoint)
        ? endpoint
        : `http://${endpoint}`
      : undefined
    const sslEnabled = endpointUrl ? endpointUrl.startsWith('https') : true
    const agent = getAgent(proxy, sslEnabled)
    const commonOptions: AgentOptions = {
      keepAlive: true,
      keepAliveMsecs: 1000,
      scheduling: 'lifo' as 'lifo' | 'fifo' | undefined
    }
    const extraOptions = sslEnabled ? { rejectUnauthorized: !!rejectUnauthorized } : {}
    const handler = sslEnabled
      ? new NodeHttpHandler({
        httpsAgent: agent.https
          ? agent.https
          : new https.Agent({
            ...commonOptions,
            ...extraOptions
          })
      })
      : new NodeHttpHandler({
        httpAgent: agent.http
          ? agent.http
          : new http.Agent({
            ...commonOptions,
            ...extraOptions
          })
      })
    const s3Options: S3ClientConfig = {
      credentials: {
        accessKeyId: accessKeyID,
        secretAccessKey
      },
      endpoint: endpointUrl,
      tls: sslEnabled,
      forcePathStyle: pathStyleAccess,
      region,
      requestHandler: handler
    }
    const client = new S3Client(s3Options)
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey
    })
    const result = await client.send(command)
    return result.$metadata.httpStatusCode === 204
  } catch (err: any) {
    console.log(err)
    return false
  }
}
