import http, { AgentOptions } from 'node:http'
import https from 'node:https'

import {
  _Object,
  BucketLocationConstraint,
  CommonPrefix,
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketLocationCommand,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutBucketAclCommand,
  PutObjectCommand,
  PutPublicAccessBlockCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3'
import { Progress, Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@smithy/node-http-handler'

import type { DeleteResult } from '#/deletion'
import type { ListingData } from '#/listing'
import { formatEndpoint } from '#/utils/url'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import {
  encodeObjectPath,
  formatError,
  getFileMimeType,
  getProxyAgents,
  getPublicObjectUrl,
} from '~/manage/utils/common'
import {
  deleteInBatches,
  deleteListedFolder,
  deletionError,
  failedKeys,
  keyedDeleteResult,
  nextDeleteMarker,
} from '~/manage/utils/deleteObjects'
import {
  dogecloudApi,
  DogecloudToken,
  getTempToken,
  invalidateDogecloudTokens,
  isDogecloudAuthenticationError,
} from '~/manage/utils/dogeAPI'
import { scheduleHttpDownloads } from '~/manage/utils/downloadBatch'
import { ManageLogger } from '~/manage/utils/logger'
import { MIB, scheduleUploadBatch, withUploadStream } from '~/manage/utils/uploadFile'
import { isImage } from '~/utils/filesystem'

class S3plistApi {
  baseOptions: S3ClientConfig
  logger: ManageLogger
  private readonly proxyAgents: ReturnType<typeof getProxyAgents>
  private readonly clients = new Map<string, { token?: string; client: S3Client }>()
  dogeCloudSupport: boolean
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  region: string
  customUrl: string

  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    endpoint: string | undefined,
    sslEnabled: boolean,
    s3ForcePathStyle: boolean,
    proxy: string | undefined,
    logger: ManageLogger,
    dogeCloudSupport: boolean = false,
    bucketName: string = '',
    region: string = '',
    customUrl: string = '',
  ) {
    const normalizedEndpoint = typeof endpoint === 'string' ? endpoint.trim() : ''
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
    this.dogeCloudSupport = dogeCloudSupport
    this.bucketName = bucketName
    this.region = region.trim()
    this.customUrl = customUrl ? formatEndpoint(customUrl, sslEnabled).replace(/\/+$/, '') : ''
    this.proxyAgents = getProxyAgents(proxy)
    this.baseOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint: normalizedEndpoint
        ? formatEndpoint(normalizedEndpoint.replace(/^https?:\/\//i, ''), sslEnabled)
        : undefined,
      region: this.region || (normalizedEndpoint.toLowerCase().includes('cloudflarestorage') ? 'auto' : 'us-east-1'),
      tls: sslEnabled,
      forcePathStyle: s3ForcePathStyle,
      requestHandler: this.setAgent(sslEnabled),
    }
    this.logger = logger
  }

  async getDogeCloudToken(signal?: AbortSignal) {
    if (!this.dogeCloudSupport) return
    const token = (await getTempToken(this.accessKeyId, this.secretAccessKey, undefined, signal)) as DogecloudToken
    if (Object.keys(token).length === 0) {
      throw new Error('manage.setting.dogeCloudTokenError')
    }
    this.baseOptions.credentials = {
      accessKeyId: token.accessKeyId,
      secretAccessKey: token.secretAccessKey,
      sessionToken: token.sessionToken,
    }
  }

  createS3Client(options: S3ClientConfig): S3Client {
    // Multipart uploads install a job-specific abort handler and must keep their own client.
    const cacheable = options.requestHandler === this.baseOptions.requestHandler
    const key = JSON.stringify([options.region, options.endpoint])
    const sessionToken = (options.credentials as DogecloudToken)?.sessionToken
    const previous = this.clients.get(key)
    if (cacheable && previous && previous.token === sessionToken) return previous.client
    const client = new S3Client(options)
    if (this.dogeCloudSupport) {
      const accessKey = this.accessKeyId
      const secretKey = this.secretAccessKey
      const token = options.credentials as DogecloudToken
      // Includes multipart uploads, whose failures are handled by the transfer scheduler.
      client.middlewareStack.add(
        next => async args => {
          try {
            return await next(args)
          } catch (error) {
            if (isDogecloudAuthenticationError(error)) {
              invalidateDogecloudTokens(accessKey, secretKey, token)
              // eslint-disable-next-line preserve-caught-error -- The provider error can contain credentials.
              throw new Error('manage.setting.dogeCloudTokenError')
            }
            throw error
          }
        },
        { step: 'initialize', name: 'dogecloudAuthentication' },
      )
    }
    if (cacheable) this.clients.set(key, { token: sessionToken, client })
    return client
  }

  destroy() {
    // These SDK clients all borrow the account's one request handler.
    this.clients.clear()
    ;(this.baseOptions.requestHandler as NodeHttpHandler).destroy()
    this.proxyAgents.http?.destroy()
    this.proxyAgents.https?.destroy()
  }

  private setAgent(sslEnabled: boolean): NodeHttpHandler {
    const agent = this.proxyAgents
    const commonOptions: AgentOptions = {
      keepAlive: true,
      keepAliveMsecs: 1000,
      scheduling: 'lifo' as 'lifo' | 'fifo' | undefined,
    }
    const extraOptions = sslEnabled ? { rejectUnauthorized: false } : {}
    return sslEnabled
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
  }

  logParam = (error: any, method: string) =>
    this.logger.error(
      formatError(this.dogeCloudSupport ? new Error('DogeCloud request failed') : error, {
        class: 'S3plistApi',
        method,
      }),
    )

  formatFolder(item: CommonPrefix, slicedPrefix: string, urlPrefix: string): any {
    return {
      Key: item.Prefix,
      url: item.Prefix ? getPublicObjectUrl(urlPrefix, item.Prefix) : '',
      fileSize: 0,
      formatedTime: '',
      fileName: item.Prefix?.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      key: item.Prefix,
    }
  }

  formatFile(item: _Object, slicedPrefix: string, urlPrefix: string): any {
    const fileName = item.Key?.replace(slicedPrefix, '')
    return {
      ...item,
      key: item.Key,
      url: item.Key ? getPublicObjectUrl(urlPrefix, item.Key) : '',
      fileName,
      fileSize: item.Size,
      formatedTime: new Date(item.LastModified!).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName || ''),
    }
  }

  async putPublicAccess(bucketName: string, client: S3Client) {
    const input = {
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false,
      },
    }
    const command = new PutPublicAccessBlockCommand(input)
    const data = await client.send(command)
    this.checkBucketResponse(data)
  }

  private checkBucketResponse(data: { $metadata: { httpStatusCode?: number } }) {
    const status = data.$metadata.httpStatusCode
    if (!status || status < 200 || status >= 300) {
      throw Object.assign(new Error('Unexpected S3 response'), { $metadata: data.$metadata })
    }
  }

  private bucketCreationFailure(error: unknown, stage: ICreateBucketError['stage']): ICreateBucketError {
    const details = error as { name?: string; Code?: string; code?: string; $metadata?: { httpStatusCode?: number } }
    const code = details?.Code || details?.code || details?.name
    const status = details?.$metadata?.httpStatusCode
    // Provider messages can contain request URLs or credentials; only expose the error code and status.
    const safeCode = typeof code === 'string' && /^[\w.-]{1,80}$/.test(code) ? code : 'UnknownError'
    const message = this.dogeCloudSupport
      ? 'DogeCloudRequestFailed'
      : `${safeCode}${typeof status === 'number' ? ` (HTTP ${status})` : ''}`
    this.logParam(new Error(message), `createBucket.${stage}`)
    return { success: false, stage, error: message }
  }

  /**
   * 新建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: string
   * }
   */
  async createBucket(configMap: IStringKeyMap): Promise<ICreateBucketResult> {
    const { BucketName, region, acl = 'private' } = configMap
    let stage: ICreateBucketError['stage'] = 'create'
    try {
      await this.getDogeCloudToken()
      const options = { ...this.baseOptions } as S3ClientConfig
      const bucketRegion =
        (typeof region === 'string' ? region.trim() : '') ||
        (typeof this.baseOptions.region === 'string' ? this.baseOptions.region : 'us-east-1')
      options.region = bucketRegion
      // Classify the endpoint the client actually uses, not the duplicate form field.
      const hostname = options.endpoint ? new URL(options.endpoint as string).hostname.replace(/\.$/, '') : ''
      const isAws = !hostname || /(^|\.)(amazonaws\.com(\.cn)?|api\.aws)$/.test(hostname)
      if (hostname === 's3.amazonaws.com' && bucketRegion !== 'us-east-1') {
        // The global endpoint requires us-east-1 signing; use the selected region's endpoint instead.
        options.endpoint = undefined
      }
      const client = this.createS3Client(options)
      const createCommand = new CreateBucketCommand({
        Bucket: BucketName,
        ...(isAws
          ? {
              ObjectOwnership: 'BucketOwnerPreferred',
              ...(bucketRegion !== 'us-east-1'
                ? { CreateBucketConfiguration: { LocationConstraint: bucketRegion as BucketLocationConstraint } }
                : {}),
            }
          : { ACL: acl }),
      })
      this.checkBucketResponse(await client.send(createCommand))
      if (isAws && acl !== 'private') {
        stage = 'public-access'
        await this.putPublicAccess(BucketName, client)
        stage = 'acl'
        this.checkBucketResponse(await client.send(new PutBucketAclCommand({ Bucket: BucketName, ACL: acl })))
      }
      return true
    } catch (error) {
      return this.bucketCreationFailure(error, stage)
    }
  }

  private async getBucketRegion(client: S3Client, bucketName: string | undefined): Promise<string | null> {
    try {
      const data = await client.send(new GetBucketLocationCommand({ Bucket: bucketName }))
      if (data.$metadata.httpStatusCode === 200) return data.LocationConstraint?.toLowerCase() || 'us-east-1'
      this.logParam(data, 'getBucketLocation')
    } catch (error) {
      this.logParam(error, 'getBucketLocation')
    }
    return null
  }

  /**
   * 获取存储桶列表
   */
  async getBucketList(): Promise<ListingData> {
    try {
      if (this.dogeCloudSupport) {
        const res = await dogecloudApi('/oss/bucket/list.json', {}, false, this.accessKeyId, this.secretAccessKey)
        for (const item of res.buckets) {
          if (item.name === this.bucketName || item.s3Bucket === this.bucketName) {
            return {
              fullList: [{ Name: item.s3Bucket, CreationDate: item.ctime, Location: item.region }],
              success: true,
            }
          }
        }
        return { fullList: [], success: true }
      }
      const client = this.createS3Client(this.baseOptions)
      const data = await client.send(new ListBucketsCommand({}))
      if (data.$metadata.httpStatusCode !== 200) {
        this.logParam(data, 'getBucketList')
        return { fullList: [], success: false }
      }

      const endpoint = (this.baseOptions.endpoint as string) || ''
      const configuredRegion = this.region || (endpoint.includes('cloudflarestorage') ? 'auto' : '')
      const fullList = []
      for (const bucket of data.Buckets ?? []) {
        const location = configuredRegion || (await this.getBucketRegion(client, bucket.Name))
        fullList.push({ Name: bucket.Name, CreationDate: bucket.CreationDate, Location: location })
      }
      return { fullList, success: fullList.every(bucket => bucket.Location !== null) }
    } catch (error) {
      this.logParam(error, 'getBucketList')
      return { fullList: [], success: false }
    }
  }

  async getBucketListRecursively(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
    } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || this.customUrl || `https://${bucket}.s3.amazonaws.com`
    let marker: string | undefined
    let res: ListObjectsV2CommandOutput
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    try {
      await listing.wait(() => this.getDogeCloudToken(listing.signal))
      const client = this.createS3Client({
        ...this.baseOptions,
        region: String(region || this.baseOptions.region || 'us-east-1'),
      })
      do {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          MaxKeys: 1000,
          ContinuationToken: marker,
        })
        res = await listing.wait(() => client.send(command, { abortSignal: listing.signal }))
        if (res.$metadata.httpStatusCode === 200) {
          for (const item of res.Contents ?? []) {
            if (!item.Key || item.Key.endsWith('/')) continue
            result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          }
          await listing.publish(result)
          result.fullList = []
        } else {
          this.logParam(res, 'getBucketListRecursively')
          result.finished = true
          await listing.publish(result)
          result.fullList = []
          return
        }
        marker = res.NextContinuationToken
      } while (res.IsTruncated && !listing.signal.aborted)
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListRecursively')
      result.finished = true
      await listing.publish(result)
      result.fullList = []
      return
    }
    result.success = !listing.signal.aborted
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketListBackstage(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
    } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || this.customUrl || `https://${bucket}.s3.amazonaws.com`
    let marker: string | undefined
    let res: ListObjectsV2CommandOutput
    const result = {
      fullList: [] as any,
      success: false,
      finished: false,
    }
    try {
      await listing.wait(() => this.getDogeCloudToken(listing.signal))
      const client = this.createS3Client({
        ...this.baseOptions,
        region: String(region || this.baseOptions.region || 'us-east-1'),
      })
      do {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          MaxKeys: 1000,
          ContinuationToken: marker,
          Delimiter: '/',
        })
        res = await listing.wait(() => client.send(command, { abortSignal: listing.signal }))
        if (res.$metadata.httpStatusCode === 200) {
          res.CommonPrefixes &&
            res.CommonPrefixes.forEach((item: CommonPrefix) => {
              result.fullList.push(this.formatFolder(item, slicedPrefix, urlPrefix))
            })
          res.Contents &&
            res.Contents.forEach((item: _Object) => {
              result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
            })
          await listing.publish(result)
          result.fullList = []
        } else {
          this.logParam(res, 'getBucketListBackstage')
          result.finished = true
          await listing.publish(result)
          result.fullList = []
          return
        }
        marker = res.NextContinuationToken
      } while (res.IsTruncated && !listing.signal.aborted)
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketListBackstage')
      result.finished = true
      await listing.publish(result)
      result.fullList = []
      return
    }
    result.success = !listing.signal.aborted
    result.finished = true
    await listing.publish(result)
    result.fullList = []
  }

  async getBucketFileList(configMap: IStringKeyMap, listing: ListingContext): Promise<any> {
    const {
      bucketName: bucket,
      bucketConfig: { Location: region },
      prefix,
      marker,
      itemsPerPage,
    } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || this.customUrl || `https://${bucket}.s3.amazonaws.com`
    const result = {
      fullList: [] as any,
      isTruncated: false,
      nextMarker: '',
      success: false,
    }
    try {
      await listing.wait(() => this.getDogeCloudToken(listing.signal))
      const options = {
        ...this.baseOptions,
        region: String(region || this.baseOptions.region || 'us-east-1'),
      } as S3ClientConfig
      const client = this.createS3Client(options)
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: slicedPrefix,
        ContinuationToken: marker === '' ? undefined : marker,
        Delimiter: '/',
        MaxKeys: itemsPerPage,
      })
      const data = await listing.wait(() => client.send(command, { abortSignal: listing.signal }))
      if (data.$metadata.httpStatusCode === 200) {
        result.fullList = [
          ...(data.CommonPrefixes?.map(item => this.formatFolder(item, slicedPrefix, urlPrefix)) || []),
          ...(data.Contents?.map(item => this.formatFile(item, slicedPrefix, urlPrefix)) || []),
        ]
        result.isTruncated = data.IsTruncated || false
        result.nextMarker = data.NextContinuationToken || ''
        result.success = true
      }
    } catch (error) {
      if (!listing.signal.aborted) this.logParam(error, 'getBucketFileList')
    }
    return result
  }

  /**
   * 重命名文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * oldKey: string,
   * newKey: string
   * }
   */
  async renameBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, oldKey, newKey } = configMap
    if (oldKey === newKey) return true
    let result = false
    try {
      await this.getDogeCloudToken()
      const options = {
        ...this.baseOptions,
        region: String(region || this.baseOptions.region || 'us-east-1'),
      } as S3ClientConfig
      const client = this.createS3Client(options)
      const command = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${encodeURIComponent(bucketName)}/${encodeObjectPath(oldKey)}`,
        Key: newKey,
      })
      const data = await client.send(command)
      if (data.$metadata.httpStatusCode === 200) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: oldKey,
        })
        const deleteData = await client.send(deleteCommand)
        if (deleteData.$metadata.httpStatusCode === 204) {
          result = true
        } else {
          this.logParam(deleteData, 'renameBucketFile')
        }
      } else {
        this.logParam(data, 'renameBucketFile')
      }
    } catch (error) {
      this.logParam(error, 'renameBucketFile')
    }
    return result
  }

  /**
   * 删除文件
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string
   * }
   */
  async deleteBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    let result = false
    try {
      await this.getDogeCloudToken()
      const options = { ...this.baseOptions } as S3ClientConfig
      options.region = String(region || this.baseOptions.region || 'us-east-1')
      const client = this.createS3Client(options)
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
      const data = await client.send(command)
      if (data.$metadata.httpStatusCode === 204) {
        result = true
      } else {
        this.logParam(data, 'deleteBucketFile')
      }
    } catch (error) {
      this.logParam(error, 'deleteBucketFile')
    }
    return result
  }

  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFiles(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, region, keys } = configMap
    return deleteInBatches(keys, async batch => {
      await this.getDogeCloudToken()
      const client = this.createS3Client({
        ...this.baseOptions,
        region: String(region || this.baseOptions.region || 'us-east-1'),
      })
      const res = await client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: batch.map(Key => ({ Key })), Quiet: false },
        }),
      )
      return res.$metadata.httpStatusCode === 200
        ? keyedDeleteResult(batch, res.Deleted, res.Errors)
        : failedKeys(batch, deletionError(res))
    })
  }

  async deleteBucketFolder(configMap: IStringKeyMap): Promise<DeleteResult> {
    const { bucketName, region, key } = configMap
    return deleteListedFolder(
      key,
      async (prefix, marker) => {
        await this.getDogeCloudToken()
        const options = { ...this.baseOptions } as S3ClientConfig
        options.region = String(region || this.baseOptions.region || 'us-east-1')
        const client = this.createS3Client(options)
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: marker,
          MaxKeys: 1000,
        })
        const res = await client.send(command)
        if (res.$metadata.httpStatusCode !== 200) throw res
        return {
          keys: (res.Contents || []).map(item => item.Key!),
          nextMarker: nextDeleteMarker(res.IsTruncated === true, res.NextContinuationToken),
        }
      },
      keys => this.deleteBucketFiles({ ...configMap, keys }),
    )
  }

  /**
   * 获取预签名url
   * @param configMap
   * configMap = {
   * bucketName: string,
   * region: string,
   * key: string,
   * expires: number,
   * customUrl: string
   * }
   */
  async getPreSignedUrl(configMap: IStringKeyMap, signal?: AbortSignal): Promise<string> {
    const { bucketName, region, key, expires } = configMap
    try {
      await this.getDogeCloudToken(signal)
      signal?.throwIfAborted()
      const options = { ...this.baseOptions } as S3ClientConfig
      options.region = String(region || this.baseOptions.region || 'us-east-1')
      const client = this.createS3Client(options)
      const signedUrl = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        }),
        {
          expiresIn: expires || 3600,
        },
      )
      return signedUrl
    } catch (error) {
      if (!signal?.aborted) this.logParam(error, 'getPreSignedUrl')
      return 'error'
    }
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    let result = false
    try {
      await this.getDogeCloudToken()
      const options = { ...this.baseOptions } as S3ClientConfig
      options.region = String(region || this.baseOptions.region || 'us-east-1')
      const client = this.createS3Client(options)
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
      const data = await client.send(command)
      if (data.$metadata.httpStatusCode === 200) {
        result = true
      } else {
        this.logParam(data, 'createBucketFolder')
      }
    } catch (error) {
      this.logParam(error, 'createBucketFolder')
    }
    return result
  }

  /**
   * upload file
   * @param configMap
   */
  async uploadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleUploadBatch(
      configMap,
      {
        provider: 's3plist',
        account: [this.baseOptions.endpoint, this.accessKeyId],
        normalizeKey: true,
        multipart: { minPartSize: 5 * MIB, maxParts: 10000 },
      },
      async (
        { bucketName, region, key, filePath, fileName, fileSize, aclForUpload },
        { signal, slots, partSize, progress },
      ) => {
        await this.getDogeCloudToken(signal)
        signal.throwIfAborted()
        const handler = this.baseOptions.requestHandler as NodeHttpHandler
        // Abort HTTP requests, but let lib-storage drain all workers and abort the multipart upload.
        // Upload.abort() races done() and can return before those workers have stopped.
        const client = this.createS3Client({
          ...this.baseOptions,
          region: String(region || this.baseOptions.region || 'us-east-1'),
          requestHandler: {
            handle: (...[request, options]: Parameters<NodeHttpHandler['handle']>) =>
              handler.handle(request, {
                ...options,
                requestTimeout: 60000,
                abortSignal: request.method === 'DELETE' ? options?.abortSignal : signal,
              }),
            updateHttpClientConfig: (key, value) => handler.updateHttpClientConfig(key, value),
            httpHandlerConfigs: () => handler.httpHandlerConfigs(),
          },
        })
        const allowedAcl = [
          'private',
          'public-read',
          'public-read-write',
          'aws-exec-read',
          'authenticated-read',
          'bucket-owner-read',
          'bucket-owner-full-control',
        ]
        await withUploadStream(filePath, signal, async source => {
          const transfer = new Upload({
            client,
            queueSize: slots,
            partSize,
            leavePartsOnError: false,
            params: {
              Bucket: bucketName,
              Key: key,
              Body: source,
              ContentLength: fileSize,
              ContentType: getFileMimeType(fileName),
              ...(allowedAcl.includes(aclForUpload) ? { ACL: aclForUpload } : {}),
              Metadata: { description: 'uploaded by PicList' },
            },
          })
          transfer.on('httpUploadProgress', (event: Progress) =>
            progress(event.total ? ((event.loaded || 0) / event.total) * 100 : 0),
          )
          const result = await transfer.done()
          if (result.$metadata.httpStatusCode !== 200) throw new TransferError('provider')
        })
      },
    )
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile(configMap: IStringKeyMap): Promise<boolean> {
    return scheduleHttpDownloads(configMap, this.logger, async (item, signal) => {
      const url = await this.getPreSignedUrl({ ...item, expires: 36000 }, signal)
      const sessionToken =
        this.dogeCloudSupport && url !== 'error' ? new URL(url).searchParams.get('X-Amz-Security-Token') : null
      return {
        url,
        agent: this.proxyAgents,
        onError: error => {
          if (sessionToken && isDogecloudAuthenticationError(error))
            invalidateDogecloudTokens(this.accessKeyId, this.secretAccessKey, { sessionToken })
        },
      }
    })
  }
}

export default S3plistApi
