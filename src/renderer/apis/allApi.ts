import AlistApi from '@/apis/alist'
import AlistplistApi from '@/apis/alistplist'
import AliyunApi from '@/apis/aliyun'
import AwsS3Api from '@/apis/awss3'
import DogeCloudApi from '@/apis/dogecloud'
import GithubApi from '@/apis/github'
import HuaweicloudApi from '@/apis/huaweiyun'
import ImgurApi from '@/apis/imgur'
import LocalApi from '@/apis/local'
import LskyplistApi from '@/apis/lskyplist'
import PiclistApi from '@/apis/piclist'
import QiniuApi from '@/apis/qiniu'
import SftpPlistApi from '@/apis/sftpplist'
import SmmsApi from '@/apis/smms'
import TcyunApi from '@/apis/tcyun'
import UpyunApi from '@/apis/upyun'
import WebdavApi from '@/apis/webdav'
import { IStringKeyMap } from '#/types/types'

const apiMap: IStringKeyMap = {
  alist: AlistApi,
  alistplist: AlistplistApi,
  aliyun: AliyunApi,
  'aws-s3': AwsS3Api,
  'aws-s3-plist': AwsS3Api,
  dogecloud: DogeCloudApi,
  github: GithubApi,
  'huaweicloud-uploader': HuaweicloudApi,
  imgur: ImgurApi,
  local: LocalApi,
  lskyplist: LskyplistApi,
  piclist: PiclistApi,
  qiniu: QiniuApi,
  sftpplist: SftpPlistApi,
  smms: SmmsApi,
  tcyun: TcyunApi,
  upyun: UpyunApi,
  webdavplist: WebdavApi
}

export default class ALLApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const api = apiMap[configMap.type]
    return api ? await api.delete(configMap) : false
  }
}
