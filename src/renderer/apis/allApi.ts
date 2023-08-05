import SmmsApi from './smms'
import TcyunApi from './tcyun'
import AliyunApi from './aliyun'
import QiniuApi from './qiniu'
import ImgurApi from './imgur'
import GithubApi from './github'
import UpyunApi from './upyun'
import AwsS3Api from './awss3'
import WebdavApi from './webdav'
import LocalApi from './local'
import SftpPlistApi from './sftpplist'

const apiMap: IStringKeyMap = {
  smms: SmmsApi,
  tcyun: TcyunApi,
  aliyun: AliyunApi,
  qiniu: QiniuApi,
  imgur: ImgurApi,
  github: GithubApi,
  upyun: UpyunApi,
  'aws-s3': AwsS3Api,
  webdavplist: WebdavApi,
  local: LocalApi,
  sftpplist: SftpPlistApi
}

export default class ALLApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const api = apiMap[configMap.type]
    if (api) {
      return await api.delete(configMap)
    }
    return false
  }
}
