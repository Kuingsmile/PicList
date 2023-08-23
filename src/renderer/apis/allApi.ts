import AliyunApi from './aliyun'
import AwsS3Api from './awss3'
import GithubApi from './github'
import ImgurApi from './imgur'
import LocalApi from './local'
import QiniuApi from './qiniu'
import SftpPlistApi from './sftpplist'
import SmmsApi from './smms'
import TcyunApi from './tcyun'
import UpyunApi from './upyun'
import WebdavApi from './webdav'
import DogeCloudApi from './dogecloud'
import HuaweicloudApi from './huaweiyun'
import AlistApi from './alist'

const apiMap: IStringKeyMap = {
  aliyun: AliyunApi,
  'aws-s3': AwsS3Api,
  github: GithubApi,
  imgur: ImgurApi,
  local: LocalApi,
  qiniu: QiniuApi,
  sftpplist: SftpPlistApi,
  smms: SmmsApi,
  tcyun: TcyunApi,
  upyun: UpyunApi,
  webdavplist: WebdavApi,
  dogecloud: DogeCloudApi,
  'huaweicloud-uploader': HuaweicloudApi,
  alist: AlistApi
}

export default class ALLApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const api = apiMap[configMap.type]
    return api ? await api.delete(configMap) : false
  }
}
