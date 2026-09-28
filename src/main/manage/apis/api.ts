// Node caches each module after its first use. Opening the upload page should not
// parse every storage SDK, and a local account should not load remote providers.
export function lazyClient<T extends new (...args: any[]) => any>(load: () => Promise<{ default: T }>) {
  return async (...args: ConstructorParameters<T>): Promise<InstanceType<T>> => {
    const { default: Client } = await load()
    return new Client(...args)
  }
}

export default {
  AliyunApi: lazyClient(() => import('~/manage/apis/aliyun')),
  GithubApi: lazyClient(() => import('~/manage/apis/github')),
  ImgurApi: lazyClient(() => import('~/manage/apis/imgur')),
  LocalApi: lazyClient(() => import('~/manage/apis/local')),
  QiniuApi: lazyClient(() => import('~/manage/apis/qiniu')),
  S3plistApi: lazyClient(() => import('~/manage/apis/s3plist')),
  SftpApi: lazyClient(() => import('~/manage/apis/sftp')),
  SmmsApi: lazyClient(() => import('~/manage/apis/smms')),
  TcyunApi: lazyClient(() => import('~/manage/apis/tcyun')),
  UpyunApi: lazyClient(() => import('~/manage/apis/upyun')),
  WebdavplistApi: lazyClient(() => import('~/manage/apis/webdavplist')),
}
