import COS from 'cos-nodejs-sdk-v5'
import fs from 'fs-extra'
import path from 'path'
import { isImage } from '~/renderer/manage/utils/common'
import { handleUrlEncode } from '~/universal/utils/common'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { ipcMain, IpcMainEvent } from 'electron'
import { formatError, getFileMimeType } from '../utils/common'
import UpDownTaskQueue,
{
  uploadTaskSpecialStatus,
  commonTaskStatus,
  downloadTaskSpecialStatus
} from '../datastore/upDownTaskQueue'
import { ManageLogger } from '../utils/logger'

class TcyunApi {
  ctx: COS
  logger: ManageLogger

  constructor (secretId: string, secretKey: string, logger: ManageLogger) {
    this.ctx = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    })
    this.logger = logger
  }

  formatFolder (item: {Prefix: string}, slicedPrefix: string): any {
    return {
      ...item,
      key: item.Prefix,
      fileSize: 0,
      formatedTime: '',
      fileName: item.Prefix.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false
    }
  }

  formatFile (item: COS.CosObject, slicedPrefix: string, urlPrefix: string): any {
    return {
      ...item,
      key: item.Key,
      fileName: item.Key.replace(slicedPrefix, ''),
      fileSize: parseInt(item.Size),
      formatedTime: new Date(item.LastModified).toLocaleString(),
      isDir: false,
      checked: false,
      isImage: isImage(item.Key),
      match: false,
      url: `${urlPrefix}/${item.Key}`
    }
  }

  /**
   * 获取存储桶列表
  */
  async getBucketList (): Promise<any> {
    const res = await this.ctx.getService({})
    return res && res.Buckets ? res.Buckets : []
  }

  /**
   * 获取自定义域名
   */
  async getBucketDomain (param: IStringKeyMap): Promise<any> {
    const { bucketName, region } = param
    const res = await this.ctx.getBucketDomain({
      Bucket: bucketName,
      Region: region
    })
    const result = [] as string[]
    if (res && res.statusCode === 200) {
      if (res.DomainRule && res.DomainRule.length > 0) {
        res.DomainRule.forEach((item: any) => {
          if (item.Status === 'ENABLED') {
            result.push(item.Name)
          }
        })
        return result
      } else {
        return []
      }
    } else {
      return []
    }
  }

  /**
   * 创建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: string
   * }
   * @description
   * acl: private | publicRead | publicReadWrite
  */
  async createBucket (configMap: IStringKeyMap): Promise < boolean > {
    const aclTransMap: IStringKeyMap = {
      private: 'private',
      publicRead: 'public-read',
      publicReadWrite: 'public-read-write'
    }
    const res = await this.ctx.putBucket({
      ACL: aclTransMap[configMap.acl],
      Bucket: configMap.BucketName,
      Region: configMap.region
    })
    return res && res.statusCode === 200
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise < any > {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const bucket = configMap.bucketName
    const region = configMap.bucketConfig.Location
    const prefix = configMap.prefix as string
    const slicedPrefix = prefix.slice(1, prefix.length)
    const urlPrefix = configMap.customUrl || `https://${bucket}.cos.${region}.myqcloud.com`
    let marker
    const cancelToken = configMap.cancelToken as string
    const cancelTask = [false]
    ipcMain.on('cancelLoadingFileList', (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners('cancelLoadingFileList')
      }
    })
    let res = {} as COS.GetBucketResult
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    do {
      res = await this.ctx.getBucket({
        Bucket: bucket,
        Region: region,
        Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
        Delimiter: '/',
        Marker: marker
      })
      if (res && res.statusCode === 200) {
        res.CommonPrefixes.forEach((item: { Prefix: string}) =>
          result.fullList.push(this.formatFolder(item, slicedPrefix)))
        res.Contents.forEach((item: COS.CosObject) =>
          parseInt(item.Size) !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix)))
        window.webContents.send('refreshFileTransferList', result)
      } else {
        result.finished = true
        window.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
      marker = res.NextMarker
    } while (res.IsTruncated === 'true' && !cancelTask[0])
    result.success = true
    result.finished = true
    window.webContents.send('refreshFileTransferList', result)
    ipcMain.removeAllListeners('cancelLoadingFileList')
  }

  /**
   * 获取文件列表
   * @param {Object} configMap
   * configMap = {
   *  bucketName: string,
   *  bucketConfig: {
   *   Location: string
   * },
   *  paging: boolean,
   *  prefix: string,
   *  marker: string,
   *  itemsPerPage: number,
   *  customUrl: string
   * }
  */
  async getBucketFileList (configMap: IStringKeyMap): Promise<any> {
    const bucket = configMap.bucketName
    const region = configMap.bucketConfig.Location
    const prefix = configMap.prefix as string
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.cos.${region}.myqcloud.com`
    const marker = configMap.marker as string
    const itemsPerPage = configMap.itemsPerPage as number
    let res = {} as COS.GetBucketResult
    const result = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    res = await this.ctx.getBucket({
      Bucket: bucket,
      Region: region,
      Prefix: slicedPrefix === '' ? undefined : slicedPrefix,
      Delimiter: '/',
      Marker: marker,
      MaxKeys: itemsPerPage
    })
    if (res && res.statusCode === 200) {
      res.CommonPrefixes.forEach((item: { Prefix: string}) =>
        result.fullList.push(this.formatFolder(item, slicedPrefix)))
      res.Contents.forEach((item: COS.CosObject) =>
        parseInt(item.Size) !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix)))
      result.isTruncated = res.IsTruncated === 'true'
      result.nextMarker = res.NextMarker || ''
      result.success = true
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
    const res = await this.ctx.putObjectCopy({
      Bucket: bucketName,
      Region: region,
      Key: newKey,
      CopySource: handleUrlEncode(`${bucketName}.cos.${region}.myqcloud.com/${oldKey}`)
    })
    if (res && res.statusCode === 200) {
      const res2 = await this.ctx.deleteObject({
        Bucket: bucketName,
        Region: region,
        Key: oldKey
      })
      return res2 && res2.statusCode === 204
    } else {
      return false
    }
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
    const res = await this.ctx.deleteObject({
      Bucket: bucketName,
      Region: region,
      Key: key
    })
    return res && res.statusCode === 204
  }

  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    let marker
    let isTruncated
    const allFileList = {
      CommonPrefixes: [] as any[],
      Contents: [] as any[]
    }
    let res = await this.ctx.getBucket({
      Bucket: bucketName,
      Region: region,
      Prefix: key,
      Delimiter: '/',
      MaxKeys: 1000
    })
    if (res && res.statusCode === 200) {
      res.CommonPrefixes.length > 0 && allFileList.CommonPrefixes.push(...res.CommonPrefixes)
      res.Contents.length > 0 && allFileList.Contents.push(...res.Contents)
      isTruncated = res.IsTruncated
      marker = res.NextMarker
      while (isTruncated === 'true') {
        res = await this.ctx.getBucket({
          Bucket: bucketName,
          Region: region,
          Prefix: key,
          Delimiter: '/',
          Marker: marker,
          MaxKeys: 1000
        }) as any
        if (res && res.statusCode === 200) {
          res.CommonPrefixes.length > 0 && allFileList.CommonPrefixes.push(...res.CommonPrefixes)
          res.Contents.length > 0 && allFileList.Contents.push(...res.Contents)
          isTruncated = res.IsTruncated
          marker = res.NextMarker
        } else {
          return false
        }
      }
    } else {
      return false
    }
    if (allFileList.CommonPrefixes.length > 0) {
      for (const item of allFileList.CommonPrefixes) {
        res = await this.deleteBucketFolder({
          bucketName,
          region,
          key: item.Prefix
        }) as any
        if (!res) {
          return false
        }
      }
    }
    if (allFileList.Contents.length > 0) {
      const cycle = Math.ceil(allFileList.Contents.length / 1000)
      for (let i = 0; i < cycle; i++) {
        res = await this.ctx.deleteMultipleObject({
          Bucket: bucketName,
          Region: region,
          Objects: allFileList.Contents.slice(i * 1000, (i + 1) * 1000).map((item: any) => {
            return {
              Key: item.Key
            }
          })
        }) as any
        if (!(res && res.statusCode === 200)) {
          return false
        }
      }
    }
    return true
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
    const { bucketName, region, key, expires, customUrl } = configMap
    const res = this.ctx.getObjectUrl({
      Bucket: bucketName,
      Region: region,
      Key: key,
      Expires: expires,
      Sign: true
    }, () => {
    })
    return customUrl ? `${customUrl.replace(/\/$/, '')}/${key}${res.slice(res.indexOf('?'))}` : res
  }

  /**
   * 高级上传文件
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
    const files = [] as any[]
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileSize, fileName } = item
      const id = `${bucketName}-${region}-${key}-${filePath}`
      if (instance.getUploadTask(id)) {
        continue
      }
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
      files.push({
        Bucket: bucketName,
        Region: region,
        Key: key,
        FilePath: filePath,
        ContentType: getFileMimeType(filePath),
        Body: fileSize > 1048576 ? fs.createReadStream(filePath) : undefined,
        onProgress: (progress: any) => {
          const cancelToken = ''
          instance.updateUploadTask({
            id,
            progress: Math.floor(progress.percent * 100),
            status: uploadTaskSpecialStatus.uploading,
            cancelToken
          })
        },
        onFileFinish: (err: any, data: any) => {
          if (data) {
            instance.updateUploadTask({
              id,
              progress: 100,
              status: uploadTaskSpecialStatus.uploaded,
              response: typeof data === 'object' ? JSON.stringify(data) : String(data),
              finishTime: new Date().toLocaleString()
            })
          } else {
            this.logger.error(formatError(err, { method: 'uploadBucketFile', class: 'TcyunApi' }))
            instance.updateUploadTask({
              id,
              progress: 0,
              status: commonTaskStatus.failed,
              response: typeof err === 'object' ? JSON.stringify(err) : String(err),
              finishTime: new Date().toLocaleString()
            })
          }
        }
      })
      this.ctx.uploadFiles({
        files
      })
    }
    return true
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    const res = await this.ctx.putObject({
      Bucket: bucketName,
      Region: region,
      Key: key,
      Body: ''
    })
    return res && res.statusCode === 200
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
      const { bucketName, region, key, fileName } = item
      const id = `${bucketName}-${region}-${key}`
      if (instance.getDownloadTask(id)) {
        continue
      }
      instance.addDownloadTask({
        id,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        targetFilePath: path.join(downloadPath, fileName)
      })
      this.ctx.downloadFile({
        Bucket: bucketName,
        Region: region,
        Key: key,
        RetryTimes: 3,
        ChunkSize: 1024 * 1024 * 1,
        FilePath: path.join(downloadPath, fileName),
        onProgress: (progress: any) => {
          instance.updateDownloadTask({
            id,
            progress: Math.floor(progress.percent * 100),
            status: downloadTaskSpecialStatus.downloading
          })
        }
      }).then((res: any) => {
        instance.updateDownloadTask({
          id,
          progress: res && res.statusCode === 200 ? 100 : 0,
          status: res && res.statusCode === 200 ? downloadTaskSpecialStatus.downloaded : commonTaskStatus.failed,
          response: typeof res === 'object' ? JSON.stringify(res) : String(res),
          finishTime: new Date().toLocaleString()
        })
      }).catch((err: any) => {
        this.logger.error(formatError(err, { method: 'downloadBucketFile', class: 'TcyunApi' }))
        instance.updateDownloadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          response: typeof err === 'object' ? JSON.stringify(err) : String(err),
          finishTime: new Date().toLocaleString()
        })
      })
    }
    return true
  }
}

export default TcyunApi
