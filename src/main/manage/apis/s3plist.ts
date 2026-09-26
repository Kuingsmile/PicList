import http, { AgentOptions } from 'node:http'
import https from 'node:https'

import {
  _Object,
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
import { dogecloudApi, DogecloudToken, getTempToken } from '~/manage/utils/dogeAPI'
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
      endpoint: endpoint ? formatEndpoint(endpoint, sslEnabled) : undefined,
      region: this.region || (endpoint?.includes('cloudflarestorage') ? 'auto' : 'us-east-1'),
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

  logParam = (error: any, method: string) => this.logger.error(formatError(error, { class: 'S3plistApi', method }))

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
    if (data.$metadata.httpStatusCode !== 200) {
      this.logParam(data, 'putPublicAccess')
      throw new Error('manage.setting.putPublicAccessError')
    }
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
  async createBucket(configMap: IStringKeyMap): Promise<boolean> {
    const { BucketName, region, acl, endpoint } = configMap
    try {
      await this.getDogeCloudToken()
      const options = { ...this.baseOptions } as S3ClientConfig
      options.region = String(region || this.baseOptions.region || 'us-east-1')
      const client = new S3Client(options)
      const command = new ListBucketsCommand({})
      const data = await client.send(command)
      if (data.$metadata.httpStatusCode === 200) {
        const bucketList = data.Buckets?.map(item => item.Name)
        if (bucketList?.includes(BucketName)) {
          return true
        }
      }
      if (endpoint === '' || endpoint.includes('amazonaws')) {
        const createCommand = new CreateBucketCommand({
          Bucket: BucketName,
          ObjectOwnership: 'BucketOwnerPreferred',
        })
        const createData = await client.send(createCommand)
        if (createData.$metadata.httpStatusCode === 200) {
          if (acl !== 'private') {
            await this.putPublicAccess(BucketName, client)
            const putACLCommand = new PutBucketAclCommand({
              Bucket: BucketName,
              ACL: acl,
            })
            const putACLData = await client.send(putACLCommand)
            if (putACLData.$metadata.httpStatusCode !== 200) {
              this.logParam(putACLData, 'createBucket')
              return false
            }
          }
          return true
        } else {
          this.logParam(createData, 'createBucket')
        }
      } else {
        const createCommand = new CreateBucketCommand({
          Bucket: BucketName,
          ACL: acl,
        })
        const createData = await client.send(createCommand)
        if (createData.$metadata.httpStatusCode === 200) {
          return true
        } else {
          this.logParam(createData, 'createBucket')
        }
      }
    } catch (error) {
      this.logParam(error, 'createBucket')
    }
    return false
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
      const client = new S3Client(options)
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
        const client = new S3Client(options)
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
        const client = new S3Client(options)
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
      const client = new S3Client(options)
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
      const client = new S3Client(options)
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
      const client = new S3Client(options)
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
  async deleteBucketFolder(configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    let marker
    let result = false
    let IsTruncated
    let res
    const allFileList = {
      CommonPrefixes: [] as any[],
      Contents: [] as any[],
    }
    try {
      await this.getDogeCloudToken()
      do {
        const options = { ...this.baseOptions } as S3ClientConfig
        options.region = String(region || this.baseOptions.region || 'us-east-1')
        const client = new S3Client(options)
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: key,
          ContinuationToken: marker === '' ? undefined : marker,
          Delimiter: '/',
          MaxKeys: 1000,
        })
        res = (await client.send(command)) as ListObjectsV2CommandOutput
        if (res.$metadata.httpStatusCode === 200) {
          res.CommonPrefixes && allFileList.CommonPrefixes.push(...res.CommonPrefixes)
          res.Contents && allFileList.Contents.push(...res.Contents)
          IsTruncated = res.IsTruncated || false
          marker = res.NextContinuationToken || ''
        } else {
          this.logParam(res, 'deleteBucketFolder')
          return result
        }
      } while (IsTruncated)
      if (allFileList.CommonPrefixes.length > 0) {
        for (const item of allFileList.CommonPrefixes) {
          res = await this.deleteBucketFolder({
            bucketName,
            region,
            key: item.Prefix,
          })
          if (!res) {
            return result
          }
        }
      }
      if (allFileList.Contents.length > 0) {
        const cycle = Math.ceil(allFileList.Contents.length / 1000)
        const options = { ...this.baseOptions } as S3ClientConfig
        options.region = String(region || this.baseOptions.region || 'us-east-1')
        const client = new S3Client(options)
        for (let i = 0; i < cycle; i++) {
          const deleteList = allFileList.Contents.slice(i * 1000, (i + 1) * 1000)
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: deleteList.map(item => {
                return {
                  Key: item.Key,
                }
              }),
            },
          })
          res = await client.send(deleteCommand)
          if (res.$metadata.httpStatusCode !== 200) {
            this.logParam(res, 'deleteBucketFolder')
            return result
          }
        }
      }
      result = true
      return result
    } catch (error) {
      this.logParam(error, 'deleteBucketFolder')
      return result
    }
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
      const client = new S3Client(options)
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
      const client = new S3Client(options)
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
        const client = new S3Client({
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
      const preSignedUrl = await this.getPreSignedUrl({
        bucketName,
        region: String(region),
        key,
        expires: 36000,
        customUrl,
      })
      promises.push(
        () =>
          new Promise((resolve, reject) => {
            NewDownloader(instance, preSignedUrl, id, destination, this.logger, this.proxy).then((res: boolean) => {
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
