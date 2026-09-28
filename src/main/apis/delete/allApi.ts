interface DeleteApi {
  delete(config: IStringKeyMap): Promise<boolean>
}

const apiMap: Record<string, () => Promise<{ default: DeleteApi }>> = {
  alist: () => import('~/apis/delete/alist'),
  alistplist: () => import('~/apis/delete/alistplist'),
  aliyun: () => import('~/apis/delete/aliyun'),
  'aws-s3': () => import('~/apis/delete/awss3'),
  'aws-s3-plist': () => import('~/apis/delete/awss3'),
  dogecloud: () => import('~/apis/delete/dogecloud'),
  github: () => import('~/apis/delete/github'),
  'huaweicloud-uploader': () => import('~/apis/delete/huaweiyun'),
  imgur: () => import('~/apis/delete/imgur'),
  local: () => import('~/apis/delete/local'),
  lskyplist: () => import('~/apis/delete/lskyplist'),
  piclist: () => import('~/apis/delete/piclist'),
  qiniu: () => import('~/apis/delete/qiniu'),
  sftpplist: () => import('~/apis/delete/sftpplist'),
  smms: () => import('~/apis/delete/smms'),
  tcyun: () => import('~/apis/delete/tcyun'),
  upyun: () => import('~/apis/delete/upyun'),
  webdavplist: () => import('~/apis/delete/webdav'),
}

export default class ALLApi {
  static async delete(configMap: IStringKeyMap): Promise<boolean> {
    const loadApi = Object.hasOwn(apiMap, configMap.type) ? apiMap[configMap.type] : undefined
    if (!loadApi) return false
    const { default: api } = await loadApi()
    return await api.delete(configMap)
  }
}
