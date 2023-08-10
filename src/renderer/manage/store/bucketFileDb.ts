import Dexie, { Table } from 'dexie'

/*
  * create a database for bucket file cache
  *database name: bucketFileDb
  *structure:
  * - table: picBedName
  * - key: alias-bucketName-prefix
  * - value: from fullList
  * - primaryKey: key
*/

export interface IFileCache {
  key: string,
  value: any
}

/**
 * new picbed will add a plist suffix to distinguish from picgo
 */
export class FileCacheDb extends Dexie {
  aliyun: Table<IFileCache, string>
  github: Table<IFileCache, string>
  imgur: Table<IFileCache, string>
  local: Table<IFileCache, string>
  tcyun: Table<IFileCache, string>
  qiniu: Table<IFileCache, string>
  smms: Table<IFileCache, string>
  s3plist: Table<IFileCache, string>
  sftpplist: Table<IFileCache, string>
  upyun: Table<IFileCache, string>
  webdavplist: Table<IFileCache, string>

  constructor () {
    super('bucketFileDb')
    const tableNames = ['aliyun', 'github', 'imgur', 'local', 'qiniu', 's3plist', 'sftpplist', 'smms', 'tcyun', 'upyun', 'webdavplist']

    const tableNamesMap = tableNames.reduce((acc, cur) => {
      acc[cur] = '&key, value'
      return acc
    }, {} as IStringKeyMap)
    this.version(4).stores(tableNamesMap)
    this.aliyun = this.table('aliyun')
    this.github = this.table('github')
    this.imgur = this.table('imgur')
    this.local = this.table('local')
    this.qiniu = this.table('qiniu')
    this.tcyun = this.table('tcyun')
    this.s3plist = this.table('s3plist')
    this.sftpplist = this.table('sftpplist')
    this.smms = this.table('smms')
    this.upyun = this.table('upyun')
    this.webdavplist = this.table('webdavplist')
  }
}

export const fileCacheDbInstance = new FileCacheDb()
