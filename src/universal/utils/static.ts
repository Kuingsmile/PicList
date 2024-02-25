import { C1N } from '../events/constants'

export const CLIPBOARD_IMAGE_FOLDER = 'piclist-clipboard-images'
export const RELEASE_URL = 'https://api.github.com/repos/Kuingsmile/PicList/releases'
export const RELEASE_URL_BACKUP = 'https://release.piclist.cn'
export const STABLE_RELEASE_URL = 'https://github.com/Kuingsmile/PicList/releases/latest'
export const C1 = Buffer.from(C1N, 'base64').toString()

export const picBedsCanbeDeleted = [
  'aliyun',
  'alist',
  'aws-s3',
  'aws-s3-plist',
  'dogecloud',
  'github',
  'huaweicloud-uploader',
  'imgur',
  'local',
  'lskyplist',
  'piclist',
  'qiniu',
  'sftpplist',
  'smms',
  'tcyun',
  'upyun',
  'webdavplist'
]
