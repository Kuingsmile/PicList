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
import UpDownTaskQueue from '~/manage/datastore/upDownTaskQueue'
import type { ListingContext } from '~/manage/listingRequest'
import { TransferError } from '~/manage/transferScheduler'
import {
  ConcurrencyPromisePool,
  createDownloadTask,
  formatError,
  getAgent,
  getFileMimeType,
  NewDownloader,
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
import { ManageLogger } from '~/manage/utils/logger'
import { MIB, scheduleUploadBatch, withUploadStream } from '~/manage/utils/uploadFile'
import { formatEndpoint, formatHttpProxy, isImage } from '~/utils/common'

class S3plistApi {
  baseOptions: S3ClientConfig
  logger: ManageLogger
  agent: any
  proxy: string | undefined
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
      requestHandler: this.setAgent(proxy, sslEnabled),
    }
    this.logger = logger
    this.proxy = formatHttpProxy(proxy, 'string') as string | undefined
  }

  async getDogeCloudToken() {
    if (!this.dogeCloudSupport) return
    const token = (await getTempToken(this.accessKeyId, this.secretAccessKey)) as DogecloudToken
    if (Object.keys(token).length === 0) {
      throw new Error('manage.setting.dogeCloudTokenError')
    }
    this.baseOptions.credentials = {
      accessKeyId: token.accessKeyId,
      secretAccessKey: token.secretAccessKey,
      sessionToken: token.sessionToken,
    }
  }

  private createS3Client(options: S3ClientConfig): S3Client {
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
    return client
  }

  setAgent(proxy: string | undefined, sslEnabled: boolean): NodeHttpHandler {
    const agent = getAgent(proxy, sslEnabled)
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
      url: `${urlPrefix}/${item.Prefix}`,
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
      url: `${urlPrefix}/${item.Key}`,
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

  /**
   * 获取存储桶列表
   */
  async getBucketList(): Promise<any> {
    if (this.dogeCloudSupport) {
      try {
        const res = await dogecloudApi('/oss/bucket/list.json', {}, false, this.accessKeyId, this.secretAccessKey)
        for (const item of res.buckets) {
          if (item.name === this.bucketName || item.s3Bucket === this.bucketName) {
            return [
              {
                Name: item.s3Bucket,
                CreationDate: item.ctime,
                Location: item.region,
              },
            ]
          }
        }
        return []
      } catch (error) {
        this.logParam(error, 'getBucketList')
      }
      return []
    }
    const options = { ...this.baseOptions } as S3ClientConfig
    const result: IStringKeyMap[] = []
    const endpoint = (options.endpoint as string) || ''
    try {
      const client = this.createS3Client(options)
      const data = await client.send(new ListBucketsCommand({}))

      if (data.$metadata.httpStatusCode !== 200) {
        this.logParam(data, 'getBucketList')
        return result
      }

      if (data.Buckets) {
        if (this.region || endpoint.includes('cloudflarestorage')) {
          result.push(
            ...data.Buckets.map(bucket => ({
              Name: bucket.Name,
              CreationDate: bucket.CreationDate,
              Location: this.region || 'auto',
            })),
          )
        } else {
          for (const bucket of data.Buckets) {
            const bucketName = bucket.Name
            const bucketConfig = await client.send(
              new GetBucketLocationCommand({
                Bucket: bucketName,
              }),
            )
            result.push({
              Name: bucketName,
              CreationDate: bucket.CreationDate,
              Location:
                bucketConfig.$metadata.httpStatusCode === 200
                  ? bucketConfig.LocationConstraint?.toLowerCase() || 'us-east-1'
                  : 'us-east-1',
            })
            if (bucketConfig.$metadata.httpStatusCode !== 200) {
              this.logParam(bucketConfig, 'getBucketList')
            }
          }
        }
      }
    } catch (error) {
      this.logParam(error, 'getBucketList')
    }
    return result
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
      await listing.wait(() => this.getDogeCloudToken())
      do {
        const options = { ...this.baseOptions } as S3ClientConfig
        options.region = String(region || this.baseOptions.region || 'us-east-1')
        const client = this.createS3Client(options)
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          MaxKeys: 1000,
          ContinuationToken: marker,
        })
        res = await listing.wait(() => client.send(command, { abortSignal: listing.signal }))
        if (res.$metadata.httpStatusCode === 200) {
          res.Contents &&
            res.Contents.forEach((item: _Object) => {
              result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
            })
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
      await listing.wait(() => this.getDogeCloudToken())
      do {
        const options = { ...this.baseOptions } as S3ClientConfig
        options.region = String(region || this.baseOptions.region || 'us-east-1')
        const client = this.createS3Client(options)
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
      await listing.wait(() => this.getDogeCloudToken())
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
        CopySource: encodeURI(`${bucketName}/${oldKey}`),
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
  async getPreSignedUrl(configMap: IStringKeyMap): Promise<string> {
    const { bucketName, region, key, expires } = configMap
    try {
      await this.getDogeCloudToken()
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
      this.logParam(error, 'getPreSignedUrl')
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
        await this.getDogeCloudToken()
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
              ACL: allowedAcl.includes(aclForUpload) ? aclForUpload : 'private',
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
    const { downloadPath, fileArray, maxDownloadFileCount, downloadConflictPolicy = 'rename' } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const promises = [] as any
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item
      const id = `${bucketName}-${String(region)}-${key}-${downloadPath}-${fileName}`
      const destination = createDownloadTask(instance, id, downloadPath, fileName, downloadConflictPolicy, this.logger)
      if (!destination) continue
      const accessKey = this.accessKeyId
      const secretKey = this.secretAccessKey
      const preSignedUrl = await this.getPreSignedUrl({
        bucketName,
        region: String(region),
        key,
        expires: 36000,
        customUrl,
      })
      // Bind failures to the token actually used to sign this URL, even if the cache refreshes while downloading.
      const sessionToken =
        this.dogeCloudSupport && preSignedUrl !== 'error'
          ? new URL(preSignedUrl).searchParams.get('X-Amz-Security-Token')
          : null
      promises.push(
        () =>
          new Promise((resolve, reject) => {
            NewDownloader(instance, preSignedUrl, id, destination, this.logger, this.proxy, undefined, error => {
              if (sessionToken && isDogecloudAuthenticationError(error)) {
                invalidateDogecloudTokens(accessKey, secretKey, { sessionToken })
              }
            }).then((res: boolean) => {
              if (res) {
                resolve(res)
              } else {
                reject(res)
              }
            })
          }),
      )
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount)
    pool.all(promises).catch(error => {
      this.logParam(error, 'downloadBucketFile')
    })
    return true
  }
}

export default S3plistApi
