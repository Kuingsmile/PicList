
import fs from 'fs-extra'
import path from 'path'
import { EventEmitter } from 'events'
import { managePathChecker } from './datastore/dbChecker'
import {
  ManageApiType,
  ManageConfigType,
  ManageError,
  PicBedMangeConfig
} from '~/universal/types/manage'
import ManageDB from './datastore/db'
import { ManageLogger } from './utils/logger'
import { get, set, unset } from 'lodash'
import { homedir } from 'os'
import { isInputConfigValid, formatError } from './utils/common'
import API from './apis/api'
import windowManager from 'apis/app/window/windowManager'
import { IWindowList } from '#/types/enum'
import { ipcMain } from 'electron'
import { cancelDownloadLoadingFileList, refreshDownloadFileTransferList } from '@/manage/utils/static'

export class ManageApi extends EventEmitter implements ManageApiType {
  private _config!: Partial<ManageConfigType>
  private db!: ManageDB
  currentPicBed: string
  configPath: string
  baseDir!: string
  logger: ManageLogger
  currentPicBedConfig: PicBedMangeConfig

  constructor (currentPicBed: string = '') {
    super()
    this.currentPicBed = currentPicBed || (this.getConfig('currentPicBed') ?? 'placeholder')
    this.configPath = managePathChecker()
    this.initConfigPath()
    this.logger = new ManageLogger(this)
    this.initconfig()
    this.currentPicBedConfig = this.getPicBedConfig(this.currentPicBed)
  }

  getMsgParam (method: string) {
    return {
      class: 'ManageApi',
      method,
      picbedName: this.currentPicBedConfig.picBedName
    }
  }

  errorMsg (err: any, param: IStringKeyMap) {
    this.logger.error(formatError(err, param))
  }

  createClient () {
    const name = this.currentPicBedConfig.picBedName
    switch (name) {
      case 'aliyun':
        return new API.AliyunApi(this.currentPicBedConfig.accessKeyId, this.currentPicBedConfig.accessKeySecret, this.logger)
      case 'github':
        return new API.GithubApi(this.currentPicBedConfig.token, this.currentPicBedConfig.githubUsername, this.currentPicBedConfig.proxy, this.logger)
      case 'imgur':
        return new API.ImgurApi(this.currentPicBedConfig.imgurUserName, this.currentPicBedConfig.accessToken, this.currentPicBedConfig.proxy, this.logger)
      case 'local':
        return new API.LocalApi(this.logger)
      case 'qiniu':
        return new API.QiniuApi(this.currentPicBedConfig.accessKey, this.currentPicBedConfig.secretKey, this.logger)
      case 'smms':
        return new API.SmmsApi(this.currentPicBedConfig.token, this.logger)
      case 's3plist':
        return new API.S3plistApi(this.currentPicBedConfig.accessKeyId, this.currentPicBedConfig.secretAccessKey, this.currentPicBedConfig.endpoint, this.currentPicBedConfig.sslEnabled, this.currentPicBedConfig.s3ForcePathStyle, this.currentPicBedConfig.proxy, this.logger, this.currentPicBedConfig.dogeCloudSupport || false, this.currentPicBedConfig.bucketName || '')
      case 'sftp':
        return new API.SftpApi(this.currentPicBedConfig.host, this.currentPicBedConfig.port, this.currentPicBedConfig.username, this.currentPicBedConfig.password, this.currentPicBedConfig.privateKey, this.currentPicBedConfig.passphrase, this.currentPicBedConfig.fileMode, this.currentPicBedConfig.dirMode, this.logger)
      case 'tcyun':
        return new API.TcyunApi(this.currentPicBedConfig.secretId, this.currentPicBedConfig.secretKey, this.logger)
      case 'upyun':
        return new API.UpyunApi(this.currentPicBedConfig.bucketName, this.currentPicBedConfig.operator, this.currentPicBedConfig.password, this.logger, this.currentPicBedConfig.antiLeechToken, this.currentPicBedConfig.expireTime)
      case 'webdavplist':
        return new API.WebdavplistApi(this.currentPicBedConfig.endpoint, this.currentPicBedConfig.username, this.currentPicBedConfig.password, this.currentPicBedConfig.sslEnabled, this.currentPicBedConfig.proxy, this.logger)
      default:
        return {} as any
    }
  }

  private getPicBedConfig (picBedName: string): PicBedMangeConfig {
    return this.getConfig<PicBedMangeConfig>(`picBed.${picBedName}`)
  }

  private initConfigPath (): void {
    if (this.configPath === '') {
      this.configPath = `${homedir()}/.piclist/manage.json`
    }
    if (path.extname(this.configPath).toUpperCase() !== '.JSON') {
      this.configPath = ''
      throw Error('The configuration file only supports JSON format.')
    }
    this.baseDir = path.dirname(this.configPath)
    const exist = fs.pathExistsSync(this.configPath)
    if (!exist) {
      fs.ensureFileSync(this.configPath)
    }
  }

  private initconfig (): void {
    this.db = new ManageDB(this)
    this._config = this.db.read(true) as ManageConfigType
  }

  getConfig<T> (name?: string): T {
    if (!name) {
      return this._config as unknown as T
    }
    return get(this._config, name)
  }

  saveConfig (config: IStringKeyMap): void {
    if (!isInputConfigValid(config)) {
      this.logger.warn(
        'the format of config is invalid, please provide object'
      )
      return
    }
    this.setConfig(config)
    this.db.saveConfig(config)
  }

  removeConfig (key: string, propName: string): void {
    if (!key || !propName) {
      return
    }
    this.unsetConfig(key, propName)
    this.db.unset(key, propName)
  }

  setConfig (config: IStringKeyMap): void {
    if (!isInputConfigValid(config)) {
      this.logger.warn(
        'the format of config is invalid, please provide object'
      )
      return
    }
    Object.keys(config).forEach((name: string) => {
      set(this._config, name, config[name])
    })
  }

  unsetConfig (key: string, propName: string): void {
    if (!key || !propName) return
    unset(this.getConfig(key), propName)
  }

  async getBucketList (
    param?: IStringKeyMap | undefined
  ): Promise<any> {
    let client
    const name = this.currentPicBedConfig.picBedName.replace('plist', '')
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'github':
      case 'imgur':
      case 's3plist':
        try {
          client = this.createClient()
          return await client.getBucketList()
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('getBucketList'))
          return []
        }
      case 'upyun':
        return [{
          Name: this.currentPicBedConfig.bucketName,
          Location: 'upyun',
          CreationDate: new Date().toISOString()
        }]
      case 'smms':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        return [{
          Name: name,
          Location: name,
          CreationDate: new Date().toISOString()
        }]
      default:
        console.log(param)
        return []
    }
  }

  async getBucketInfo (
    param?: IStringKeyMap | undefined
  ): Promise<IStringKeyMap | ManageError> {
    console.log(param)
    return {}
  }

  async getBucketDomain (
    param: IStringKeyMap
  ): Promise<IStringKeyMap | ManageError> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'github':
        try {
          client = this.createClient() as any
          return await client.getBucketDomain(param)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('getBucketDomain'))
          return []
        }
      case 'upyun':
        return [this.currentPicBedConfig.customUrl]
      case 'smms':
        return ['https://smms.app']
      case 'imgur':
        return ['https://imgur.com']
      default:
        return []
    }
  }

  async createBucket (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
        try {
          client = this.createClient() as any
          return await client.createBucket(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('createBucket'))
          return false
        }
      default:
        return false
    }
  }

  async deleteBucket (
    param?: IStringKeyMap
  ): Promise<boolean> {
    console.log(param)
    return false
  }

  async getOperatorList (
    param?: IStringKeyMap
  ): Promise<string[] | ManageError> {
    console.log(param)
    return []
  }

  async addOperator (
    param?: IStringKeyMap
  ): Promise<boolean> {
    console.log(param)
    return false
  }

  async deleteOperator (
    param?: IStringKeyMap
  ): Promise<boolean> {
    console.log(param)
    return false
  }

  async getBucketAclPolicy (
    param?: IStringKeyMap
  ): Promise<IStringKeyMap | ManageError> {
    console.log(param)
    return {}
  }

  async setBucketAclPolicy (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'qiniu':
        try {
          client = new API.QiniuApi(this.currentPicBedConfig.accessKey, this.currentPicBedConfig.secretKey, this.logger)
          return await client.setBucketAclPolicy(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('setBucketAclPolicy'))
          return false
        }
      default:
        return false
    }
  }

  async getBucketListRecursively (
    param?: IStringKeyMap
  ): Promise<IStringKeyMap | ManageError> {
    let client
    let window
    const defaultResult = {
      fullList: [],
      success: false,
      finished: true
    }
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'smms':
      case 'github':
      case 'imgur':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          return await client.getBucketListRecursively(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('getBucketListRecursively'))
          window = windowManager.get(IWindowList.SETTING_WINDOW)!
          window.webContents.send(refreshDownloadFileTransferList, defaultResult)
          ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
          return {}
        }
      default:
        window = windowManager.get(IWindowList.SETTING_WINDOW)!
        window.webContents.send(refreshDownloadFileTransferList, defaultResult)
        ipcMain.removeAllListeners(cancelDownloadLoadingFileList)
        return {}
    }
  }

  /**
   * 后台更新bucket文件列表
   * @param param
   * @returns
   */
  async getBucketListBackstage (
    param?: IStringKeyMap
  ): Promise<IStringKeyMap | ManageError> {
    let client
    let window
    const defaultResult = {
      fullList: [],
      success: false,
      finished: true
    }
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'smms':
      case 'github':
      case 'imgur':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          return await client.getBucketListBackstage(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('getBucketListBackstage'))
          window = windowManager.get(IWindowList.SETTING_WINDOW)!
          window.webContents.send('refreshFileTransferList', defaultResult)
          ipcMain.removeAllListeners('cancelLoadingFileList')
          return {}
        }
      default:
        window = windowManager.get(IWindowList.SETTING_WINDOW)!
        window.webContents.send('refreshFileTransferList', defaultResult)
        ipcMain.removeAllListeners('cancelLoadingFileList')
        return {}
    }
  }

  /**
  * 获取文件夹列表
  * 结果统一进行格式化 文件夹提取到最前
  * key: 完整路径
  * fileName: 文件名
  * formatedTime: 格式化时间
  * isDir: 是否是文件夹
  * fileSize: 文件大小
  **/
  async getBucketFileList (
    param?: IStringKeyMap
  ): Promise<IStringKeyMap | ManageError> {
    const defaultResponse = {
      fullList: <any>[],
      isTruncated: false,
      nextMarker: '',
      success: false
    }
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'smms':
      case 's3plist':
        try {
          client = this.createClient()
          return await client.getBucketFileList(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('getBucketFileList'))
          return defaultResponse
        }
      default:
        return defaultResponse
    }
  }

  async deleteBucketFile (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'smms':
      case 'github':
      case 'imgur':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          const res = await client.deleteBucketFile(param!)
          return res
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('deleteBucketFile'))
          return false
        }
      default:
        return false
    }
  }

  async deleteBucketFolder (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'github':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          return await client.deleteBucketFolder(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('deleteBucketFolder'))
          return false
        }
      default:
        return false
    }
  }

  async renameBucketFile (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          return await client.renameBucketFile(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('renameBucketFile'))
          return false
        }
      default:
        return false
    }
  }

  async downloadBucketFile (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'smms':
      case 'github':
      case 'imgur':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          const res = await client.downloadBucketFile(param!)
          return res
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('downloadBucketFile'))
          return false
        }
      default:
        return false
    }
  }

  async copyMoveBucketFile (
    param?: IStringKeyMap
  ): Promise<boolean> {
    console.log(param)
    return false
  }

  async createBucketFolder (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'github':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          return await client.createBucketFolder(param!)
        } catch (error) {
          this.errorMsg(error, this.getMsgParam('createBucketFolder'))
          return false
        }
      default:
        return false
    }
  }

  async uploadBucketFile (
    param?: IStringKeyMap
  ): Promise<boolean> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'upyun':
      case 'smms':
      case 'github':
      case 'imgur':
      case 's3plist':
      case 'webdavplist':
      case 'local':
      case 'sftp':
        try {
          client = this.createClient() as any
          return await client.uploadBucketFile(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('uploadBucketFile'))
          return false
        }
      default:
        return false
    }
  }

  async getPreSignedUrl (
    param?: IStringKeyMap
  ): Promise<string> {
    let client
    switch (this.currentPicBedConfig.picBedName) {
      case 'tcyun':
      case 'aliyun':
      case 'qiniu':
      case 'github':
      case 's3plist':
      case 'webdavplist':
        try {
          client = this.createClient() as any
          return await client.getPreSignedUrl(param!)
        } catch (error: any) {
          this.errorMsg(error, this.getMsgParam('getPreSignedUrl'))
          return 'error'
        }
      default:
        return 'error'
    }
  }
}
