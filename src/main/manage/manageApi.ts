import { EventEmitter } from 'node:events'
import { homedir } from 'node:os'
import path from 'node:path'

import { manageConfigPath } from '@core/datastore/dirs'
import windowManager from 'apis/app/window/windowManager'
import fs from 'fs-extra'
import { get, set, unset } from 'lodash-es'

import API from '~/manage/apis/api'
import ManageDB from '~/manage/datastore/db'
import { formatError, isInputConfigValid } from '~/manage/utils/common'
import { ManageLogger } from '~/manage/utils/logger'
import { IWindowList } from '~/utils/enum'

import { isListingRequest, listingChannels, type ListingRequest } from '../../universal/listing'
import { runListingRequest } from './listingRequest'

export class ManageApi extends EventEmitter implements IManageApiType {
  private _config!: Partial<IManageConfigType>
  private db!: ManageDB
  currentPicBed: string
  configPath: string
  baseDir!: string
  logger: ManageLogger
  currentPicBedConfig: IPicBedMangeConfig

  private readonly ALL_CLIENTS = [
    'tcyun',
    'aliyun',
    'qiniu',
    'upyun',
    'smms',
    'github',
    'imgur',
    's3plist',
    'webdavplist',
    'local',
    'sftp',
  ]

  private readonly CLOUD_STORAGE_CLIENTS = ['tcyun', 'aliyun', 'qiniu', 's3plist']
  private readonly BASIC_API_CLIENTS = ['tcyun', 'aliyun', 'qiniu', 'github', 'imgur', 's3plist']
  private readonly FOLDER_SUPPORT_CLIENTS = [
    'tcyun',
    'aliyun',
    'qiniu',
    'upyun',
    'github',
    's3plist',
    'webdavplist',
    'local',
    'sftp',
  ]

  constructor(currentPicBed: string = '') {
    super()
    this.currentPicBed = currentPicBed || 'placeholder'
    this.configPath = manageConfigPath()
    this.initConfigPath()
    this.logger = new ManageLogger(this)
    this.initconfig()
    this.currentPicBedConfig = this.getPicBedConfig(this.currentPicBed)
  }

  getMsgParam(method: string) {
    return {
      class: 'ManageApi',
      method,
      picbedName: this.currentPicBedConfig?.picBedName,
    }
  }

  errorMsg(err: any, param: IStringKeyMap) {
    this.logger.error(formatError(err, param))
  }

  private readonly clientFactories = {
    aliyun: () =>
      new API.AliyunApi(this.currentPicBedConfig.accessKeyId, this.currentPicBedConfig.accessKeySecret, this.logger),
    github: () =>
      new API.GithubApi(
        this.currentPicBedConfig.token,
        this.currentPicBedConfig.githubUsername,
        this.currentPicBedConfig.proxy,
        this.logger,
      ),
    imgur: () =>
      new API.ImgurApi(
        this.currentPicBedConfig.imgurUserName,
        this.currentPicBedConfig.accessToken,
        this.currentPicBedConfig.proxy,
        this.logger,
      ),
    local: () => new API.LocalApi(this.logger),
    qiniu: () => new API.QiniuApi(this.currentPicBedConfig.accessKey, this.currentPicBedConfig.secretKey, this.logger),
    smms: () => new API.SmmsApi(this.currentPicBedConfig.token, this.logger),
    s3plist: () =>
      new API.S3plistApi(
        this.currentPicBedConfig.accessKeyId,
        this.currentPicBedConfig.secretAccessKey,
        this.currentPicBedConfig.endpoint,
        this.currentPicBedConfig.sslEnabled,
        this.currentPicBedConfig.s3ForcePathStyle,
        this.currentPicBedConfig.proxy,
        this.logger,
        this.currentPicBedConfig.dogeCloudSupport || false,
        this.currentPicBedConfig.bucketName || '',
        this.currentPicBedConfig.region || '',
        this.currentPicBedConfig.customUrl || '',
      ),
    sftp: () =>
      new API.SftpApi(
        this.currentPicBedConfig.host,
        this.currentPicBedConfig.port,
        this.currentPicBedConfig.username,
        this.currentPicBedConfig.password,
        this.currentPicBedConfig.privateKey,
        this.currentPicBedConfig.passphrase,
        this.currentPicBedConfig.fileMode,
        this.currentPicBedConfig.dirMode,
        this.logger,
      ),
    tcyun: () => new API.TcyunApi(this.currentPicBedConfig.secretId, this.currentPicBedConfig.secretKey, this.logger),
    upyun: () =>
      new API.UpyunApi(
        this.currentPicBedConfig.bucketName,
        this.currentPicBedConfig.operator,
        this.currentPicBedConfig.password,
        this.logger,
        this.currentPicBedConfig.antiLeechToken,
        this.currentPicBedConfig.expireTime,
      ),
    webdavplist: () =>
      new API.WebdavplistApi(
        this.currentPicBedConfig.endpoint,
        this.currentPicBedConfig.username,
        this.currentPicBedConfig.password,
        this.currentPicBedConfig.sslEnabled,
        this.currentPicBedConfig.proxy,
        this.currentPicBedConfig.authType,
        this.logger,
      ),
  }

  createClient() {
    const factory = this.clientFactories[this.currentPicBedConfig.picBedName as keyof typeof this.clientFactories]
    return factory ? factory() : ({} as any)
  }

  private async executeWithClient<T>(
    supportedProviders: string[],
    method: string,
    operation: (client: any) => Promise<T>,
    defaultValue: T,
    options: { rethrowErrors?: boolean } = {},
  ): Promise<T> {
    if (!supportedProviders.includes(this.currentPicBedConfig.picBedName)) {
      return defaultValue
    }
    try {
      const client = this.createClient() as any
      return await operation(client)
    } catch (error: any) {
      this.errorMsg(error, this.getMsgParam(method))
      if (options.rethrowErrors) throw error
      return defaultValue
    }
  }

  private async executeListing(
    param: IStringKeyMap | undefined,
    kind: ListingRequest['kind'],
    method: string,
    stream = false,
  ) {
    if (!isListingRequest(param) || param.accountId !== this.currentPicBed || param.kind !== kind) {
      throw new Error('Invalid listing request identity')
    }
    const { requestId, accountId, provider, bucketName, prefix } = param
    const request: ListingRequest = { requestId, accountId, provider, bucketName, prefix, kind }
    const window = stream ? windowManager.get(IWindowList.SETTING_WINDOW) : undefined
    return runListingRequest(
      request,
      async listing => {
        if (provider !== this.currentPicBedConfig?.picBedName) throw new Error('Listing account is unavailable')
        if (kind === 'buckets') return { fullList: await this.listBuckets(), success: true }
        const client = this.createClient()
        if (typeof client[method] !== 'function') throw new Error('Unsupported listing operation')
        return client[method](param, listing)
      },
      stream ? result => window?.webContents.send(listingChannels(kind).result, result) : undefined,
      error => this.errorMsg(error, this.getMsgParam(method)),
    )
  }

  private getPicBedConfig(picBedName: string): IPicBedMangeConfig {
    return this.getConfig<IPicBedMangeConfig>(`picBed.${picBedName}`)
  }

  private initConfigPath(): void {
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

  private initconfig(): void {
    this.db = new ManageDB(this)
    this._config = this.db.read(true) as IManageConfigType
  }

  getConfig<T>(name?: string): T {
    if (!name) {
      return this._config as unknown as T
    }
    return get(this._config, name)
  }

  saveConfig(config: IStringKeyMap): void {
    if (!isInputConfigValid(config)) {
      this.logger.warn('the format of config is invalid, please provide object')
      return
    }
    this.setConfig(config)
    this.db.saveConfig(config)
  }

  removeConfig(key: string, propName: string): void {
    if (!key || !propName) {
      return
    }
    this.unsetConfig(key, propName)
    this.db.unset(key, propName)
  }

  setConfig(config: IStringKeyMap): void {
    if (!isInputConfigValid(config)) {
      this.logger.warn('the format of config is invalid, please provide object')
      return
    }
    Object.keys(config).forEach((name: string) => {
      set(this._config, name, config[name])
    })
  }

  unsetConfig(key: string, propName: string): void {
    if (!key || !propName) return
    unset(this.getConfig(key), propName)
  }

  async getBucketList(param?: IStringKeyMap): Promise<any> {
    return this.executeListing(param, 'buckets', 'getBucketList')
  }

  private async listBuckets(): Promise<any> {
    const staticBuckets = {
      upyun: [{ Name: this.currentPicBedConfig.bucketName, Location: 'upyun', CreationDate: new Date().toISOString() }],
      smms: [{ Name: 'smms', Location: 'smms', CreationDate: new Date().toISOString() }],
      webdavplist: [{ Name: 'webdav', Location: 'webdav', CreationDate: new Date().toISOString() }],
      local: [{ Name: 'local', Location: 'local', CreationDate: new Date().toISOString() }],
      sftp: [{ Name: 'sftp', Location: 'sftp', CreationDate: new Date().toISOString() }],
    }

    const staticResult = staticBuckets[this.currentPicBedConfig.picBedName as keyof typeof staticBuckets]
    if (staticResult) return staticResult

    if (!this.BASIC_API_CLIENTS.includes(this.currentPicBedConfig.picBedName)) {
      throw new Error('Unsupported listing operation')
    }
    return this.createClient().getBucketList()
  }

  async getBucketInfo(param?: IStringKeyMap | undefined): Promise<IStringKeyMap | IManageError> {
    console.log(param)
    return {}
  }

  async getBucketDomain(param: IStringKeyMap): Promise<IStringKeyMap | IManageError> {
    const staticDomains = {
      upyun: [this.currentPicBedConfig.customUrl],
      smms: ['https://s.ee'],
      imgur: ['https://imgur.com'],
    }

    const staticResult = staticDomains[this.currentPicBedConfig.picBedName as keyof typeof staticDomains]
    if (staticResult) return staticResult

    const supportedClients = ['tcyun', 'aliyun', 'qiniu', 'github']
    return this.executeWithClient(supportedClients, 'getBucketDomain', client => client.getBucketDomain(param), [])
  }

  async createBucket(param?: IStringKeyMap): Promise<boolean> {
    return this.executeWithClient(
      this.CLOUD_STORAGE_CLIENTS,
      'createBucket',
      client => client.createBucket(param!),
      false,
    )
  }

  async deleteBucket(_?: IStringKeyMap): Promise<boolean> {
    return false
  }

  async getOperatorList(_?: IStringKeyMap): Promise<string[] | IManageError> {
    return []
  }

  async addOperator(_?: IStringKeyMap): Promise<boolean> {
    return false
  }

  async deleteOperator(_?: IStringKeyMap): Promise<boolean> {
    return false
  }

  async getBucketAclPolicy(_?: IStringKeyMap): Promise<IStringKeyMap | IManageError> {
    return {}
  }

  async setBucketAclPolicy(param?: IStringKeyMap): Promise<boolean> {
    if (this.currentPicBedConfig.picBedName !== 'qiniu') return false
    return this.executeWithClient(['qiniu'], 'setBucketAclPolicy', client => client.setBucketAclPolicy(param!), false)
  }

  async getBucketListRecursively(param?: IStringKeyMap): Promise<IStringKeyMap | IManageError> {
    return this.executeListing(param, 'download', 'getBucketListRecursively', true)
  }

  /**
   * 后台更新bucket文件列表
   * @param param
   * @returns
   */
  async getBucketListBackstage(param?: IStringKeyMap): Promise<IStringKeyMap | IManageError> {
    return this.executeListing(param, 'files', 'getBucketListBackstage', true)
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
  async getBucketFileList(param?: IStringKeyMap): Promise<IStringKeyMap | IManageError> {
    return this.executeListing(param, 'files', 'getBucketFileList')
  }

  async deleteBucketFile(param?: IStringKeyMap): Promise<boolean> {
    return this.executeWithClient(
      this.ALL_CLIENTS,
      'deleteBucketFile',
      client => client.deleteBucketFile(param!),
      false,
    )
  }

  async deleteBucketFolder(param?: IStringKeyMap): Promise<boolean> {
    return this.executeWithClient(
      this.FOLDER_SUPPORT_CLIENTS,
      'deleteBucketFolder',
      client => client.deleteBucketFolder(param!),
      false,
    )
  }

  async renameBucketFile(param?: IStringKeyMap): Promise<boolean> {
    const supportedClients = ['tcyun', 'aliyun', 'qiniu', 'upyun', 's3plist', 'webdavplist', 'local', 'sftp']
    return this.executeWithClient(
      supportedClients,
      'renameBucketFile',
      client => client.renameBucketFile(param!),
      false,
    )
  }

  async downloadBucketFile(param?: IStringKeyMap): Promise<boolean> {
    return this.executeWithClient(
      this.ALL_CLIENTS,
      'downloadBucketFile',
      client => client.downloadBucketFile(param!),
      false,
    )
  }

  async copyMoveBucketFile(_?: IStringKeyMap): Promise<boolean> {
    return false
  }

  async createBucketFolder(param?: IStringKeyMap): Promise<boolean> {
    return this.executeWithClient(
      this.FOLDER_SUPPORT_CLIENTS,
      'createBucketFolder',
      client => client.createBucketFolder(param!),
      false,
    )
  }

  async uploadBucketFile(param?: IStringKeyMap): Promise<boolean> {
    return this.executeWithClient(
      this.ALL_CLIENTS,
      'uploadBucketFile',
      client => client.uploadBucketFile(param!),
      false,
    )
  }

  async getPreSignedUrl(param?: IStringKeyMap): Promise<string> {
    const supportedClients = ['tcyun', 'aliyun', 'qiniu', 'github', 's3plist', 'webdavplist']
    return this.executeWithClient(
      supportedClients,
      'getPreSignedUrl',
      client => client.getPreSignedUrl(param!),
      'error',
    )
  }
}
