import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetBucketLocationCommand,
  S3ClientConfig,
  _Object,
  CommonPrefix,
  ListObjectsV2CommandOutput,
  CopyObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import { Upload, Progress } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import https from 'https'
import http from 'http'
import { ManageLogger } from '../utils/logger'
import { formatError, getAgent, getFileMimeType, gotDownload } from '../utils/common'
import { isImage } from '@/manage/utils/common'
import { HttpsProxyAgent, HttpProxyAgent } from 'hpagent'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { ipcMain, IpcMainEvent } from 'electron'
import UpDownTaskQueue,
{
  uploadTaskSpecialStatus,
  commonTaskStatus
} from '../datastore/upDownTaskQueue'
import fs from 'fs-extra'
import path from 'path'

interface S3plistApiOptions {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  endpoint?: string
  sslEnabled: boolean
  s3ForcePathStyle: boolean
  httpOptions?: {
    agent: https.Agent
  }
}

class S3plistApi {
  baseOptions: S3plistApiOptions
  logger: ManageLogger
  agent: any

  constructor (
    accessKeyId: string,
    secretAccessKey: string,
    endpoint: string | undefined,
    sslEnabled: boolean,
    s3ForcePathStyle: boolean,
    proxy: string | undefined,
    logger: ManageLogger
  ) {
    this.baseOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      endpoint: endpoint ? this.formatEndpoint(endpoint, sslEnabled) : undefined,
      sslEnabled,
      s3ForcePathStyle,
      httpOptions: {
        agent: this.setAgent(proxy, sslEnabled)
      }
    } as S3plistApiOptions
    this.logger = logger
    this.agent = this.setAgent(proxy, sslEnabled)
  }

  formatEndpoint = (endpoint: string, sslEnabled: boolean): string =>
    !/^https?:\/\//.test(endpoint) ? `${sslEnabled ? 'https' : 'http'}://${endpoint}` : endpoint

  setAgent (proxy: string | undefined, sslEnabled: boolean) : HttpProxyAgent | HttpsProxyAgent | undefined {
    if (sslEnabled) {
      const agent = getAgent(proxy, true).https
      return agent ?? new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false
      })
    } else {
      const agent = getAgent(proxy, false).http
      return agent ?? new http.Agent({
        keepAlive: true
      })
    }
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
    return {
      ...item,
      key: item.Key,
      url: `${urlPrefix}/${item.Key}`,
      fileName: item.Key?.replace(slicedPrefix, ''),
      fileSize: item.Size,
      formatedTime: new Date(item.LastModified!).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(item.Key?.replace(slicedPrefix, '') || '')
    }
  }

  /**
     * 获取存储桶列表
    */
  async getBucketList (): Promise<any> {
    const options = Object.assign({}, this.baseOptions) as S3ClientConfig
    options.region = 'us-east-1'
    const result = [] as IStringKeyMap[]
    try {
      const client = new S3Client(options)
      const command = new ListBucketsCommand({})
      const data = await client.send(command)
      if (data.$metadata.httpStatusCode === 200) {
        if (data.Buckets) {
          for (let i = 0; i < data.Buckets.length; i++) {
            const bucket = data.Buckets[i]
            const bucketName = bucket.Name
            const command = new GetBucketLocationCommand({
              Bucket: bucketName
            })
            const bucketConfig = await client.send(command)
            if (bucketConfig.$metadata.httpStatusCode === 200) {
              result.push({
                Name: bucketName,
                CreationDate: bucket.CreationDate,
                Location: bucketConfig.LocationConstraint || 'us-east-1'
              })
            } else {
              this.logParam(bucketConfig, 'getBucketList')
              result.push({
                Name: bucketName,
                CreationDate: bucket.CreationDate,
                Location: 'us-east-1'
              })
            }
          }
        }
      } else {
        this.logParam(data, 'getBucketList')
      }
    } catch (error) {
      this.logParam(error, 'getBucketList')
    }
    return result
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, cancelToken } = configMap
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
        options.region = region || 'us-east-1'
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
          this.logParam(res, 'getBucketFileList')
          result.finished = true
          window.webContents.send('refreshFileTransferList', result)
          ipcMain.removeAllListeners('cancelLoadingFileList')
          return
        }
        marker = res.NextContinuationToken
      } while (res.IsTruncated && !cancelTask[0])
    } catch (error) {
      this.logParam(error, 'getBucketFileList')
      result.finished = true
      window.webContents.send('refreshFileTransferList', result)
      ipcMain.removeAllListeners('cancelLoadingFileList')
    }
    result.success = true
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
  }

  async getBucketFileList (configMap: IStringKeyMap): Promise<any> {
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, marker, itemsPerPage } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.s3.amazonaws.com`
    const result = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = region || 'us-east-1'
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
        data.CommonPrefixes && data.CommonPrefixes.forEach((item: CommonPrefix) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix))
        })
        data.Contents && data.Contents.forEach((item: _Object) => {
          result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
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
    let result = false
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = region || 'us-east-1'
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
    let result = false
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = region || 'us-east-1'
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
        options.region = region || 'us-east-1'
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
        options.region = region || 'us-east-1'
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
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = region || 'us-east-1'
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
    let result = false
    try {
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = region || 'us-east-1'
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
      const options = Object.assign({}, this.baseOptions) as S3ClientConfig
      options.region = region || 'us-east-1'
      const client = new S3Client(options)
      const id = `${bucketName}-${region}-${key}-${filePath}`
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
        targetFileRegion: region
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
    const { downloadPath, fileArray } = configMap
    // fileArray = [{
    //   bucketName: string,
    //   region: string,
    //   key: string,
    //  fileName: string
    // }]
    const instance = UpDownTaskQueue.getInstance()
    for (const item of fileArray) {
      const { bucketName, region, key, fileName, customUrl } = item
      const savedFilePath = path.join(downloadPath, fileName)
      const fileStream = fs.createWriteStream(savedFilePath)
      const id = `${bucketName}-${region}-${key}-${savedFilePath}`
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
        region,
        key,
        expires: 36000,
        customUrl
      })
      gotDownload(instance, preSignedUrl, fileStream, id, savedFilePath, this.logger)
    }
    return true
  }
}

export default S3plistApi
