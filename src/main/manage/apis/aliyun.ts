// Axios
import axios from 'axios'

// 加密函数、获取文件 MIME 类型、错误格式化函数、新的下载器、并发异步任务池
import { hmacSha1Base64, getFileMimeType, formatError, NewDownloader, ConcurrencyPromisePool } from '../utils/common'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// 快速 XML 解析器
import { XMLParser } from 'fast-xml-parser'

// 阿里云 OSS 客户端库
import OSS from 'ali-oss'

// 路径处理库
import path from 'path'

// 是否为图片的判断函数
import { isImage } from '~/renderer/manage/utils/common'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// 上传下载任务队列
import UpDownTaskQueue, { uploadTaskSpecialStatus, commonTaskStatus } from '../datastore/upDownTaskQueue'

// 日志记录器
import { ManageLogger } from '../utils/logger'

// 取消下载任务的加载文件列表、刷新下载文件传输列表
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'

// 坑爹阿里云 返回数据类型标注和实际各种不一致
class AliyunApi {
  ctx: OSS
  accessKeyId: string
  accessKeySecret: string
  timeOut = 30000
  logger: ManageLogger

  constructor (accessKeyId: string, accessKeySecret: string, logger: ManageLogger) {
    this.ctx = new OSS({
      accessKeyId,
      accessKeySecret,
      secure: true
    })
    this.accessKeyId = accessKeyId
    this.accessKeySecret = accessKeySecret
    this.logger = logger
  }

  formatFolder (item: string, slicedPrefix: string) {
    return {
      key: item,
      fileSize: 0,
      formatedTime: '',
      fileName: item.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false,
      Key: item
    }
  }

  formatFile (item: OSS.ObjectMeta, slicedPrefix: string, urlPrefix: string): any {
    const fileName = item.name.replace(slicedPrefix, '')
    return {
      ...item,
      key: item.name,
      fileName,
      fileSize: item.size,
      formatedTime: new Date(item.lastModified).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName),
      rawUrl: item.url,
      url: `${urlPrefix}/${item.name}`
    }
  }

  getCanonicalizedOSSHeaders (headers: IStringKeyMap) {
    const lowerCaseHeaders = Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = headers[key]
      return acc
    }, {} as IStringKeyMap)
    let canonicalizedOSSHeaders = ''
    const headerKeys = Object.keys(lowerCaseHeaders).sort()
    headerKeys.forEach((key) => {
      key.startsWith('x-oss-') && (canonicalizedOSSHeaders += `${key}:${lowerCaseHeaders[key]}\n`)
    })
    return canonicalizedOSSHeaders
  }

  authorization (method: string, canonicalizedResource: string, headers: IStringKeyMap, contentMd5: string, contentType: string) {
    const date = new Date().toUTCString()
    const stringToSign = `${method.toUpperCase()}\n${contentMd5}\n${contentType}\n${date}\n${this.getCanonicalizedOSSHeaders(headers)}${canonicalizedResource}`
    return `OSS ${this.accessKeyId}:${hmacSha1Base64(this.accessKeySecret, stringToSign)}`
  }

  getNewCtx (region: string, bucket: string) {
    return new OSS({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region,
      bucket,
      secure: true
    })
  }

  /**
     * 获取存储桶列表
    */
  async getBucketList (): Promise<any> {
    const getBuckets = async (marker?: string) => {
      const res = await this.ctx.listBuckets({
        marker,
        'max-keys': 1000
      }) as IStringKeyMap
      if (res?.res?.statusCode !== 200 || !res?.buckets) return { result: [], isTruncated: false }
      const formattedBuckets = res.buckets.map((item: OSS.Bucket) => ({
        Name: item.name,
        Location: item.region,
        CreationDate: item.creationDate
      }))
      return { result: formattedBuckets, isTruncated: res.isTruncated, nextMarker: res.nextMarker }
    }
    const result: IStringKeyMap[] = []
    let NextMarker: string | undefined
    let isTruncated: boolean
    do {
      const { result: buckets, isTruncated: truncated, nextMarker } = await getBuckets(NextMarker)
      result.push(...buckets)
      NextMarker = nextMarker
      isTruncated = truncated
    } while (isTruncated)

    return result
  }

  /**
   * 获取自定义域名
   */
  async getBucketDomain (param: IStringKeyMap): Promise<any> {
    const headers = {
      Date: new Date().toUTCString()
    }
    const authorization = this.authorization('GET', `/${param.bucketName}/?cname`, headers, '', '')

    const res = await axios({
      url: `https://${param.bucketName}.${param.region}.aliyuncs.com/?cname`,
      method: 'GET',
      headers: {
        ...headers,
        Authorization: authorization
      }
    })

    if (res?.status === 200) {
      const parser = new XMLParser()
      const result = parser.parse(res.data)

      if (result.ListCnameResult?.Cname) {
        const cnames = Array.isArray(result.ListCnameResult.Cname)
          ? result.ListCnameResult.Cname
          : [result.ListCnameResult.Cname]

        return cnames
          .filter((item: IStringKeyMap) => item.Status === 'Enabled')
          .map((item: IStringKeyMap) => item.Domain)
      }
    }
    return []
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
  async createBucket (configMap: IStringKeyMap): Promise<boolean> {
    const client = new OSS({
      accessKeyId: this.accessKeyId,
      accessKeySecret: this.accessKeySecret,
      region: configMap.region,
      secure: true
    })
    const aclTransMap: IStringKeyMap = {
      private: 'private',
      publicRead: 'public-read',
      publicReadWrite: 'public-read-write'
    }
    const res = await client.putBucket(configMap.BucketName, {
      acl: aclTransMap[configMap.acl],
      storageClass: 'Standard',
      dataRedundancyType: 'LRS',
      timeout: this.timeOut
    })
    return res?.res?.status === 200
  }

  async getBucketListRecursively (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, cancelToken } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`
    let marker
    const cancelTask = [false]
    ipcMain.on(cancelDownloadLoadingFileList, (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
      }
    })
    let res = {} as any
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    const client = this.getNewCtx(region, bucket)
    do {
      res = await client.listV2({
        prefix: slicedPrefix === '' ? undefined : slicedPrefix,
        'max-keys': '1000',
        'continuation-token': marker
      }, {
        timeout: this.timeOut
      })
      if (res?.res?.statusCode === 200) {
        res?.objects?.forEach((item: OSS.ObjectMeta) => {
          item.size !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
        window.webContents.send(refreshDownloadFileTransferList, result)
      } else {
        result.finished = true
        window.webContents.send(refreshDownloadFileTransferList, result)
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
        return
      }
      marker = res.nextContinuationToken
    } while (res.isTruncated === true && !cancelTask[0])
    result.success = !cancelTask[0]
    result.finished = true
    window.webContents.send(refreshDownloadFileTransferList, result)
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, cancelToken } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`
    let marker
    const cancelTask = [false]
    ipcMain.on('cancelLoadingFileList', (_evt: IpcMainEvent, token: string) => {
      if (token === cancelToken) {
        cancelTask[0] = true
        ipcMain.removeAllListeners('cancelLoadingFileList')
      }
    })
    let res = {} as any
    const result = {
      fullList: <any>[],
      success: false,
      finished: false
    }
    const client = this.getNewCtx(region, bucket)
    do {
      res = await client.listV2({
        prefix: slicedPrefix === '' ? undefined : slicedPrefix,
        delimiter: '/',
        'max-keys': '1000',
        'continuation-token': marker
      }, {
        timeout: this.timeOut
      })
      if (res?.res?.statusCode === 200) {
        res?.prefixes?.forEach((item: string) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix))
        })
        res?.objects?.forEach((item: OSS.ObjectMeta) => {
          item.size !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
        window.webContents.send('refreshFileTransferList', result)
      } else {
        result.finished = true
        window.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
      marker = res.nextContinuationToken
    } while (res.isTruncated === true && !cancelTask[0])
    result.success = !cancelTask[0]
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
    const { bucketName: bucket, bucketConfig: { Location: region }, prefix, marker, itemsPerPage } = configMap
    const slicedPrefix = prefix.slice(1)
    const urlPrefix = configMap.customUrl || `https://${bucket}.${region}.aliyuncs.com`

    const client = this.getNewCtx(region, bucket)
    const res = await client.listV2({
      prefix: slicedPrefix || undefined,
      delimiter: '/',
      'max-keys': itemsPerPage.toString(),
      'continuation-token': marker
    }, {
      timeout: this.timeOut
    }) as any
    // prefixes can be null
    // objects will be [] when no file
    if (res?.res.statusCode !== 200) {
      return {
        fullList: [],
        isTruncated: false,
        nextMarker: '',
        success: false
      }
    }
    const fullList = [
      ...(res.prefixes?.map((item: string) => this.formatFolder(item, slicedPrefix)) || []),
      ...(res.objects?.filter((item: OSS.ObjectMeta) => item.size !== 0).map((item: OSS.ObjectMeta) => this.formatFile(item, slicedPrefix, urlPrefix)) || [])
    ]
    return {
      fullList,
      isTruncated: res.isTruncated,
      nextMarker: res.nextContinuationToken || '',
      success: true
    }
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
    const client = this.getNewCtx(region, bucketName)
    const copyRes = await client.copy(
      newKey,
      oldKey
    ) as any
    if (copyRes?.res.statusCode === 200) {
      const deleteRes = await client.delete(oldKey) as any
      return deleteRes?.res.statusCode === 204
    }
    return false
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
    const client = this.getNewCtx(region, bucketName)
    const res = await client.delete(key) as any
    return res?.res.statusCode === 204
  }

  /**
  * 删除文件夹
  * @param configMap
  */
  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, region, key } = configMap
    const client = this.getNewCtx(region, bucketName)
    let marker
    let isTruncated
    const allFileList = {
      CommonPrefixes: [] as any[],
      Contents: [] as any[]
    }
    do {
      const res = await client.listV2({
        prefix: key,
        delimiter: '/',
        'max-keys': '1000',
        'continuation-token': marker
      }, {
        timeout: this.timeOut
      }) as any
      if (res?.res.statusCode !== 200) return false

      res.prefixes !== null && allFileList.CommonPrefixes.push(...res.prefixes)
      res.objects?.length > 0 && allFileList.Contents.push(...res.objects)
      isTruncated = res.isTruncated
      marker = res.nextContinuationToken
    } while (isTruncated)

    if (allFileList.CommonPrefixes.length > 0) {
      for (const item of allFileList.CommonPrefixes) {
        const successfully = await this.deleteBucketFolder({
          bucketName,
          region,
          key: item
        })
        if (!successfully) return false
      }
    }
    if (allFileList.Contents.length > 0) {
      const cycle = Math.ceil(allFileList.Contents.length / 1000)
      for (let i = 0; i < cycle; i++) {
        const deleteRes = await client.deleteMulti(
          allFileList.Contents.slice(i * 1000, (i + 1) * 1000).map((item: any) => item.name)) as any
        if (deleteRes?.res.statusCode !== 200) return false
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
    const client = this.getNewCtx(region, bucketName)
    const res = client.signatureUrl(key, {
      expires: expires || 3600
    })
    return customUrl ? `${customUrl.replace(/\/+$/, '')}/${key}${res.slice(res.indexOf('?'))}` : res
  }

  /**
   * 上传文件
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
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName } = item
      const client = this.getNewCtx(region, bucketName)
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
      client.multipartUpload(
        key,
        filePath,
        {
          partSize: 1 * 1024 * 1024,
          mime: getFileMimeType(fileName),
          progress: (p: number) => {
            const id = `${bucketName}-${region}-${key}-${filePath}`
            instance.updateUploadTask({
              id,
              progress: Math.floor(p * 100),
              status: uploadTaskSpecialStatus.uploading
            })
          }
        }
      ).then((res: any) => {
        const id = `${bucketName}-${region}-${key}-${filePath}`
        if (res?.res?.statusCode === 200) {
          instance.updateUploadTask({
            id,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            response: JSON.stringify(res),
            finishTime: new Date().toLocaleString()
          })
        } else {
          instance.updateUploadTask({
            id,
            progress: 0,
            status: commonTaskStatus.failed,
            response: JSON.stringify(res),
            finishTime: new Date().toLocaleString()
          })
        }
      }).catch((err: any) => {
        this.logger.error(formatError(err, { class: 'AliyunApi', method: 'uploadBucketFile' }))
        const id = `${bucketName}-${region}-${key}-${filePath}`
        instance.updateUploadTask({
          id,
          progress: 0,
          status: commonTaskStatus.failed,
          response: JSON.stringify(err),
          finishTime: new Date().toLocaleString()
        })
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
    const client = this.getNewCtx(region, bucketName)
    const res = await client.put(key, Buffer.from('')) as any
    return res?.res?.statusCode === 200
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
      const { bucketName, region, key, fileName } = item
      const client = this.getNewCtx(region, bucketName)
      const savedFilePath = path.join(downloadPath, fileName)
      const id = `${bucketName}-${region}-${key}`
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
      const preSignedUrl = client.signatureUrl(key, {
        expires: 60 * 60 * 48
      })
      promises.push(() => new Promise((resolve, reject) => {
        NewDownloader(instance, preSignedUrl, id, savedFilePath, this.logger)
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
    pool.all(promises).catch((error: any) => {
      this.logger.error(formatError(error, { class: 'AliyunApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default AliyunApi
