import { ILogger } from "piclist/dist/types";

// common type
type Undefinable<T> = T | undefined;

declare interface ManageError extends Error {
  code?: number;
  param?: string;
  stack?: string;
  picbed?: string;
}

type PicBedMangeConfig = IStringKeyMap;

interface PicBedManageConfigMap {
  [key: string]: PicBedMangeConfig;
}

interface ManageApiType {
  /**
   * logger
   */
  logger: ILogger;
  /**
   * congif path
   */
  configPath: string;
  /**
   * basedir
   */
  baseDir: string;
  /**
   * current picBed name
   */
  currentPicBed: string;
  /**
   * current picBed config
   */
  currentPicBedConfig: PicBedMangeConfig;
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
  getBucketListRecursively: (
    param?: IStringKeyMap
  ) => Promise<any | ManageError>;
  /**
   * get bucket list
   */
  getBucketListBackstage: (
    param?: IStringKeyMap
  ) => Promise<any | ManageError>;
  /**
   * get bucket list
   */
  getBucketList: (
    param?: IStringKeyMap
  ) => Promise<any | ManageError>;
  getBucketDomain: (
    param: IStringKeyMap
  ) => Promise<any>;
  /**
   * get bucket info
   */
  getBucketInfo: (
    param?: IStringKeyMap
  ) => Promise<IStringKeyMap | ManageError>;
  /**
   * create bucket
   */
  createBucket: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * delete bucket
   */
  deleteBucket: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * get Operator list
   * specific for upyun
   */
  getOperatorList: (
    param?: IStringKeyMap
  ) => Promise<string[] | ManageError>;
  /**
   * add Operator
   * specific for upyun
   */
  addOperator: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * delete Operator
   * specific for upyun
   */
  deleteOperator: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * get bucket ACL policy
   */
  getBucketAclPolicy: (
    param?: IStringKeyMap
  ) => Promise<IStringKeyMap | ManageError>;
  /**
   * set bucket ACL policy
   */
  setBucketAclPolicy: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * get bucket file list
   */
  getBucketFileList: (
    param?: IStringKeyMap
  ) => Promise<IStringKeyMap | ManageError>;
  /**
   * delete bucket file
   */
  deleteBucketFile: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * delete folder
   */
  deleteBucketFolder: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * rename bucket file
   */
  renameBucketFile: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * download bucket file
   */
  downloadBucketFile: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * copy or move between buckets
   */
  copyMoveBucketFile: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * create folder
   */
  createBucketFolder: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
  /**
   * upload file
   */
  uploadBucketFile: (
    param?: IStringKeyMap
  ) => Promise<boolean>;
    /**
   * get presigned url
   */
  getPreSignedUrl: (
    param?: IStringKeyMap
  ) => Promise<string>;
}

/** PicList 存储管理功能配置文件类型定义 */
interface ManageConfigType {
  picBed: {
    [others: string]: any;
  };
  settings: {
    [others: string]: any;
  };
  [others: string]: any;
}
