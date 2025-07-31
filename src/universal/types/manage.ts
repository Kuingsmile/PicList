import { ILogger } from 'piclist/dist/types'

import { commonTaskStatus, downloadTaskSpecialStatus, uploadTaskSpecialStatus } from './enum'
import { IStringKeyMap } from './types'

// common type
export type Undefinable<T> = T | undefined

export interface IManageError extends Error {
  code?: number
  param?: string
  stack?: string
  picbed?: string
}

export type IPicBedMangeConfig = IStringKeyMap

export interface IManageApiType {
  /**
   * logger
   */
  logger: ILogger
  /**
   * congif path
   */
  configPath: string
  /**
   * basedir
   */
  baseDir: string
  /**
   * current picBed name
   */
  currentPicBed: string
  /**
   * current picBed config
   */
  currentPicBedConfig: IPicBedMangeConfig
  /**
   * get manage config
   */
  getConfig: <T>(name?: string) => T
  /**
   * save manage config to configPath
   */
  saveConfig: (config: IStringKeyMap) => void
  /**
   * remove some [propName] in config[key] && save config to configPath
   */
  removeConfig: (key: string, propName: string) => void
  /**
   * set manage config to ctx && will not save to configPath
   */
  setConfig: (config: IStringKeyMap) => void
  /**
   * unset manage config to ctx && will not save to configPath
   */
  unsetConfig: (key: string, propName: string) => void
  /**
   * get bucket list
   */
  getBucketListRecursively: (param?: IStringKeyMap) => Promise<any | IManageError>
  /**
   * get bucket list
   */
  getBucketListBackstage: (param?: IStringKeyMap) => Promise<any | IManageError>
  /**
   * get bucket list
   */
  getBucketList: (param?: IStringKeyMap) => Promise<any | IManageError>
  getBucketDomain: (param: IStringKeyMap) => Promise<any>
  /**
   * get bucket info
   */
  getBucketInfo: (param?: IStringKeyMap) => Promise<IStringKeyMap | IManageError>
  /**
   * create bucket
   */
  createBucket: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * delete bucket
   */
  deleteBucket: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * get Operator list
   * specific for upyun
   */
  getOperatorList: (param?: IStringKeyMap) => Promise<string[] | IManageError>
  /**
   * add Operator
   * specific for upyun
   */
  addOperator: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * delete Operator
   * specific for upyun
   */
  deleteOperator: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * get bucket ACL policy
   */
  getBucketAclPolicy: (param?: IStringKeyMap) => Promise<IStringKeyMap | IManageError>
  /**
   * set bucket ACL policy
   */
  setBucketAclPolicy: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * get bucket file list
   */
  getBucketFileList: (param?: IStringKeyMap) => Promise<IStringKeyMap | IManageError>
  /**
   * delete bucket file
   */
  deleteBucketFile: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * delete folder
   */
  deleteBucketFolder: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * rename bucket file
   */
  renameBucketFile: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * download bucket file
   */
  downloadBucketFile: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * copy or move between buckets
   */
  copyMoveBucketFile: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * create folder
   */
  createBucketFolder: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * upload file
   */
  uploadBucketFile: (param?: IStringKeyMap) => Promise<boolean>
  /**
   * get presigned url
   */
  getPreSignedUrl: (param?: IStringKeyMap) => Promise<string>
}

/** PicList 存储管理功能配置文件类型定义 */
export interface IManageConfigType {
  picBed: {
    [others: string]: any
  }
  settings: {
    [others: string]: any
  }
  [others: string]: any
}

type uploadTaskStatus = commonTaskStatus | uploadTaskSpecialStatus
type downloadTaskStatus = commonTaskStatus | downloadTaskSpecialStatus

export interface IUploadTask {
  id: string
  progress: number
  status: uploadTaskStatus
  sourceFilePath: string
  sourceFileName: string
  targetFilePath: string
  targetFileBucket?: string
  response?: any
  cancelToken?: string
  timeConsuming?: number
  alias?: string
  [other: string]: any
}

export interface IDownloadTask {
  id: string
  progress: number
  status: downloadTaskStatus
  sourceFileUrl?: string
  sourceFileName?: string
  sourceConfig?: IStringKeyMap
  targetFilePath?: string
  response?: any
  cancelToken?: string
  timeConsuming?: number
  reseumConfig?: IStringKeyMap
  alias?: string
  [other: string]: any
}
