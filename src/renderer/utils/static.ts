export const RELEASE_URL = 'https://api.github.com/repos/Kuingsmile/PicList/releases'
export const RELEASE_URL_BACKUP = 'https://release.piclist.cn'

export const cancelDownloadLoadingFileList = 'cancelDownloadLoadingFileList'
export const refreshDownloadFileTransferList = 'refreshDownloadFileTransferList'

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
    advancedpiclist: 'https://piclist.cn/configure.html#%E9%AB%98%E7%BA%A7%E8%87%AA%E5%AE%9A%E4%B9%89',
    aliyun: 'https://piclist.cn/configure.html#%E9%98%BF%E9%87%8C%E4%BA%91oss',
    alistplist: 'https://piclist.cn/configure.html#alist',
    'aws-s3': 'https://piclist.cn/configure.html#%E5%86%85%E7%BD%AEaws-s3',
    'aws-s3-plist': 'https://piclist.cn/configure.html#%E5%86%85%E7%BD%AEaws-s3',
    github: 'https://piclist.cn/configure.html#github%E5%9B%BE%E5%BA%8A',
    githubPlus: 'https://piclist.cn/configure.html#github%E5%9B%BE%E5%BA%8A',
    imgur: 'https://piclist.cn/configure.html#imgur',
    lankong: 'https://github.com/hellodk34/picgo-plugin-lankong',
    local: 'https://piclist.cn/configure.html#%E6%9C%AC%E5%9C%B0%E5%9B%BE%E5%BA%8A',
    lskyplist: 'https://piclist.cn/configure.html#%E5%85%B0%E7%A9%BA%E5%9B%BE%E5%BA%8A',
    tcyun: 'https://piclist.cn/configure.html#%E8%85%BE%E8%AE%AF%E4%BA%91cos',
    piclist: 'https://piclist.cn/configure.html#piclist',
    qiniu: 'https://piclist.cn/configure.html#%E4%B8%83%E7%89%9B%E4%BA%91',
    sftpplist: 'https://piclist.cn/configure.html#%E5%86%85%E7%BD%AEsftp',
    smms: 'https://piclist.cn/configure.html#sm-ms',
    upyun: 'https://piclist.cn/configure.html#%E5%8F%88%E6%8B%8D%E4%BA%91',
    webdavplist: 'https://piclist.cn/configure.html#webdav',
  },
  en: {
    advancedpiclist: 'https://piclist.cn/en/configure.html#advanced',
    aliyun: 'https://piclist.cn/en/configure.html#alibaba-cloud',
    alistplist: 'https://piclist.cn/en/configure.html#alist',
    'aws-s3': 'https://piclist.cn/en/configure.html#built-in-aws-s3',
    'aws-s3-plist': 'https://piclist.cn/en/configure.html#built-in-aws-s3',
    github: 'https://piclist.cn/en/configure.html#github',
    githubPlus: 'https://piclist.cn/en/configure.html#github',
    imgur: 'https://piclist.cn/en/configure.html#imgur',
    lankong: 'https://github.com/hellodk34/picgo-plugin-lankong',
    local: 'https://piclist.cn/en/configure.html#local-image-hosting',
    lskyplist: 'https://piclist.cn/en/configure.html#lsky-pro',
    tcyun: 'https://piclist.cn/en/configure.html#tencent-cloud-cos',
    piclist: 'https://piclist.cn/en/configure.html#piclist',
    qiniu: 'https://piclist.cn/en/configure.html#qiniu-cloud',
    sftpplist: 'https://piclist.cn/en/configure.html#built-in-sftp',
    smms: 'https://piclist.cn/en/configure.html#sm-ms',
    upyun: 'https://piclist.cn/en/configure.html#upyun',
    webdavplist: 'https://piclist.cn/en/configure.html#webdav',
  },
}

export const defaultScriptTemplate = `
// ctx 为 核心PicList实例, extra为额外参数, 其中extra.galleryItem为当前删除的相册对象
// 可用额外API: axios, crypto, fs, path, os, setTimeout, setInterval, clearTimeout, clearInterval, base64Decode, base64Encode
// 图床上传脚本必须返回 ctx 对象, 其它脚本可根据需求返回任意数据

async function main(ctx, extra) {
  // 在这里编写你的脚本代码
  return ctx
}
`

export const defaultScriptTemplateEn = `
// ctx is the core PicList instance, extra is additional parameters, among which extra.galleryItem is the currently deleted album object
// Available additional APIs: axios, crypto, fs, path, os, setTimeout, setInterval, clearTimeout, clearInterval, base64Decode, base64Encode
// The image bed upload script must return the ctx object, other scripts can return any data as needed

async function main(ctx, extra) {
  // Write your script code here
  return ctx
}
`
