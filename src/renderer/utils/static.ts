export const RELEASE_URL = 'https://api.github.com/repos/Kuingsmile/PicList/releases'
export const RELEASE_URL_BACKUP = 'https://release.piclist.cn'
export const GITHUB_URL = 'https://github.com/Kuingsmile/PicList'

export const picBedsCanbeDeleted = [
  'aliyun',
  'alist',
  'alistplist',
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
  'webdavplist',
]

export const picBedManualUrlList: IStringKeyMap = {
  zh_cn: {
    advancedpiclist: 'https://piclist.cn/providers/services#advanced',
    aliyun: 'https://piclist.cn/providers/services#aliyun',
    alistplist: 'https://piclist.cn/providers/services#alist',
    'aws-s3': 'https://piclist.cn/providers/s3',
    'aws-s3-plist': 'https://piclist.cn/providers/s3',
    github: 'https://piclist.cn/providers/github',
    githubPlus: 'https://piclist.cn/providers/github',
    imgur: 'https://piclist.cn/providers/services#imgur',
    lankong: 'https://github.com/hellodk34/picgo-plugin-lankong',
    local: 'https://piclist.cn/providers/files#local',
    lskyplist: 'https://piclist.cn/providers/services#lsky',
    tcyun: 'https://piclist.cn/providers/services#tcyun',
    piclist: 'https://piclist.cn/providers/services#piclist-server',
    qiniu: 'https://piclist.cn/providers/services#qiniu',
    sftpplist: 'https://piclist.cn/providers/files#sftp',
    smms: 'https://piclist.cn/providers/services#smms',
    upyun: 'https://piclist.cn/providers/services#upyun',
    webdavplist: 'https://piclist.cn/providers/files#webdav',
  },
  en: {
    advancedpiclist: 'https://piclist.cn/en/providers/services#advanced',
    aliyun: 'https://piclist.cn/en/providers/services#aliyun',
    alistplist: 'https://piclist.cn/en/providers/services#alist',
    'aws-s3': 'https://piclist.cn/en/providers/s3',
    'aws-s3-plist': 'https://piclist.cn/en/providers/s3',
    github: 'https://piclist.cn/en/providers/github',
    githubPlus: 'https://piclist.cn/en/providers/github',
    imgur: 'https://piclist.cn/en/providers/services#imgur',
    lankong: 'https://github.com/hellodk34/picgo-plugin-lankong',
    local: 'https://piclist.cn/en/providers/files#local',
    lskyplist: 'https://piclist.cn/en/providers/services#lsky',
    tcyun: 'https://piclist.cn/en/providers/services#tcyun',
    piclist: 'https://piclist.cn/en/providers/services#piclist-server',
    qiniu: 'https://piclist.cn/en/providers/services#qiniu',
    sftpplist: 'https://piclist.cn/en/providers/files#sftp',
    smms: 'https://piclist.cn/en/providers/services#smms',
    upyun: 'https://piclist.cn/en/providers/services#upyun',
    webdavplist: 'https://piclist.cn/en/providers/files#webdav',
  },
}

export const defaultScriptTemplate = `
// ctx 为 核心PicList实例, extra为额外参数, 其中extra.galleryItem为当前删除的相册对象
// env 变量中有脚本目录下的 .env 文件内容
// 可用额外API: axios, crypto, fs, path, os, setTimeout, setInterval, clearTimeout, clearInterval, base64Decode, base64Encode
// 使用console.log或ctx.log输出的信息在软件日志文件piclist.log中可以查询到

async function main(ctx, extra) {
  // 在这里编写你的脚本代码
  return ctx
}
`

export const defaultScriptTemplateEn = `
// ctx is the core PicList instance, extra is additional parameters, among which extra.galleryItem is the currently deleted album object
// env variable contains the contents of the .env file in the script directory
// Available additional APIs: axios, crypto, fs, path, os, setTimeout, setInterval, clearTimeout, clearInterval, base64Decode, base64Encode
// Use console.log or ctx.log to output information that can be found in the software log file piclist.log

async function main(ctx, extra) {
  // Write your script code here
  return ctx
}
`
