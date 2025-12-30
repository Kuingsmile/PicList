import type { IStringKeyMap } from '#/types/types'
import AlistApi from '~/apis/delete/alist'
import AlistplistApi from '~/apis/delete/alistplist'
import AliyunApi from '~/apis/delete/aliyun'
import AwsS3Api from '~/apis/delete/awss3'
import DogeCloudApi from '~/apis/delete/dogecloud'
import GithubApi from '~/apis/delete/github'
import HuaweicloudApi from '~/apis/delete/huaweiyun'
import ImgurApi from '~/apis/delete/imgur'
import LocalApi from '~/apis/delete/local'
import LskyplistApi from '~/apis/delete/lskyplist'
import PiclistApi from '~/apis/delete/piclist'
import QiniuApi from '~/apis/delete/qiniu'
import SftpPlistApi from '~/apis/delete/sftpplist'
import SmmsApi from '~/apis/delete/smms'
import TcyunApi from '~/apis/delete/tcyun'
import UpyunApi from '~/apis/delete/upyun'
import WebdavApi from '~/apis/delete/webdav'

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
  webdavplist: WebdavApi,
}

export default class ALLApi {
  static async delete(configMap: IStringKeyMap): Promise<boolean> {
    const api = apiMap[configMap.type]
    return api ? await api.delete(configMap) : false
  }
}
