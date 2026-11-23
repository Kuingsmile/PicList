import crypto from 'node:crypto'
import http, { AgentOptions } from 'node:http'
import https from 'node:https'
import path from 'node:path'
import querystring from 'node:querystring'

import { DeleteObjectCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'
import logger from '@core/picgo/logger'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import axios from 'axios'
import type { ISftpPlistConfig } from 'piclist'

import { getAgent } from '~/manage/utils/common'
import SSHClient from '~/utils/sshClient'

interface DogecloudTokenFull {
  Credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken: string
  }
  ExpiredAt: number
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
  'ap-chengdu': '3',
}

async function dogecloudApi(
  apiPath: string,
  data = {},
  jsonMode: boolean = false,
  accessKey: string,
  secretKey: string,
) {
  const body = jsonMode ? JSON.stringify(data) : querystring.encode(data)
  const sign = crypto
    .createHmac('sha1', secretKey)
    .update(Buffer.from(apiPath + '\n' + body, 'utf8'))
    .digest('hex')
  const authorization = `TOKEN ${accessKey}:${sign}`
  try {
    const res = await axios.request({
      url: `https://api.dogecloud.com${apiPath}`,
      method: 'POST',
      data: body,
      responseType: 'json',
      headers: {
        'Content-Type': jsonMode ? 'application/json' : 'application/x-www-form-urlencoded',
        Authorization: authorization,
      },
    })
    if (res.data.code !== 200) {
      throw new Error('API Error')
    }
    return res.data.data
  } catch (err: any) {
    throw new Error('API Error', { cause: err })
  }
}

async function getDogeToken(accessKey: string, secretKey: string): Promise<IObj | DogecloudTokenFull> {
  try {
    const data = await dogecloudApi(
      '/auth/tmp_token.json',
      {
        channel: 'OSS_FULL',
        scopes: ['*'],
      },
      true,
      accessKey,
      secretKey,
    )
    return data
  } catch (err: any) {
    logger.error(err)
    return {}
  }
}

function getS3DeleteTarget(item: ImgInfo) {
  const isS3 = item.type === 'aws-s3' || item.type === 'aws-s3-plist'
  if (isS3 && item.s3Object) {
    return { Bucket: item.s3Object.bucket, Key: item.s3Object.key }
  }

  const { bucketName, pathStyleAccess, urlPrefix, disableBucketPrefixToURL } = item.config
  const imgUrl: string = (isS3 && item.url) || item.imgUrl || ''
  let fileKey: string
  if (urlPrefix && imgUrl.startsWith(urlPrefix)) {
    // Mirror the uploader's public URL prefix, including legacy string settings.
    let prefix = urlPrefix.replace(/\/$/, '') + '/'
    if (isS3 && pathStyleAccess && String(disableBucketPrefixToURL).toLowerCase() !== 'true') {
      prefix += bucketName + '/'
    }
    if (!imgUrl.startsWith(prefix)) throw new Error('Gallery URL does not match the configured object prefix')
    fileKey = imgUrl.slice(prefix.length).split(/[?#]/, 1)[0]
  } else {
    const url = new URL(!/^https?:\/\//.test(imgUrl) ? `http://${imgUrl}` : imgUrl)
    fileKey = url.pathname.slice(1)
    if (pathStyleAccess) {
      fileKey = fileKey.replace(/^[^/]+\//, '')
    }
  }
  try {
    fileKey = decodeURIComponent(fileKey)
  } catch {
    // Older URLs may contain a literal percent sign.
  }
  return { Bucket: bucketName, Key: fileKey }
}

export async function removeFileFromS3InMain(configMap: IStringKeyMap, dogeMode: boolean = false) {
  const target = getS3DeleteTarget(configMap)
  const { accessKeyID, secretAccessKey, endpoint, pathStyleAccess, rejectUnauthorized, proxy } = configMap.config
  let { region } = configMap.config
  const endpointUrl: string | undefined = endpoint
    ? /^https?:\/\//.test(endpoint)
      ? endpoint
      : `http://${endpoint}`
    : undefined
  if (endpointUrl && endpointUrl.includes('cloudflarestorage')) {
    region = region || 'auto'
  }
  const sslEnabled = endpointUrl ? endpointUrl.startsWith('https') : true
  const agent = getAgent(proxy, sslEnabled)
  const commonOptions: AgentOptions = {
    keepAlive: true,
    keepAliveMsecs: 1000,
    scheduling: 'lifo' as 'lifo' | 'fifo' | undefined,
  }
  const extraOptions = sslEnabled ? { rejectUnauthorized: !!rejectUnauthorized } : {}
  const handler = sslEnabled
    ? new NodeHttpHandler({
        httpsAgent: agent.https
          ? agent.https
          : new https.Agent({
              ...commonOptions,
              ...extraOptions,
            }),
      })
    : new NodeHttpHandler({
        httpAgent: agent.http
          ? agent.http
          : new http.Agent({
              ...commonOptions,
              ...extraOptions,
            }),
      })
  const s3Options: S3ClientConfig = {
    credentials: {
      accessKeyId: accessKeyID,
      secretAccessKey,
    },
    endpoint: endpointUrl,
    tls: sslEnabled,
    forcePathStyle: pathStyleAccess,
    region,
    requestHandler: handler,
  }
  if (dogeMode) {
    s3Options.credentials = {
      accessKeyId: configMap.config.accessKeyID,
      secretAccessKey: configMap.config.secretAccessKey,
      sessionToken: configMap.config.sessionToken,
    }
  }
  let result: any
  try {
    const client = new S3Client(s3Options)
    const command = new DeleteObjectCommand(target)
    result = await client.send(command)
  } catch (_err: any) {
    s3Options.region = 'us-east-1'
    const client = new S3Client(s3Options)
    const command = new DeleteObjectCommand(target)
    result = await client.send(command)
  }
  return result.$metadata.httpStatusCode === 204
}

export async function removeFileFromDogeInMain(configMap: IStringKeyMap) {
  const {
    config: { bucketName, AccessKey, SecretKey },
  } = configMap
  const token = (await getDogeToken(AccessKey, SecretKey)) as DogecloudTokenFull
  const bucket = token.Buckets?.find(item => item.name === bucketName || item.s3Bucket === bucketName)
  const newConfigMap = { ...configMap }
  newConfigMap.config = {
    ...newConfigMap.config,
    accessKeyID: token.Credentials?.accessKeyId,
    secretAccessKey: token.Credentials?.secretAccessKey,
    sessionToken: token.Credentials?.sessionToken,
    endpoint: bucket?.s3Endpoint,
    region: dogeRegionMap[bucket?.s3Endpoint?.split('.')[1] || 'ap-shanghai'],
    bucketName: bucket?.s3Bucket,
  }
  return await removeFileFromS3InMain(newConfigMap, true)
}

function createHuaweiAuthorization(
  bucketName: string,
  path: string,
  fileName: string,
  accessKey: string,
  secretKey: string,
  date: string = new Date().toUTCString(),
) {
  const strToSign = `DELETE\n\n\n${date}\n/${bucketName}${path}/${fileName}`
  const singature = crypto.createHmac('sha1', secretKey).update(strToSign).digest('base64')
  return `OBS ${accessKey}:${singature}`
}

export async function removeFileFromHuaweiInMain(configMap: IStringKeyMap) {
  const { fileName, config } = configMap
  const { accessKeyId, accessKeySecret, bucketName, endpoint } = config
  let path = config.path || '/'
  path = `/${path.replace(/^\/+|\/+$/, '')}`
  path = path === '/' ? '' : path
  const date = new Date().toUTCString()
  const authorization = createHuaweiAuthorization(bucketName, path, fileName, accessKeyId, accessKeySecret, date)
  const res = await axios.request({
    url: `https://${bucketName}.${endpoint}${encodeURI(path)}/${encodeURIComponent(fileName)}`,
    method: 'DELETE',
    responseType: 'json',
    headers: {
      Host: `${bucketName}.${endpoint}`,
      Date: date,
      Authorization: authorization,
    },
  })
  return res.status === 204
}

export async function removeFileFromSFTPInMain(config: ISftpPlistConfig, fileName: string) {
  const client = new SSHClient()
  const uploadPath = path.posix.resolve('/', (config.uploadPath || '').replace(/\\/g, '/'))
  const normalizedName = path.posix.normalize(fileName.replace(/\\/g, '/'))
  const remote = path.posix.resolve(uploadPath, normalizedName)
  const relative = path.posix.relative(uploadPath, remote)
  if (
    !relative ||
    relative === '..' ||
    relative.startsWith('../') ||
    normalizedName === '..' ||
    normalizedName.startsWith('../') ||
    path.win32.parse(fileName).root ||
    remote.includes('\0') ||
    remote.includes('*')
  ) {
    return false
  }
  try {
    await client.connect(config)
    await client.deleteFile(remote)
    return true
  } catch (_error) {
    logger.error('SFTP deletion failed')
    return false
  } finally {
    client.close()
  }
}
