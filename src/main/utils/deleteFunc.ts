import { S3Client, DeleteObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import http, { AgentOptions } from 'http'
import https from 'https'
import { getAgent } from '../manage/utils/common'
import axios from 'axios'
import crypto from 'crypto'
import querystring from 'querystring'

interface DogecloudTokenFull {
  Credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken: string
  },
  ExpiredAt: number,
  Buckets: {
    name: string
    s3Bucket: string
    s3Endpoint: string
  }[]
}

const dogeRegionMap: IStringKeyMap = {
  'ap-shanghai': '0',
  'ap-beijing': '1',
  'ap-guangzhou': '2',
  'ap-chengdu': '3'
}

async function dogecloudApi (
  apiPath: string,
  data = {},
  jsonMode: boolean = false,
  accessKey: string,
  secretKey: string
) {
  const body = jsonMode ? JSON.stringify(data) : querystring.encode(data)
  const sign = crypto.createHmac('sha1', secretKey).update(Buffer.from(apiPath + '\n' + body, 'utf8')).digest('hex')
  const authorization = `TOKEN ${accessKey}:${sign}`
  try {
    const res = await axios.request({
      url: `https://api.dogecloud.com${apiPath}`,
      method: 'POST',
      data: body,
      responseType: 'json',
      headers: {
        'Content-Type': jsonMode ? 'application/json' : 'application/x-www-form-urlencoded',
        Authorization: authorization
      }
    })
    if (res.data.code !== 200) {
      throw new Error('API Error')
    }
    return res.data.data
  } catch (err: any) {
    throw new Error('API Error')
  }
}

async function getDogeToken (accessKey: string, secretKey: string): Promise<{} | DogecloudTokenFull> {
  try {
    const data = await dogecloudApi('/auth/tmp_token.json', {
      channel: 'OSS_FULL',
      scopes: ['*']
    }, true, accessKey, secretKey)
    return data
  } catch (err: any) {
    console.log(err)
    return {}
  }
}

export async function removeFileFromS3InMain (configMap: IStringKeyMap, dogeMode: boolean = false) {
  try {
    const { imgUrl, config: { accessKeyID, secretAccessKey, bucketName, region, endpoint, pathStyleAccess, rejectUnauthorized, proxy } } = configMap
    const url = new URL(!/^https?:\/\//.test(imgUrl) ? `http://${imgUrl}` : imgUrl)
    let fileKey = url.pathname.replace(/^\/+/, '')
    if (pathStyleAccess) {
      fileKey = fileKey.replace(/^[^/]+\//, '')
    }
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
    if (dogeMode) {
      s3Options.credentials = {
        accessKeyId: configMap.config.accessKeyID,
        secretAccessKey: configMap.config.secretAccessKey,
        sessionToken: configMap.config.sessionToken
      }
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

export async function removeFileFromDogeInMain (configMap: IStringKeyMap) {
  try {
    const { config: { bucketName, AccessKey, SecretKey } } = configMap
    const token = await getDogeToken(AccessKey, SecretKey) as DogecloudTokenFull
    const bucket = token.Buckets?.find(item => item.name === bucketName || item.s3Bucket === bucketName)
    const newConfigMap = Object.assign({}, configMap)
    newConfigMap.config = {
      ...newConfigMap.config,
      accessKeyID: token.Credentials?.accessKeyId,
      secretAccessKey: token.Credentials?.secretAccessKey,
      sessionToken: token.Credentials?.sessionToken,
      endpoint: bucket?.s3Endpoint,
      region: dogeRegionMap[bucket?.s3Endpoint?.split('.')[1] || 'ap-shanghai'],
      bucketName: bucket?.s3Bucket
    }
    return await removeFileFromS3InMain(newConfigMap, true)
  } catch (err: any) {
    console.log(err)
    return false
  }
}

function createHuaweiAuthorization (
  bucketName: string,
  path: string,
  fileName: string,
  accessKey: string,
  secretKey: string,
  date: string = new Date().toUTCString()
) {
  const strToSign = `DELETE\n\n\n${date}\n/${bucketName}${path}/${fileName}`
  const singature = crypto.createHmac('sha1', secretKey).update(strToSign).digest('base64')
  return `OBS ${accessKey}:${singature}`
}

export async function removeFileFromHuaweiInMain (configMap: IStringKeyMap) {
  const { fileName, config } = configMap
  const { accessKeyId, accessKeySecret, bucketName, endpoint } = config
  let path = config.path || '/'
  path = `/${path.replace(/^\/+|\/+$/, '')}`
  path = path === '/' ? '' : path
  const date = new Date().toUTCString()
  const authorization = createHuaweiAuthorization(bucketName, path, fileName, accessKeyId, accessKeySecret, date)
  try {
    const res = await axios.request({
      url: `https://${bucketName}.${endpoint}${encodeURI(path)}/${encodeURIComponent(fileName)}`,
      method: 'DELETE',
      responseType: 'json',
      headers: {
        Host: `${bucketName}.${endpoint}`,
        Date: date,
        Authorization: authorization
      }
    })
    return res.status === 204
  } catch (error) {
    console.log(error)
    return false
  }
}
