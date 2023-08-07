// Axios
import axios from 'axios'

// 加密函数、获取文件 MIME 类型、新的下载器、错误格式化函数、并发异步任务池
import { hmacSha1Base64, getFileMimeType, NewDownloader, formatError, ConcurrencyPromisePool } from '../utils/common'

// 七牛云客户端库
import qiniu from 'qiniu/index'

// 路径处理库
import path from 'path'

// 是否为图片的判断函数
import { isImage } from '~/renderer/manage/utils/common'

// 窗口管理器
import windowManager from 'apis/app/window/windowManager'

// 枚举类型声明
import { IWindowList } from '#/types/enum'

// Electron 相关
import { ipcMain, IpcMainEvent } from 'electron'

// 上传下载任务队列
import UpDownTaskQueue, { uploadTaskSpecialStatus, commonTaskStatus } from '../datastore/upDownTaskQueue'

// 日志记录器
import { ManageLogger } from '../utils/logger'

// 取消下载任务的加载文件列表、刷新下载文件传输列表
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'

class QiniuApi {
  mac: qiniu.auth.digest.Mac
  accessKey: string
  secretKey: string
  commonType = 'application/x-www-form-urlencoded'
  host = 'uc.qiniuapi.com'
  logger: ManageLogger
  timeout = 30000

  hostList = {
    getBucketList: 'https://uc.qiniuapi.com/buckets',
    getBucketDomain: 'https://uc.qiniuapi.com/v2/domains'
  }

  constructor (accessKey: string, secretKey: string, logger: ManageLogger) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    this.accessKey = accessKey
    this.secretKey = secretKey
    this.logger = logger
  }

  formatFolder (item: string, slicedPrefix: string) {
    return {
      Key: item,
      key: item,
      fileSize: 0,
      fileName: item.replace(slicedPrefix, '').replace('/', ''),
      isDir: true,
      checked: false,
      isImage: false,
      match: false
    }
  }

  formatFile (item: any, slicedPrefix: string, urlPrefix: string) {
    const fileName = item.key.replace(slicedPrefix, '')
    return {
      ...item,
      fileName,
      url: `${urlPrefix}/${item.key}`,
      fileSize: item.fsize,
      formatedTime: new Date(parseInt(item.putTime.toString().slice(0, -4), 10)).toLocaleString(),
      isDir: false,
      checked: false,
      match: false,
      isImage: isImage(fileName)
    }
  }

  authorization (
    method: string,
    urlPath: string,
    host: string,
    body: string,
    query: string,
    contentType: string,
    xQiniuHeaders?: IStringKeyMap
  ) {
    let signStr = `${method.toUpperCase()} ${urlPath}${query ? `?${query}` : ''}\nHost: ${host}`

    contentType && (signStr += `\nContent-Type: ${contentType}`)
    if (xQiniuHeaders) {
      const xQiniuHeaderStr = Object.keys(xQiniuHeaders)
        .sort()
        .map((key) => `\n${key}:${xQiniuHeaders[key]}`)
        .join('')
      signStr += xQiniuHeaderStr
    }

    signStr += '\n\n'

    if (contentType !== 'application/octet-stream' && body) signStr += body
    return `Qiniu ${this.accessKey}:${hmacSha1Base64(this.secretKey, signStr).replace(/\+/g, '-').replace(/\//g, '_')}`
  }

  /**
   * 获取存储桶列表
  */
  async getBucketList (): Promise<any> {
    const host = this.hostList.getBucketList
    const authorization = qiniu.util.generateAccessToken(this.mac, host, undefined)
    const res = await axios.get(host, {
      headers: {
        Authorization: authorization,
        'Content-Type': this.commonType
      },
      timeout: this.timeout
    })
    if (res?.status === 200 && res?.data?.length) {
      const result = [] as any[]
      for (let i = 0; i < res.data.length; i++) {
        const info = await this.getBucketInfo({ bucketName: res.data[i] })
        if (!info.success) return []
        result.push({
          Name: res.data[i],
          Location: info.zone,
          CreationDate: new Date().toISOString(),
          Private: info.private
        })
      }
      return result
    }
    return []
  }

  /**
   * 获取存储桶详细信息
  */
  async getBucketInfo (param: IStringKeyMap): Promise<any> {
    const { bucketName } = param
    const urlPath = `/v2/bucketInfo?bucket=${bucketName}&fs=true`
    const authorization = this.authorization('POST', urlPath, this.host, '', '', 'application/json')
    const res = await axios({
      method: 'post',
      url: `https://${this.host}/v2/bucketInfo`,
      params: {
        bucket: bucketName,
        fs: true
      },
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Host: this.host
      },
      timeout: this.timeout
    })
    return res?.status === 200
      ? {
        success: true,
        private: res.data.private,
        zone: res.data.zone
      }
      : {
        success: false
      }
  }

  /**
   * 获取自定义域名
   */
  async getBucketDomain (param: IStringKeyMap): Promise<any> {
    const { bucketName } = param
    const host = this.hostList.getBucketDomain
    const authorization = qiniu.util.generateAccessToken(this.mac, `${host}?tbl=${bucketName}`, undefined)
    const res = await axios.get(host, {
      params: {
        tbl: bucketName
      },
      headers: {
        Authorization: authorization,
        'Content-Type': this.commonType
      },
      timeout: this.timeout
    })
    return res?.status === 200 && res?.data?.length ? res.data : []
  }

  /**
   * 修改存储桶权限
   */
  async setBucketAclPolicy (param: IStringKeyMap): Promise<boolean> {
    // 0: 公开访问 1: 私有访问
    const { bucketName } = param
    let { isPrivate } = param
    isPrivate = isPrivate ? 1 : 0
    const urlPath = `/private?bucket=${bucketName}&private=${isPrivate}`
    const authorization = this.authorization('POST', urlPath, this.host, '', '', this.commonType)
    const res = await axios({
      method: 'post',
      url: `https://${this.host}/private`,
      params: {
        bucket: bucketName,
        private: isPrivate
      },
      headers: {
        Authorization: authorization,
        'Content-Type': this.commonType,
        Host: this.host
      },
      timeout: this.timeout
    })
    return res?.status === 200
  }

  /**
   * 创建存储桶
   * @param {Object} configMap
   * configMap = {
   * BucketName: string,
   * region: string,
   * acl: boolean // 是否公开访问
   * }
  */
  async createBucket (configMap: IStringKeyMap): Promise<boolean> {
    const { BucketName, region, acl } = configMap
    const urlPath = `/mkbucketv3/${BucketName}/region/${region}`
    const authorization = this.authorization('POST', urlPath, this.host, '', '', 'application/json')
    const res = await axios({
      method: 'post',
      url: `https://${this.host}${urlPath}`,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
        Host: this.host
      },
      timeout: this.timeout
    })
    return res?.status === 200
      ? await this.setBucketAclPolicy({
        bucketName: BucketName,
        isPrivate: !acl
      })
      : false
  }

  async getBucketListRecursively (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, prefix, cancelToken, customUrl: urlPrefix } = configMap
    let marker = undefined as any
    const slicedPrefix = prefix.slice(1)
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
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    do {
      res = await new Promise((resolve, reject) => {
        bucketManager.listPrefix(bucket, {
          prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          marker,
          limit: 1000
        }, (err: any, respBody: any, respInfo: any) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              respBody,
              respInfo
            })
          }
        })
      })
      if (res && res.respInfo.statusCode === 200) {
        res.respBody && res.respBody.items && res.respBody.items.forEach((item: any) => {
          item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
        window.webContents.send(refreshDownloadFileTransferList, result)
      } else {
        result.finished = true
        window.webContents.send(refreshDownloadFileTransferList, result)
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
        return
      }
      marker = res.respBody.marker
    } while (res.respBody && res.respBody.marker && !cancelTask[0])
    result.success = !cancelTask[0]
    result.finished = true
    window.webContents.send(refreshDownloadFileTransferList, result)
    ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
  }

  async getBucketListBackstage (configMap: IStringKeyMap): Promise<any> {
    const window = windowManager.get(IWindowList.SETTING_WINDOW)!
    const { bucketName: bucket, prefix, cancelToken, customUrl: urlPrefix } = configMap
    let marker = undefined as any
    const slicedPrefix = prefix.slice(1)
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
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    do {
      res = await new Promise((resolve, reject) => {
        bucketManager.listPrefix(bucket, {
          prefix: slicedPrefix === '' ? undefined : slicedPrefix,
          delimiter: '/',
          marker,
          limit: 1000
        }, (err: any, respBody: any, respInfo: any) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              respBody,
              respInfo
            })
          }
        })
      })
      if (res && res.respInfo.statusCode === 200) {
        res.respBody && res.respBody.commonPrefixes && res.respBody.commonPrefixes.forEach((item: any) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix))
        })
        res.respBody && res.respBody.items && res.respBody.items.forEach((item: any) => {
          item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
        window.webContents.send('refreshFileTransferList', result)
      } else {
        result.finished = true
        window.webContents.send('refreshFileTransferList', result)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return
      }
      marker = res.respBody.marker
    } while (res.respBody && res.respBody.marker && !cancelTask[0])
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
    const { bucketName: bucket, prefix, marker, itemsPerPage, customUrl: urlPrefix } = configMap
    const slicedPrefix = prefix.slice(1)
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    let res = {} as any
    const result = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    res = await new Promise((resolve, reject) => {
      bucketManager.listPrefix(bucket, {
        limit: itemsPerPage,
        prefix: slicedPrefix === '' ? undefined : slicedPrefix,
        marker,
        delimiter: '/'
      }, (err, respBody, respInfo) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            respBody,
            respInfo
          })
        }
      })
    })
    if (res?.respInfo?.statusCode === 200) {
      if (res.respBody?.commonPrefixes) {
        res.respBody.commonPrefixes.forEach((item: string) => {
          result.fullList.push(this.formatFolder(item, slicedPrefix))
        })
      }
      if (res.respBody?.items) {
        res.respBody.items.forEach((item: any) => {
          item.fsize !== 0 && result.fullList.push(this.formatFile(item, slicedPrefix, urlPrefix))
        })
      }
      result.isTruncated = !!(res.respBody?.marker)
      result.nextMarker = res.respBody?.marker ? res.respBody.marker : ''
      result.success = true
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
    const { bucketName, key } = configMap
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    const res = await new Promise((resolve, reject) => {
      bucketManager.delete(bucketName, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            respBody,
            respInfo
          })
        }
      })
    }) as any
    return res?.respInfo?.statusCode === 200
  }

  /**
   * 删除文件夹
   * @param configMap
   */
  async deleteBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, key } = configMap
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    let marker = ''
    let isTruncated = true
    const allFileList = {
      Contents: [] as any[]
    }
    do {
      const res = await new Promise((resolve, reject) => {
        bucketManager.listPrefix(bucketName, {
          prefix: key,
          marker,
          limit: 1000
        }, (err, respBody, respInfo) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              respBody,
              respInfo
            })
          }
        })
      }) as any
      if (res?.respInfo?.statusCode === 200) {
        if (res.respBody?.items) {
          allFileList.Contents = allFileList.Contents.concat(res.respBody.items)
        }
        isTruncated = !!(res.respBody?.marker)
        marker = res.respBody?.marker ? res.respBody.marker : ''
      } else {
        return false
      }
    } while (isTruncated)
    const cycleNum = Math.ceil(allFileList.Contents.length / 1000)
    for (let i = 0; i < cycleNum; i++) {
      const deleteOps = allFileList.Contents.slice(i * 1000, (i + 1) * 1000).map((item: any) => {
        return qiniu.rs.deleteOp(bucketName, item.key)
      })
      const res = await new Promise((resolve, reject) => {
        bucketManager.batch(deleteOps, (err, respBody, respInfo) => {
          if (err) {
            reject(err)
          } else {
            resolve({
              respBody,
              respInfo
            })
          }
        })
      }) as any
      if (res?.respInfo?.statusCode !== 200) return false
    }
    return true
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
    const { bucketName, oldKey, newKey } = configMap
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    const res = await new Promise((resolve, reject) => {
      bucketManager.move(bucketName, oldKey, bucketName, newKey, {
        force: true
      }, (err, respBody, respInfo) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            respBody,
            respInfo
          })
        }
      })
    }) as any
    return res?.respInfo?.statusCode === 200
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
    const { key, expires, customUrl } = configMap
    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config)
    const urlPrefix = customUrl
    const expiration = parseInt(Date.now() / 1000 + expires)
    const res = bucketManager.privateDownloadUrl(urlPrefix, key, expiration)
    return res
  }

  /**
   * 上传文件
   * @param configMap
   */
  async uploadBucketFile (configMap: IStringKeyMap): Promise<boolean> {
    const { fileArray } = configMap
    const instance = UpDownTaskQueue.getInstance()
    fileArray.forEach((item: any) => {
      item.key = item.key.replace(/^\/+/, '')
    })
    for (const item of fileArray) {
      const { bucketName, region, key, filePath, fileName } = item
      instance.addUploadTask({
        id: `${bucketName}-${region}-${key}-${filePath}`,
        progress: 0,
        status: commonTaskStatus.queuing,
        sourceFileName: fileName,
        sourceFilePath: filePath,
        targetFilePath: key,
        targetFileBucket: bucketName,
        targetFileRegion: region
      })
      const config = new qiniu.conf.Config()
      const resumeUploader = new qiniu.resume_up.ResumeUploader(config)
      const putExtra = new qiniu.resume_up.PutExtra()
      const uploadToken = new qiniu.rs.PutPolicy({
        scope: `${bucketName}:${key}`,
        expires: 36000
      }).uploadToken(this.mac)
      putExtra.fname = key
      putExtra.params = {}
      putExtra.mimeType = getFileMimeType(fileName)
      putExtra.version = 'v2'
      putExtra.partSize = 4 * 1024 * 1024
      putExtra.progressCallback = (uploadBytes, totalBytes) => {
        const progress = Math.floor(uploadBytes / totalBytes * 100)
        instance.updateUploadTask({
          id: `${bucketName}-${region}-${key}-${filePath}`,
          progress,
          status: uploadTaskSpecialStatus.uploading
        })
      }
      resumeUploader.putFile(uploadToken, key, filePath, putExtra, (respErr, respBody, respInfo) => {
        if (respErr) {
          this.logger.error(formatError(respErr, { class: 'Qiniu', method: 'uploadBucketFile' }))
          instance.updateUploadTask({
            id: `${bucketName}-${region}-${key}-${filePath}`,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: new Date().toLocaleString()
          })
          return
        }
        if (respInfo.statusCode === 200) {
          instance.updateUploadTask({
            id: `${bucketName}-${region}-${key}-${filePath}`,
            progress: 100,
            status: uploadTaskSpecialStatus.uploaded,
            response: JSON.stringify(respBody),
            finishTime: new Date().toLocaleString()
          })
        } else {
          instance.updateUploadTask({
            id: `${bucketName}-${region}-${key}-${filePath}`,
            progress: 0,
            status: commonTaskStatus.failed,
            finishTime: new Date().toLocaleString()
          })
        }
      })
    }
    return true
  }

  /**
   * 新建文件夹
   * @param configMap
   */
  async createBucketFolder (configMap: IStringKeyMap): Promise<boolean> {
    const { bucketName, key } = configMap
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${bucketName}:${key}`
    })
    const uploadToken = putPolicy.uploadToken(this.mac)
    const FormUploader = new qiniu.form_up.FormUploader()
    const putExtra = new qiniu.form_up.PutExtra()
    const res = await new Promise((resolve, reject) => {
      FormUploader.put(uploadToken, key, '', putExtra, (err, respBody, respInfo) => {
        if (err) {
          reject(err)
        } else {
          resolve({
            respBody,
            respInfo
          })
        }
      })
    }) as any
    return res?.respInfo?.statusCode === 200
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
      const preSignedUrl = await this.getPreSignedUrl({ key, expires: 36000, customUrl })
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
    pool.all(promises).catch((error) => {
      this.logger.error(formatError(error, { class: 'QiniuApi', method: 'downloadBucketFile' }))
    })
    return true
  }
}

export default QiniuApi
