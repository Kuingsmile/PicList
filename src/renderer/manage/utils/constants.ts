import { T as $T } from '@/i18n'

const defaultBaseRule = (name: string) => {
  return [
    {
      required: true,
      message: `${$T('MANAGE_CONSTANT_BASE_RULE')}${name}`,
      trigger: 'blur'
    }
  ]
}

const itemsPerPageRule = [
  {
    required: true,
    message: $T('MANAGE_CONSTANT_ITEMS_PAGE_RULE_MESSAGE_A'),
    trigger: 'blur'
  },
  {
    type: 'number',
    message: $T('MANAGE_CONSTANT_ITEMS_PAGE_RULE_MESSAGE_B'),
    trigger: 'change'
  },
  {
    validator: (_rule: any, value: any, callback: any) => {
      if (value < 20 || value > 1000) {
        callback(new Error($T('MANAGE_CONSTANT_ITEMS_PAGE_RULE_MESSAGE_C')))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }
]

const aliasRule = [
  {
    required: true,
    message: $T('MANAGE_CONSTANT_ALIAS_RULE_MESSAGE_A'),
    trigger: 'blur'
  },
  {
    validator: (_rule: any, value: any, callback: any) => {
      const reg = /^[\u4e00-\u9fff_a-zA-Z0-9-]+$/
      if (!reg.test(value)) {
        callback(new Error($T('MANAGE_CONSTANT_ALIAS_RULE_MESSAGE_B')))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }
]

const aliasTooltip = $T('MANAGE_CONSTANT_ALIAS_TOOLTIP')
const itemsPerPageTooltip = $T('MANAGE_CONSTANT_ITEMS_PAGE_TOOLTIP')
const pagingTooltip = $T('MANAGE_CONSTANT_PAGING_TOOLTIP')
const bucketNameTooltip = $T('MANAGE_CONSTANT_BUCKET_NAME_TOOLTIP')
const baseDirTooltip = $T('MANAGE_CONSTANT_BASE_DIR_TOOLTIP')
const isAutoCustomUrlTooltip = $T('MANAGE_CONSTANT_IS_AUTO_CUSTOM_URL_TOOLTIP')

export const supportedPicBedList: IStringKeyMap = {
  smms: {
    name: 'SM.MS',
    icon: 'smms',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_SMMS_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SMMS_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'smms-A',
        tooltip: aliasTooltip
      },
      token: {
        required: true,
        description: $T('MANAGE_CONSTANT_SMMS_TOKEN_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SMMS_TOKEN_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('token')
      },
      paging: {
        required: true,
        description: $T('MANAGE_CONSTANT_SMMS_PAGING_DESC'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip
      }
    },
    explain: $T('MANAGE_CONSTANT_SMMS_EXPLAIN'),
    options: ['alias', 'token', 'paging'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-6',
    referenceText: $T('MANAGE_CONSTANT_SMMS_REFER_TEXT')
  },
  qiniu: {
    name: $T('MANAGE_CONSTANT_QINIU_NAME'),
    icon: 'qiniu',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_QINIU_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_QINIU_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'qiniu-A',
        tooltip: aliasTooltip
      },
      accessKey: {
        required: true,
        description: $T('MANAGE_CONSTANT_QINIU_ACCESS_KEY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_QINIU_ACCESS_KEY_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('accessKey')
      },
      secretKey: {
        required: true,
        description: $T('MANAGE_CONSTANT_QINIU_SECRET_KEY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_QINIU_SECRET_KEY_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('secretKey')
      },
      bucketName: {
        required: false,
        description: $T('MANAGE_CONSTANT_QINIU_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_QINIU_BUCKET_PLACEHOLDER'),
        type: 'string',
        tooltip: bucketNameTooltip
      },
      baseDir: {
        required: false,
        description: $T('MANAGE_CONSTANT_QINIU_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_QINIU_BASE_DIR_PLACEHOLDER'),
        default: '/',
        type: 'string',
        tooltip: baseDirTooltip
      },
      isAutoCustomUrl: {
        required: true,
        description: $T('MANAGE_CONSTANT_QINIU_IS_AUTO_CUSTOM_URL_DESC'),
        default: true,
        type: 'boolean',
        tooltip: isAutoCustomUrlTooltip
      },
      paging: {
        required: true,
        description: $T('MANAGE_CONSTANT_QINIU_PAGING_DESC'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip
      },
      itemsPerPage: {
        required: true,
        description: $T('MANAGE_CONSTANT_QINIU_ITEMS_PAGE_DESC'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip
      }
    },
    explain: $T('MANAGE_CONSTANT_QINIU_EXPLAIN'),
    options: ['alias', 'accessKey', 'secretKey', 'bucketName', 'baseDir', 'isAutoCustomUrl', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-3',
    referenceText: $T('MANAGE_CONSTANT_QINIU_REFER_TEXT')
  },
  github: {
    name: 'GitHub',
    icon: 'github',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_GITHUB_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_GITHUB_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'github-A',
        tooltip: aliasTooltip
      },
      token: {
        required: true,
        description: $T('MANAGE_CONSTANT_GITHUB_TOKEN_DESC'),
        placeholder: $T('MANAGE_CONSTANT_GITHUB_TOKEN_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('token'),
        tooltip: $T('MANAGE_CONSTANT_GITHUB_TOKEN_TIPS')
      },
      githubUsername: {
        required: true,
        description: $T('MANAGE_CONSTANT_GITHUB_USER_DESC'),
        placeholder: $T('MANAGE_CONSTANT_GITHUB_USER_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule($T('MANAGE_CONSTANT_GITHUB_USER_RULE_MESSAGE'))
      },
      proxy: {
        required: false,
        description: $T('MANAGE_CONSTANT_GITHUB_PROXY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_GITHUB_PROXY_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_GITHUB_PROXY_TIPS')
      },
      paging: {
        required: true,
        description: $T('MANAGE_CONSTANT_GITHUB_PAGING_DESC'),
        default: false,
        type: 'boolean',
        tooltip: pagingTooltip
      },
      customUrl: {
        required: false,
        description: $T('MANAGE_CONSTANT_GITHUB_CUSTOM_URL_DESC'),
        placeholder: $T('MANAGE_CONSTANT_GITHUB_CUSTOM_URL_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_GITHUB_CUSTOM_URL_TIPS'),
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                const customUrlList = value.split(',')
                const customUrlValid = customUrlList.every((customUrl: string) => {
                  const reg = /^((https|http)?:\/\/)/
                  if (customUrl === '') {
                    return true
                  } else if (!reg.test(customUrl)) {
                    return false
                  }
                  return true
                })
                const isBracketsValid = customUrlList.every((customUrl: string) => {
                  const bracketPaired = (str: string) => {
                    const stack = []
                    for (let i = 0; i < str.length; i++) {
                      if (str[i] === '{') {
                        stack.push(str[i])
                      } else if (str[i] === '}') {
                        if (stack.length === 0) {
                          return false
                        }
                        stack.pop()
                      }
                    }
                    return stack.length === 0
                  }
                  if (customUrl === '') {
                    return true
                  } else if (!bracketPaired(customUrl)) {
                    return false
                  }
                  return true
                })
                if (!customUrlValid) {
                  callback(new Error($T('MANAGE_CONSTANT_GITHUB_CUSTOM_URL_RULE_MESSAGE_A')))
                } else if (!isBracketsValid) {
                  callback(new Error($T('MANAGE_CONSTANT_GITHUB_CUSTOM_URL_RULE_MESSAGE_B')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      }
    },
    explain: $T('MANAGE_CONSTANT_GITHUB_EXPLAIN'),
    options: ['alias', 'token', 'githubUsername', 'proxy', 'customUrl'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-9',
    referenceText: $T('MANAGE_CONSTANT_GITHUB_REFER_TEXT')
  },
  aliyun: {
    name: $T('MANAGE_CONSTANT_ALIYUN_NAME'),
    icon: 'aliyun',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_ALIYUN_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_ALIYUN_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'aliyun-A',
        tooltip: aliasTooltip
      },
      accessKeyId: {
        required: true,
        description: $T('MANAGE_CONSTANT_ALIYUN_ACCESS_KEY_ID_DESC'),
        placeholder: '请输入accessKeyId',
        type: 'string',
        rule: defaultBaseRule('accessKeyId')
      },
      accessKeySecret: {
        required: true,
        description: $T('MANAGE_CONSTANT_ALIYUN_ACCESS_KEY_SECRET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_ALIYUN_ACCESS_KEY_SECRET_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('accessKeySecret')
      },
      bucketName: {
        required: false,
        description: $T('MANAGE_CONSTANT_ALIYUN_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_ALIYUN_BUCKET_PLACEHOLDER'),
        type: 'string',
        tooltip: bucketNameTooltip
      },
      baseDir: {
        required: false,
        description: $T('MANAGE_CONSTANT_ALIYUN_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_ALIYUN_BASE_DIR_PLACEHOLDER'),
        type: 'string',
        default: '/',
        tooltip: baseDirTooltip
      },
      isAutoCustomUrl: {
        required: true,
        description: $T('MANAGE_CONSTANT_ALIYUN_IS_AUTO_CUSTOM_URL_DESC'),
        default: true,
        type: 'boolean',
        tooltip: isAutoCustomUrlTooltip
      },
      paging: {
        required: true,
        description: $T('MANAGE_CONSTANT_ALIYUN_PAGING_DESC'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip
      },
      itemsPerPage: {
        required: true,
        description: $T('MANAGE_CONSTANT_ALIYUN_ITEMS_PAGE_DESC'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip
      }
    },
    explain: $T('MANAGE_CONSTANT_ALIYUN_EXPLAIN'),
    options: ['alias', 'accessKeyId', 'accessKeySecret', 'bucketName', 'baseDir', 'isAutoCustomUrl', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-1',
    referenceText: $T('MANAGE_CONSTANT_ALIYUN_REFER_TEXT')
  },
  tcyun: {
    name: $T('MANAGE_CONSTANT_TENCENT_NAME'),
    icon: 'tcyun',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_TENCENT_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_TENCENT_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'tcyun-A',
        tooltip: aliasTooltip
      },
      secretId: {
        required: true,
        description: $T('MANAGE_CONSTANT_TENCENT_SECRET_ID_DESC'),
        placeholder: $T('MANAGE_CONSTANT_TENCENT_SECRET_ID_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('secretId')
      },
      secretKey: {
        required: true,
        description: $T('MANAGE_CONSTANT_TENCENT_SECRET_KEY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_TENCENT_SECRET_KEY_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('secretKey')
      },
      appId: {
        required: true,
        description: $T('MANAGE_CONSTANT_TENCENT_APPID_DESC'),
        placeholder: $T('MANAGE_CONSTANT_TENCENT_APPID_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('appId'),
        tooltip: $T('MANAGE_CONSTANT_TENCENT_APPID_TOOLTIP')
      },
      bucketName: {
        required: false,
        description: $T('MANAGE_CONSTANT_TENCENT_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_TENCENT_BUCKET_PLACEHOLDER'),
        type: 'string',
        tooltip: bucketNameTooltip
      },
      baseDir: {
        required: false,
        description: $T('MANAGE_CONSTANT_TENCENT_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_TENCENT_BASE_DIR_PLACEHOLDER'),
        type: 'string',
        default: '/',
        tooltip: baseDirTooltip
      },
      isAutoCustomUrl: {
        required: true,
        description: $T('MANAGE_CONSTANT_TENCENT_IS_AUTO_CUSTOM_URL_DESC'),
        default: true,
        type: 'boolean',
        tooltip: isAutoCustomUrlTooltip
      },
      paging: {
        required: true,
        description: $T('MANAGE_CONSTANT_TENCENT_PAGING_DESC'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip
      },
      itemsPerPage: {
        required: true,
        description: $T('MANAGE_CONSTANT_TENCENT_ITEMS_PAGE_DESC'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip
      }
    },
    explain: $T('MANAGE_CONSTANT_TENCENT_EXPLAIN'),
    options: ['alias', 'secretId', 'secretKey', 'appId', 'bucketName', 'baseDir', 'isAutoCustomUrl', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-2',
    referenceText: $T('MANAGE_CONSTANT_TENCENT_REFER_TEXT')
  },
  upyun: {
    name: $T('MANAGE_CONSTANT_UPYUN_NAME'),
    icon: 'upyun',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_UPYUN_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_UPYUN_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'upyun-A',
        tooltip: aliasTooltip
      },
      bucketName: {
        required: true,
        description: $T('MANAGE_CONSTANT_UPYUN_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_UPYUN_BUCKET_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('bucketName')
      },
      operator: {
        required: true,
        description: $T('MANAGE_CONSTANT_UPYUN_OPERATOR_NAME_DESC'),
        placeholder: $T('MANAGE_CONSTANT_UPYUN_OPERATOR_NAME_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule($T('MANAGE_CONSTANT_UPYUN_OPERATOR_NAME_RULE'))
      },
      password: {
        required: true,
        description: $T('MANAGE_CONSTANT_UPYUN_OPERATOR_PWD_DESC'),
        placeholder: $T('MANAGE_CONSTANT_UPYUN_OPERATOR_PWD_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule($T('MANAGE_CONSTANT_UPYUN_OPERATOR_PWD_RULE'))
      },
      baseDir: {
        required: false,
        description: $T('MANAGE_CONSTANT_UPYUN_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_UPYUN_BASE_DIR_PLACEHOLDER'),
        type: 'string',
        default: '/'
      },
      customUrl: {
        required: true,
        description: $T('MANAGE_CONSTANT_UPYUN_IS_AUTO_CUSTOM_URL_DESC'),
        placeholder: $T('MANAGE_CONSTANT_UPYUN_IS_AUTO_CUSTOM_URL_PLACEHOLDER'),
        type: 'string',
        rule: [
          {
            required: true,
            message: $T('MANAGE_CONSTANT_UPYUN_IS_AUTO_CUSTOM_URL_RULE_MESSAGE_A'),
            trigger: 'change'
          },
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                const customUrlList = value.split(',')
                const customUrlValid = customUrlList.every((customUrl: string) => {
                  const reg = /^((https|http)?:\/\/)/
                  if (customUrl === '') {
                    return true
                  } else if (!reg.test(customUrl)) {
                    return false
                  }
                  return true
                })
                if (!customUrlValid) {
                  callback(new Error($T('MANAGE_CONSTANT_UPYUN_IS_AUTO_CUSTOM_URL_RULE_MESSAGE_B')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      paging: {
        required: true,
        description: $T('MANAGE_CONSTANT_UPYUN_PAGING'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip
      },
      itemsPerPage: {
        required: true,
        description: $T('MANAGE_CONSTANT_UPYUN_ITEMS_PAGE'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip
      }
    },
    explain: $T('MANAGE_CONSTANT_UPYUN_EXPLAIN'),
    options: ['alias', 'bucketName', 'operator', 'password', 'baseDir', 'customUrl', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-4',
    referenceText: $T('MANAGE_CONSTANT_UPYUN_REFER_TEXT')
  },
  imgur: {
    name: $T('MANAGE_CONSTANT_IMGUR_NAME'),
    icon: 'imgur',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_IMGUR_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_IMGUR_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'imgur-A'
      },
      imgurUserName: {
        required: true,
        description: $T('MANAGE_CONSTANT_IMGUR_USERNAME_DESC'),
        placeholder: $T('MANAGE_CONSTANT_IMGUR_USERNAME_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('imgurUserName')
      },
      accessToken: {
        required: true,
        description: $T('MANAGE_CONSTANT_IMGUR_ACCESS_TOKEN_DESC'),
        placeholder: $T('MANAGE_CONSTANT_IMGUR_ACCESS_TOKEN_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('accessToken'),
        tooltip: $T('MANAGE_CONSTANT_IMGUR_ACCESS_TOKEN_TOOLTIP')
      },
      proxy: {
        required: false,
        description: $T('MANAGE_CONSTANT_IMGUR_PROXY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_IMGUR_PROXY_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_IMGUR_PROXY_TOOLTIP')
      }
    },
    explain: $T('MANAGE_CONSTANT_IMGUR_EXPLAIN'),
    options: ['alias', 'imgurUserName', 'accessToken', 'proxy'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=imgur%e5%9b%be%e5%ba%8a-1',
    referenceText: $T('MANAGE_CONSTANT_IMGUR_REFER_TEXT')
  },
  s3plist: {
    name: $T('MANAGE_CONSTANT_S3_NAME'),
    icon: 's3plist',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_S3_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 's3plist-A',
        tooltip: aliasTooltip
      },
      accessKeyId: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_ACCESS_KEY_ID_DESC'),
        placeholder: $T('MANAGE_CONSTANT_S3_ACCESS_KEY_ID_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('accessKeyId')
      },
      secretAccessKey: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_SECRET_ACCESS_KEY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_S3_SECRET_ACCESS_KEY_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('secretAccessKey')
      },
      endpoint: {
        required: false,
        description: $T('MANAGE_CONSTANT_S3_ENDPOINT_DESC'),
        placeholder: $T('MANAGE_CONSTANT_S3_ENDPOINT_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_S3_ENDPOINT_TOOLTIP')
      },
      sslEnabled: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_SSLENABLED_DESC'),
        default: true,
        type: 'boolean',
        tooltip: $T('MANAGE_CONSTANT_S3_SSLENABLED_TOOLTIP')
      },
      s3ForcePathStyle: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_FORCE_PATH_STYLE_DESC'),
        default: false,
        type: 'boolean',
        tooltip: $T('MANAGE_CONSTANT_S3_FORCE_PATH_STYLE_TOOLTIP')
      },
      proxy: {
        required: false,
        description: $T('MANAGE_CONSTANT_S3_PROXY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_S3_PROXY_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_S3_PROXY_TOOLTIP')
      },
      aclForUpload: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_DESC'),
        rule: defaultBaseRule('aclForUpload'),
        default: 'public-read',
        type: 'select',
        selectOptions: {
          private: $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_OPTIONS_PRIVATE'),
          'public-read': $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_OPTIONS_PUBLIC_READ'),
          'public-read-write': $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_OPTIONS_PUBLIC_READ_WRITE'),
          'authenticated-read': $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_OPTIONS_AUTHENTICATED_READ'),
          'bucket-owner-read': $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_OPTIONS_BUCKET_OWNER_READ'),
          'bucket-owner-full-control': $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_OPTIONS_BUCKET_OWNER_FULL_CONTROL'),
          'aws-exec-read': $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_OPTIONS_AWS_EXEC_READ')
        },
        tooltip: $T('MANAGE_CONSTANT_S3_ACL_FOR_UPLOAD_TOOLTIP')
      },
      bucketName: {
        required: false,
        description: $T('MANAGE_CONSTANT_S3_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_S3_BUCKET_PLACEHOLDER'),
        type: 'string',
        tooltip: bucketNameTooltip
      },
      baseDir: {
        required: false,
        description: $T('MANAGE_CONSTANT_S3_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_S3_BASE_DIR_PLACEHOLDER'),
        type: 'string',
        default: '/',
        tooltip: baseDirTooltip
      },
      dogeCloudSupport: {
        required: false,
        description: $T('MANAGE_CONSTANT_S3_DOGE_CLOUD_SUPPORT_DESC'),
        default: false,
        type: 'boolean',
        tooltip: $T('MANAGE_CONSTANT_S3_DOGE_CLOUD_SUPPORT_TOOLTIP')
      },
      paging: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_PAGING_DESC'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip
      },
      itemsPerPage: {
        required: true,
        description: $T('MANAGE_CONSTANT_S3_ITEMS_PAGE_DESC'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip
      }
    },
    explain: $T('MANAGE_CONSTANT_S3_EXPLAIN'),
    options: ['alias', 'accessKeyId', 'secretAccessKey', 'endpoint', 'sslEnabled', 's3ForcePathStyle', 'proxy', 'aclForUpload', 'bucketName', 'baseDir', 'dogeCloudSupport', 'paging', 'itemsPerPage'],
    refLink: 'https://github.com/wayjam/picgo-plugin-s3',
    referenceText: $T('MANAGE_CONSTANT_S3_REFER_TEXT')
  },
  webdavplist: {
    name: 'WebDAV',
    icon: 'webdavplist',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_WEBDAV_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'webdavplist-A',
        tooltip: aliasTooltip
      },
      endpoint: {
        required: true,
        description: $T('MANAGE_CONSTANT_WEBDAV_HOST_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_HOST_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('rootDomain'),
        tooltip: $T('MANAGE_CONSTANT_WEBDAV_HOST_TOOLTIP')
      },
      username: {
        required: true,
        description: $T('MANAGE_CONSTANT_WEBDAV_USERNAME_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_USERNAME_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('username')
      },
      bucketName: {
        required: true,
        description: $T('MANAGE_CONSTANT_WEBDAV_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_BUCKET_PLACEHOLDER'),
        type: 'string',
        default: 'webdav',
        disabled: true,
        tooltip: $T('MANAGE_CONSTANT_WEBDAV_BUCKET_TOOLTIP')
      },
      password: {
        required: true,
        description: $T('MANAGE_CONSTANT_WEBDAV_PASSWORD_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_PASSWORD_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('password')
      },
      baseDir: {
        required: false,
        description: $T('MANAGE_CONSTANT_WEBDAV_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_BASE_DIR_PLACEHOLDER'),
        type: 'string',
        default: '/'
      },
      customUrl: {
        required: false,
        description: $T('MANAGE_CONSTANT_WEBDAV_CUSTOM_URL_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_CUSTOM_URL_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_WEBDAV_CUSTOM_URL_TOOLTIP'),
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                if (!/^https?:\/\/.+/.test(value)) {
                  callback(new Error($T('MANAGE_CONSTANT_WEBDAV_CUSTOM_URL_RULE_MESSAGE')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      webPath: {
        required: false,
        description: $T('MANAGE_CONSTANT_WEBDAV_WEB_PATH'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_WEB_PATH_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_WEBDAV_WEB_PATH_TOOLTIP'),
        default: ''
      },
      proxy: {
        required: false,
        description: $T('MANAGE_CONSTANT_WEBDAV_PROXY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_WEBDAV_PROXY_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_WEBDAV_PROXY_TOOLTIP')
      },
      sslEnabled: {
        required: true,
        description: $T('MANAGE_CONSTANT_WEBDAV_SSL_DESC'),
        default: true,
        type: 'boolean',
        tooltip: $T('MANAGE_CONSTANT_WEBDAV_SSL_TOOLTIP')
      }
    },
    explain: $T('MANAGE_CONSTANT_WEBDAV_EXPLAIN'),
    options: ['alias', 'endpoint', 'username', 'password', 'bucketName', 'baseDir', 'customUrl', 'webPath', 'proxy', 'sslEnabled'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=webdav',
    referenceText: $T('MANAGE_CONSTANT_WEBDAV_REFER_TEXT')
  },
  local: {
    name: $T('MANAGE_CONSTANT_LOCAL_NAME'),
    icon: 'local',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_LOCAL_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_LOCAL_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'local-A',
        tooltip: aliasTooltip
      },
      baseDir: {
        required: true,
        description: $T('MANAGE_CONSTANT_LOCAL_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_LOCAL_BASE_DIR_PLACEHOLDER'),
        type: 'string',
        default: '',
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (!value) {
                callback(new Error($T('MANAGE_CONSTANT_LOCAL_BASE_DIR_RULE_MESSAGE')))
              } else {
                callback()
              }
            }
          }
        ]
      },
      customUrl: {
        required: false,
        description: $T('MANAGE_CONSTANT_LOCAL_CUSTOM_URL_DESC'),
        placeholder: $T('MANAGE_CONSTANT_LOCAL_CUSTOM_URL_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_LOCAL_CUSTOM_URL_TOOLTIP'),
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                if (!/^https?:\/\/.+/.test(value)) {
                  callback(new Error($T('MANAGE_CONSTANT_WEBDAV_CUSTOM_URL_RULE_MESSAGE')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      bucketName: {
        required: true,
        description: $T('MANAGE_CONSTANT_LOCAL_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_LOCAL_BUCKET_PLACEHOLDER'),
        type: 'string',
        default: 'local',
        disabled: true,
        tooltip: $T('MANAGE_CONSTANT_LOCAL_BUCKET_TOOLTIP')
      },
      webPath: {
        required: false,
        description: $T('MANAGE_CONSTANT_LOCAL_WEB_PATH'),
        placeholder: $T('MANAGE_CONSTANT_LOCAL_WEB_PATH_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_LOCAL_WEB_PATH_TOOLTIP'),
        default: ''
      }
    },
    explain: $T('MANAGE_CONSTANT_LOCAL_EXPLAIN'),
    options: ['alias', 'baseDir', 'customUrl', 'bucketName', 'webPath'],
    refLink: 'https://piclist.cn',
    referenceText: $T('MANAGE_CONSTANT_LOCAL_REFER_TEXT')
  },
  sftp: {
    name: $T('MANAGE_CONSTANT_SFTP_NAME'),
    icon: 'sftp',
    configOptions: {
      alias: {
        required: true,
        description: $T('MANAGE_CONSTANT_SFTP_ALIAS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_ALIAS_PLACEHOLDER'),
        type: 'string',
        rule: aliasRule,
        default: 'sftp-A',
        tooltip: aliasTooltip
      },
      host: {
        required: true,
        description: $T('MANAGE_CONSTANT_SFTP_HOST_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_HOST_PLACEHOLDER'),
        type: 'string',
        rule: defaultBaseRule('host'),
        default: ''
      },
      port: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_PORT_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_PORT_PLACEHOLDER'),
        type: 'number',
        default: 22
      },
      username: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_USERNAME_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_USERNAME_PLACEHOLDER'),
        type: 'string',
        default: ''
      },
      password: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_PASSWORD_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_PASSWORD_PLACEHOLDER'),
        type: 'string',
        default: ''
      },
      privateKey: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_PRIVATE_KEY_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_PRIVATE_KEY_PLACEHOLDER'),
        type: 'string',
        default: ''
      },
      passphrase: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_PASSPHRASE_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_PASSPHRASE_PLACEHOLDER'),
        type: 'string',
        default: ''
      },
      fileMode: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_FILE_PERMISSIONS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_FILE_PERMISSIONS_PLACEHOLDER'),
        type: 'string',
        default: '0664'
      },
      dirMode: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_DIR_PERMISSIONS_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_DIR_PERMISSIONS_PLACEHOLDER'),
        type: 'string',
        default: '0755'
      },
      baseDir: {
        required: true,
        description: $T('MANAGE_CONSTANT_SFTP_BASE_DIR_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_BASE_DIR_PLACEHOLDER'),
        type: 'string',
        default: '',
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (!value) {
                callback(new Error($T('MANAGE_CONSTANT_SFTP_BASE_DIR_RULE_MESSAGE')))
              } else {
                callback()
              }
            }
          }
        ]
      },
      customUrl: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_CUSTOM_URL_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_CUSTOM_URL_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_SFTP_CUSTOM_URL_TOOLTIP'),
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                if (!/^https?:\/\/.+/.test(value)) {
                  callback(new Error($T('MANAGE_CONSTANT_WEBDAV_CUSTOM_URL_RULE_MESSAGE')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      bucketName: {
        required: true,
        description: $T('MANAGE_CONSTANT_SFTP_BUCKET_DESC'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_BUCKET_PLACEHOLDER'),
        type: 'string',
        default: 'sftp',
        disabled: true,
        tooltip: $T('MANAGE_CONSTANT_SFTP_BUCKET_TOOLTIP')
      },
      webPath: {
        required: false,
        description: $T('MANAGE_CONSTANT_SFTP_WEB_PATH'),
        placeholder: $T('MANAGE_CONSTANT_SFTP_WEB_PATH_PLACEHOLDER'),
        type: 'string',
        tooltip: $T('MANAGE_CONSTANT_SFTP_WEB_PATH_TOOLTIP'),
        default: ''
      }
    },
    explain: $T('MANAGE_CONSTANT_SFTP_EXPLAIN'),
    options: ['alias', 'host', 'port', 'username', 'password', 'privateKey', 'passphrase', 'fileMode', 'dirMode', 'baseDir', 'customUrl', 'bucketName', 'webPath'],
    refLink: 'https://github.com/imba97/picgo-plugin-sftp-uploader',
    referenceText: $T('MANAGE_CONSTANT_SFTP_REFER_TEXT')
  }
}
