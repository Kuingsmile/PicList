// AWS S3 相关
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetBucketLocationCommand,
  _Object,
  CommonPrefix,
  ListObjectsV2CommandOutput,
  CopyObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3ClientConfig
} from '@aws-sdk/client-s3'

// AWS S3 上传和进度
import { Upload, Progress } from '@aws-sdk/lib-storage'

// AWS S3 请求签名
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// HTTP 和 HTTPS 模块
import https from 'https'
import http, { AgentOptions } from 'http'
import { NodeHttpHandler } from '@smithy/node-http-handler'

// 日志记录器
import { ManageLogger } from '../utils/logger'

// 端点地址格式化函数、错误格式化函数、获取请求代理、获取文件 MIME 类型、新的下载器、并发异步任务池
import { formatEndpoint, formatError, getAgent, getFileMimeType, NewDownloader, ConcurrencyPromisePool } from '../utils/common'

// 是否为图片的判断函数、HTTP 代理格式化函数
import { isImage, formatHttpProxy } from '@/manage/utils/common'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// 上传下载任务队列
import UpDownTaskQueue, { uploadTaskSpecialStatus, commonTaskStatus } from '../datastore/upDownTaskQueue'

// 文件系统库
import fs from 'fs-extra'

// 路径处理库
import path from 'path'

// 取消下载任务的加载文件列表、刷新下载文件传输列表
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'

// dogecloudApi
import { dogecloudApi, DogecloudToken, getTempToken } from '../utils/dogeAPI'

class S3plistApi {
  baseOptions: S3ClientConfig
  logger: ManageLogger
  agent: any
  proxy: string | undefined
  dogeCloudSupport: boolean
  accessKeyId: string
  secretAccessKey: string
  bucketName: string

  constructor (
    accessKeyId: string,
    secretAccessKey: string,
    endpoint: string | undefined,
    sslEnabled: boolean,
    s3ForcePathStyle: boolean,
    proxy: string | undefined,
    logger: ManageLogger,
    dogeCloudSupport: boolean = false,
    bucketName: string = ''
  ) {
    this.accessKeyId = accessKeyId
    this.secretAccessKey = secretAccessKey
    this.dogeCloudSupport = dogeCloudSupport
    this.bucketName = bucketName
    this.baseOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      endpoint: endpoint ? formatEndpoint(endpoint, sslEnabled) : undefined,
      tls: sslEnabled,
      forcePathStyle: s3ForcePathStyle,
      requestHandler: this.setAgent(proxy, sslEnabled)
    }
    this.logger = logger
    this.proxy = formatHttpProxy(proxy, 'string') as string | undefined
  }

  async getDogeCloudToken () {
    if (!this.dogeCloudSupport) return
    const token = await getTempToken(this.accessKeyId, this.secretAccessKey) as DogecloudToken
    if (Object.keys(token).length === 0) {
      throw new Error('manage.setting.dogeCloudTokenError')
    }
    this.baseOptions.credentials = {
      accessKeyId: token.accessKeyId,
      secretAccessKey: token.secretAccessKey,
      sessionToken: token.sessionToken
    }
  }

  setAgent (proxy: string | undefined, sslEnabled: boolean) : NodeHttpHandler {
    const agent = getAgent(proxy, sslEnabled)
    const commonOptions: AgentOptions = {
      keepAlive: true,
      keepAliveMsecs: 1000,
      scheduling: 'lifo' as 'lifo' | 'fifo' | undefined
    }
    const extraOptions = sslEnabled ? { rejectUnauthorized: false } : {}
    return sslEnabled
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
  }

  logParam = (error:any, method: string) =>
    this.logger.error(formatError(error, { class: 'S3plistApi', method }))

  formatFolder (item: CommonPrefix, slicedPrefix: string): any {
    return {
      Key: item.Prefix,
      fileSize: 0,
      formatedTime: '',
      fileName: item.Prefix?.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      key: item.Prefix
    }
  }

  formatFile (item: _Object, slicedPrefix: string, urlPrefix: string): any {
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
      isImage: isImage(fileName || '')
    }
  }

  /**
     * 获取存储桶列表
    */
  async getBucketList (): Promise<any> {
    if (this.dogeCloudSupport) {
      try {
        const res = await dogecloudApi('/oss/bucket/list.json', {}, false, this.accessKeyId, this.secretAccessKey)
        for (const item of res.buckets) {
          if (item.name === this.bucketName || item.s3Bucket === this.bucketName) {
            return [
              {
                Name: item.s3Bucket,
                CreationDate: item.ctime,
                Location: item.region
              }
            ]
          }
        }
        return []
      } catch (error) {
        this.logParam(error, 'getBucketList')
      }
      return []
    }
    const options = Object.assign({}, this.baseOptions) as S3ClientConfig
    const result: IStringKeyMap[] = []
    const endpoint = options.endpoint as string || ''
    options.region = endpoint.includes('cloudflarestorage') ? 'auto' : 'us-east-1'
    try {
      const client = new S3Client(options)
      const data = await client.send(new ListBucketsCommand({}))

      if (data.$metadata.httpStatusCode !== 200) {
        this.logParam(data, 'getBucketList')
        return result
      }

      if (data.Buckets) {
        if (endpoint.includes('cloudflarestorage')) {
          result.push(...data.Buckets.map(bucket => ({
            Name: bucket.Name,
            CreationDate: bucket.CreationDate,
            Location: 'auto'
          })))
        } else {
          for (const bucket of data.Buckets) {
            const bucketName = bucket.Name
            const bucketConfig = await client.send(new GetBucketLocationCommand({
              Bucket: bucketName
            }))
            result.push({
              Name: bucketName,
              CreationDate: bucket.CreationDate,
              Location: bucketConfig.$metadata.httpStatusCode === 200
                ? bucketConfig.LocationConstraint?.toLowerCase() || 'us-east-1'
                : 'us-east-1'
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

  async getBucketListRecursively (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, cancelToken } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.s3.amazonaws.com`
    let marker
    const cancelTask = [false]
    ipcMain.on(cancelDownloadLoadingFileList, (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
      }
    })
    let res = {} as ListObjectsV2CommandOutput
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    try {
      do {
        const options = Object.assign({}, this.baseOptions) as S3ClientConfig
        options.region = String(region) || 'us-east-1'
        const client = new S3Client(options)
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          MaxKeys: 1000,
          ContinuationToken: marker
        })
        res = await client.send(command)
        if (res.$metadata.httpStatusCode === 200) {
          res.Contents && res.Contents.forEach((item: _Object) => {
            result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          })
          window.webContents.send(refreshDownloadFileTransferList, result)
        } else {
          this.logParam(res, 'getBucketListRecursively')
          result.finished = true
          window.webContents.send(refreshDownloadFileTransferList, result)
          ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
          return
        }
        marker = res.NextContinuationToken
      } while (res.IsTruncated && !cancelTask[0])
    } catch (error) {
      this.logParam(error, 'getBucketListRecursively')
      result.finished = true
      window.webContents.send(refreshDownloadFileTransferList, result)
      ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
      return
    }
    result.success = !cancelTask[0]
    result.finished = true
    window.webContents.send(refreshDownloadFileTransferList, result)
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, cancelToken } = configMap
    await this.getDogeCloudToken()
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.s3.amazonaws.com`
    let marker
    const cancelTask = [false]
    ipcMain.on('cancelLoadingFileList', (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners('cancelLoadingFileList')
      }
    })
    let res = {} as ListObjectsV2CommandOutput
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    try {
      do {
        const options = Object.assign({}, this.baseOptions) as S3ClientConfig
        options.region = String(region) || 'us-east-1'
        const client = new S3Client(options)
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          MaxKeys: 1000,
          ContinuationToken: marker,
          Delimiter: '/'
        })
        res = await client.send(command)
        if (res.$metadata.httpStatusCode === 200) {
          res.CommonPrefixes && res.CommonPrefixes.forEach((item: CommonPrefix) => {
            result.fullList.push(this.formatFolder(item, slicedPrefix))
          })
          res.Contents && res.Contents.forEach((item: _Object) => {
            result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
          })
          window.webContents.send('refreshFileTransferList', result)
        } else {
          this.logParam(res, 'getBucketListBackstage')
          result.finished = true
          window.webContents.send('refreshFileTransferList', result)
          ipcMain.removeAllListeners('cancelLoadingFileList')
          return
        }
        marker = res.NextContinuationToken
      } while (res.IsTruncated && !cancelTask[0])
    } catch (error) {
      this.logParam(error, 'getBucketListBackstage')
      result.finished = true
      window.webContents.send('refreshFileTransferList', result)
      ipcMain.removeAllListeners('cancelLoadingFileList')
      return
    }
    result.success = !cancelTask[0]
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
  }

  async getBucketFileList (configMap: IStringKeyMap): Promise<any> {
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, marker, itemsPerPage } = configMap
    await this.getDogeCloudToken()
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.s3.amazonaws.com`
    const result = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    try {
      const options = Object.assign({}, { ...this.baseOptions, region: String(region) || 'us-east-1' }) as S3ClientConfig
      const client = new S3Client(options)
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: slicedPrefix,
        ContinuationToken: marker === '' ? undefined : marker,
        Delimiter: '/',
        MaxKeys: itemsPerPage
      })
      const data = await client.send(command)
      if (data.$metadata.httpStatusCode === 200) {
        result.fullList = [
          ...(data.CommonPrefixes?.map(item => this.formatFolder(item, slicedPrefix)) || []),
          ...(data.Contents?.map(item => this.formatFile(item, slicedPrefix, urlPrefix)) || [])
        ]
        result.isTruncated = data.IsTruncated || false
        result.nextMarker = data.NextContinuationToken || ''
        result.success = true
      }
    } catch (error) {
      this.logParam(error, 'getBucketFileList')
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
  async renameBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, oldKey, newKey } = configMap
    await this.getDogeCloudToken()
    let result = false
    try {
      const options = Object.assign({}, { ...this.baseOptions, region: String(region) || 'us-east-1' }) as S3ClientConfig
      const client = new S3Client(options)
      const command = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: encodeURI(`${bucketName}/${oldKey}`),
        Key: newKey
      })
      const data = await client.send(command)
      if (data.$metadata.httpStatusCode === 200) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: oldKey
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
  async deleteBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    await this.getDogeCloudToken()
    let result = false
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = String(region) || 'us-east-1'
      const client = new S3Client(options)
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
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
  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    await this.getDogeCloudToken()
    let marker
    let result = false
    let IsTruncated
    let res
    const allFileList = {
      CommonPrefixes: [] as any[],
      Contents: [] as any[]
    }
    try {
      do {
        const options = Object.assign({}, this.baseOptions) as S3ClientConfig
        options.region = String(region) || 'us-east-1'
        const client = new S3Client(options)
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: key,
          ContinuationToken: marker === '' ? undefined : marker,
          Delimiter: '/',
          MaxKeys: 1000
        })
        res = await client.send(command) as ListObjectsV2CommandOutput
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
            key: item.Prefix
          })
          if (!res) {
            return result
          }
        }
      }
      if (allFileList.Contents.length > 0) {
        const cycle = Math.ceil(allFileList.Contents.length / 1000)
        const options = Object.assign({}, this.baseOptions) as S3ClientConfig
        options.region = String(region) || 'us-east-1'
        const client = new S3Client(options)
        for (let i = 0; i < cycle; i++) {
          const deleteList = allFileList.Contents.slice(i * 1000, (i + 1) * 1000)
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: deleteList.map((item) => {
                return {
                  Key: item.Key
                }
              })
            }
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
  async getPreSignedUrl (configMap: IStringKeyMap): Promise<string> {
    const { bucketName, region, key, expires } = configMap
    await this.getDogeCloudToken()
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = String(region) || 'us-east-1'
      const client = new S3Client(options)
      const signedUrl = await getSignedUrl(client, new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      }), {
        expiresIn: expires || 3600
      })
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
  async createBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    await this.getDogeCloudToken()
    let result = false
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = String(region) || 'us-east-1'
      const client = new S3Client(options)
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key
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
  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    // fileArray = [{
    //   bucketName: string,
    //   region: string,
    //   key: string,
    //   filePath: string
    //   fileSize: number
    // }]
    const instance = UpDownTaskQueue.getInstance()
    fileArray.forEach((item: any) => {
      item.key.startsWith('/') && (item.key = item.key.slice(1))
    })
    const allowedAcl = ['private', 'public-read', 'public-read-write', 'aws-exec-read', 'authenticated-read', 'bucket-owner-read', 'bucket-owner-full-control']
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName, aclForUpload } = item
      await this.getDogeCloudToken()
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = String(region) || 'us-east-1'
      const client = new S3Client(options)
      const id = `${bucketName}-${String(region)}-${key}-${filePath}`
      if (instance.getUploadTask(id)) {
        continue
      }
      const fileStream = fs.createReadStream(filePath)
      instance.addUploadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: String(region)
      })
      const parallelUploads3 = new Upload({
        client,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: fileStream,
          ContentType: getFileMimeType(fileName),
          ACL: allowedAcl.includes(aclForUpload) ? aclForUpload : 'private',
          Metadata: {
            description: 'uploaded by PicList'
          }
        }
      })
      parallelUploads3.on('httpUploadProgress', (progress: Progress) => {
        instance.updateUploadTask({
          id,
          progress: progress.loaded && progress.total ? Math.floor(progress.loaded / progress.total * 100) : 0,
          status: uploadTaskSpecialStatus.uploading
        })
      })
      parallelUploads3.done().then((data) => {
        if (data.$metadata.httpStatusCode === 200) {
          instance.updateUploadTask({
            id,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            finishTime: new Date().toLocaleString()
          })
        } else {
          instance.updateUploadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: new Date().toLocaleString()
          })
        }
      }).catch((error) => {
        this.logParam(error, 'uploadBucketFile')
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          response: JSON.stringify(error),
          finishTime: new Date().toLocaleString()
        })
      })
    }
    return true
  }

  /**
   * 下载文件
   * @param configMap
   */
  async downloadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { downloadPath, fileArray, maxDownloadFileCount } = configMap
    const instance = UpDownTaskQueue.getInstance()
    const promises = [] as any
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item
      const savedFilePath = path.join(downloadPath, fileName)
      const id = `${bucketName}-${String(region)}-${key}-${savedFilePath}`
      if (instance.getDownloadTask(id)) {
        continue
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: savedFilePath
      })
      const preSignedUrl = await this.getPreSignedUrl({
        bucketName,
        region: String(region),
        key,
        expires: 36000,
        customUrl
      })
      promises.push(() => new Promise((resolve, reject) => {
        NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger, this.proxy)
          .then((res: boolean) => {
            if (res) {
              resolve(res)
            } else {
              reject(res)
            }
          })
      }))
    }
    const pool = new ConcurrencyPromisePool(maxDownloadFileCount)
    pool.all(promises).catch((error) => {
      this.logParam(error, 'downloadBucketFile')
    })
    return true
  }
}

export default S3plistApi
