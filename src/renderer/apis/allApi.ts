import SmmsApi from './smms'
import TcyunApi from './tcyun'
import AliyunApi from './aliyun'
import QiniuApi from './qiniu'
import ImgurApi from './imgur'
import GithubApi from './github'
import UpyunApi from './upyun'
import AwsS3Api from './awss3'

const apiMap: IStringKeyMap = {
  smms: SmmsApi,
  tcyun: TcyunApi,
  aliyun: AliyunApi,
  qiniu: QiniuApi,
  imgur: ImgurApi,
  github: GithubApi,
  upyun: UpyunApi,
  'aws-s3': AwsS3Api
}

export default class ALLApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    if (apiMap[configMap.type] !== undefined) {
      return await apiMap[configMap.type].delete(configMap)
    } else {
      return false
    }
  }
}
