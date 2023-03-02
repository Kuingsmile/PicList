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
  tcyun: Table<IFileCache, string>
  aliyun: Table<IFileCache, string>
  qiniu: Table<IFileCache, string>
  github: Table<IFileCache, string>
  smms: Table<IFileCache, string>
  upyun: Table<IFileCache, string>
  imgur: Table<IFileCache, string>
  s3plist: Table<IFileCache, string>
  webdavplist: Table<IFileCache, string>
  localplist: Table<IFileCache, string>

  constructor () {
    super('bucketFileDb')
    const tableNames = ['tcyun', 'aliyun', 'qiniu', 'github', 'smms', 'upyun', 'imgur', 's3plist', 'webdavplist', 'localplist']
    const tableNamesMap = tableNames.reduce((acc, cur) => {
      acc[cur] = '&key, value'
      return acc
    }, {} as IStringKeyMap)
    this.version(3).stores(tableNamesMap)
    this.tcyun = this.table('tcyun')
    this.aliyun = this.table('aliyun')
    this.qiniu = this.table('qiniu')
    this.github = this.table('github')
    this.smms = this.table('smms')
    this.upyun = this.table('upyun')
    this.imgur = this.table('imgur')
    this.s3plist = this.table('s3plist')
    this.webdavplist = this.table('webdavplist')
    this.localplist = this.table('localplist')
  }
}

export const fileCacheDbInstance = new FileCacheDb()
