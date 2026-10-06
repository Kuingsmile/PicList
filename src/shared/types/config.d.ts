interface IServerConfig {
  port: number | string
  host: string
  enable: boolean
}

// Sync

interface ISyncConfig {
  type: string
  file?: string
  username: string
  repo: string
  branch: string
  token: string
  endpoint?: string
  proxy?: string
  interval?: number
  // WebDAV specific fields
  webdavEndpoint?: string
  webdavUsername?: string
  webdavPassword?: string
  webdavAuthType?: 'basic' | 'digest'
  webdavSslEnabled?: boolean
  webdavSavePath?: string
}

interface IPicBedType {
  type: string
  name: string
  visible: boolean
}

// Config Settings
type IShortKeyConfig = import('../shortcuts').ShortcutConfig

type IShortKeyConfigs = Record<string, IShortKeyConfig>

interface ILocalConfig {
  path: string
  customUrl?: string
  webPath?: string
}

interface IAliYunConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  area: string
  path?: string
  webPath?: string
  customUrl?: string
  options?: string
}

interface IGitHubConfig {
  repo: string
  token: string
  path?: string
  webPath?: string
  customUrl?: string
  branch: string
}

interface IImgurConfig {
  clientId?: string
  proxy?: string
  username?: string
  accessToken?: string
  album?: string
}

interface IQiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  url: string
  area: 'z0' | 'z1' | 'z2' | 'na0' | 'as0' | string
  options?: string
  path?: string
}

interface ISMMSConfig {
  token: string
}

interface ITcYunConfig {
  secretId: string
  secretKey: string
  bucket: string
  appId: string
  endpoint: string
  area: string
  path?: string
  webPath?: string
  customUrl?: string
  version: 'v4' | 'v5'
  options?: string
  slim?: boolean
}

interface IUpYunConfig {
  bucket: string
  operator: string
  password: string
  options?: string
  path?: string
  url: string
  antiLeechToken?: string
  expireTime?: number
  endpoint?: string
}

interface IWebdavPlistConfig {
  host: string
  sslEnabled: boolean
  username: string
  password: string
  path?: string
  webpath?: string
  customUrl?: string
  authType: string
  options?: string
}

interface ISftpPlistConfig {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string
  passphrase?: string
  uploadPath?: string
  customUrl?: string
  webPath?: string
  fileUser?: string
  fileMode?: string
  dirMode?: string
}

interface ILskyConfig {
  version: string
  host: string
  token: string
  strategyId: string
  albumId: string
  permission: IStringKeyMap
}

interface IAwsS3PListUserConfig {
  accessKeyID: string
  secretAccessKey: string
  bucketName: string
  uploadPath: string
  region?: string
  endpoint?: string
  proxy?: string
  urlPrefix?: string
  pathStyleAccess?: boolean
  rejectUnauthorized?: boolean
  acl?: string
  disableBucketPrefixToURL?: boolean | string
}

interface IUploaderListItemMetaInfo {
  _id: string
  _configName: string
  _updatedAt: number
  _createdAt: number
}

type IUploaderConfig = Record<string, IUploaderConfigItem>

interface IUploaderConfigItem {
  configList: IUploaderConfigListItem[]
  defaultId: string
}

type IUploaderConfigListItem = IStringKeyMap & IUploaderListItemMetaInfo

interface IBuildInListItem {
  id: string
  compress?: Partial<import('piclist').IBuildInCompressOptionsTreated>
  watermark?: Partial<import('piclist').IBuildInWaterMarkOptionsTreated>
  skipProcess?: import('piclist').IBuildInSkipProcessOptions
  rename?: {
    enable?: boolean
    format?: string
  }
  // settings.autoRename
  autoRename?: boolean
  // settings.rename
  manualRename?: boolean
}

interface IFavoritePicbedItem {
  id: string
  type: string
  configName: string
}
