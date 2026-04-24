import { createI18n } from 'vue-i18n'

import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh-CN.json'
import zhTW from '@/i18n/locales/zh-TW.json'

type MessageSchema = typeof en

const i18n = createI18n<MessageSchema, 'en' | 'zh-CN' | 'zh-TW'>({
  legacy: false,
  locale: localStorage.getItem('currentLanguage') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
  },
})
const { t } = i18n.global
const defaultBaseRule = (name: string) => {
  return [
    {
      required: true,
      message: `${t('pages.manage.constant.pleaseInput', { name })}`,
      trigger: 'blur',
    },
  ]
}

const itemsPerPageRule = [
  {
    required: true,
    message: t('pages.manage.constant.inputItemsPerPage'),
    trigger: 'blur',
  },
  {
    type: 'number',
    message: t('pages.manage.constant.itemsPPBeNumber'),
    trigger: 'change',
  },
  {
    validator: (_rule: any, value: any, callback: any) => {
      if (value < 20 || value > 1000) {
        callback(new Error(t('pages.manage.constant.itemsPPBeNumberLimit')))
      } else {
        callback()
      }
    },
    trigger: 'change',
  },
]

const aliasRule = [
  {
    required: true,
    message: t('pages.manage.constant.inputAlias'),
    trigger: 'blur',
  },
  {
    validator: (_rule: any, value: any, callback: any) => {
      const reg = /^[\u4e00-\u9fff_a-zA-Z0-9-]+$/
      if (!reg.test(value)) {
        callback(new Error(t('pages.manage.constant.aliasRuleMsg')))
      } else {
        callback()
      }
    },
    trigger: 'change',
  },
]

const aliasTooltip = t('pages.manage.constant.aliasTip')
const itemsPerPageTooltip = t('pages.manage.constant.itemsPPTip')
const pagingTooltip = t('pages.manage.constant.pagingTip')
const bucketNameTooltip = t('pages.manage.constant.bucketNameTip')
const baseDirTooltip = t('pages.manage.constant.baseDirTip')
const isAutoCustomUrlTooltip = t('pages.manage.constant.isAutoCustomUrlTip')

export const supportedPicBedList: IStringKeyMap = {
  smms: {
    name: 'S.EE',
    icon: 'smms',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'see-A',
        tooltip: aliasTooltip,
      },
      token: {
        required: true,
        description: t('pages.manage.constant.smms.tokenDesc'),
        placeholder: t('pages.manage.constant.smms.tokenPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('token'),
      },
      domain: {
        required: false,
        description: t('pages.manage.constant.smms.domainDesc'),
        placeholder: t('pages.manage.constant.smms.domainPlaceholder'),
        type: 'string',
      },
      customSlug: {
        required: false,
        description: t('pages.manage.constant.smms.customSlugDesc'),
        placeholder: t('pages.manage.constant.smms.customSlugPlaceholder'),
        type: 'string',
      },
      paging: {
        required: true,
        description: t('pages.manage.constant.pagingDesc'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip,
      },
    },
    explain: t('pages.manage.constant.smms.explain'),
    options: ['alias', 'token', 'domain', 'customSlug', 'paging'],
    refLink: 'https://s.ee/docs/picgo/',
    referenceText: t('pages.manage.constant.referText'),
  },
  qiniu: {
    name: t('pages.manage.constant.qiniu.name'),
    icon: 'qiniu',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'qiniu-A',
        tooltip: aliasTooltip,
      },
      accessKey: {
        required: true,
        description: t('pages.manage.constant.accessKeyDesc'),
        placeholder: t('pages.manage.constant.accessKeyPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('accessKey'),
      },
      secretKey: {
        required: true,
        description: t('pages.manage.constant.secretKeyDesc'),
        placeholder: t('pages.manage.constant.secretKeyPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('secretKey'),
      },
      bucketName: {
        required: false,
        description: t('pages.manage.constant.bucketDesc'),
        placeholder: t('pages.manage.constant.bucketPlaceholder'),
        type: 'string',
        tooltip: bucketNameTooltip,
      },
      baseDir: {
        required: false,
        description: t('pages.manage.constant.baseDirDesc'),
        placeholder: t('pages.manage.constant.baseDirPlaceholder'),
        default: '/',
        type: 'string',
        tooltip: baseDirTooltip,
      },
      isAutoCustomUrl: {
        required: true,
        description: t('pages.manage.constant.isAutoGetCustomUrl'),
        default: true,
        type: 'boolean',
        tooltip: isAutoCustomUrlTooltip,
      },
      paging: {
        required: true,
        description: t('pages.manage.constant.isEnablePaging'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip,
      },
      itemsPerPage: {
        required: true,
        description: t('pages.manage.constant.itemsPerPage'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip,
      },
    },
    explain: t('pages.manage.constant.explain'),
    options: ['alias', 'accessKey', 'secretKey', 'bucketName', 'baseDir', 'isAutoCustomUrl', 'paging', 'itemsPerPage'],
    refLink: 'https://piclist.cn/manage.html#%E4%B8%83%E7%89%9B%E4%BA%91',
    referenceText: t('pages.manage.constant.referText'),
  },
  github: {
    name: 'GitHub',
    icon: 'github',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'github-A',
        tooltip: aliasTooltip,
      },
      token: {
        required: true,
        description: t('pages.manage.constant.github.tokenDesc'),
        placeholder: t('pages.manage.constant.github.tokenPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('token'),
        tooltip: t('pages.manage.constant.github.tokenTips'),
      },
      githubUsername: {
        required: true,
        description: t('pages.manage.constant.userNameDesc'),
        placeholder: t('pages.manage.constant.userNamePlaceholder'),
        type: 'string',
        rule: defaultBaseRule(t('pages.manage.constant.userNameDesc')),
      },
      proxy: {
        required: false,
        description: t('pages.manage.constant.proxyDesc'),
        placeholder: t('pages.manage.constant.proxyPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.proxyTips'),
      },
      paging: {
        required: true,
        description: t('pages.manage.constant.isEnablePaging'),
        default: false,
        type: 'boolean',
        tooltip: pagingTooltip,
      },
      customUrl: {
        required: false,
        description: t('pages.manage.constant.github.cdnUrlDesc'),
        placeholder: t('pages.manage.constant.github.cdnUrlPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.github.cdnUrlTips'),
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
                    for (const i of str) {
                      if (i === '{') {
                        stack.push(i)
                      } else if (i === '}') {
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
                  callback(new Error(t('pages.manage.constant.github.protocolRuleMsg')))
                } else if (!isBracketsValid) {
                  callback(new Error(t('pages.manage.constant.github.bracketRuleMsg')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change',
          },
        ],
      },
    },
    explain: t('pages.manage.constant.github.explain'),
    options: ['alias', 'token', 'githubUsername', 'proxy', 'customUrl'],
    refLink: 'https://piclist.cn/manage.html#github',
    referenceText: t('pages.manage.constant.referText'),
  },
  aliyun: {
    name: t('pages.manage.constant.aliyun.name'),
    icon: 'aliyun',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'aliyun-A',
        tooltip: aliasTooltip,
      },
      accessKeyId: {
        required: true,
        description: t('pages.manage.constant.accessKeyIdDesc'),
        placeholder: t('pages.manage.constant.accessKeyIdPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('accessKeyId'),
      },
      accessKeySecret: {
        required: true,
        description: t('pages.manage.constant.accessKeySecretDesc'),
        placeholder: t('pages.manage.constant.accessKeySecretPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('accessKeySecret'),
      },
      bucketName: {
        required: false,
        description: t('pages.manage.constant.bucketDesc'),
        placeholder: t('pages.manage.constant.bucketPlaceholder'),
        type: 'string',
        tooltip: bucketNameTooltip,
      },
      baseDir: {
        required: false,
        description: t('pages.manage.constant.baseDirDesc'),
        placeholder: t('pages.manage.constant.baseDirPlaceholder'),
        type: 'string',
        default: '/',
        tooltip: baseDirTooltip,
      },
      isAutoCustomUrl: {
        required: true,
        description: t('pages.manage.constant.isAutoGetCustomUrl'),
        default: true,
        type: 'boolean',
        tooltip: isAutoCustomUrlTooltip,
      },
      paging: {
        required: true,
        description: t('pages.manage.constant.isEnablePaging'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip,
      },
      itemsPerPage: {
        required: true,
        description: t('pages.manage.constant.itemsPerPage'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip,
      },
    },
    explain: t('pages.manage.constant.explain'),
    options: [
      'alias',
      'accessKeyId',
      'accessKeySecret',
      'bucketName',
      'baseDir',
      'isAutoCustomUrl',
      'paging',
      'itemsPerPage',
    ],
    refLink: 'https://piclist.cn/manage.html#%E9%98%BF%E9%87%8C%E4%BA%91oss',
    referenceText: t('pages.manage.constant.referText'),
  },
  tcyun: {
    name: t('pages.manage.constant.tcyun.name'),
    icon: 'tcyun',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'tcyun-A',
        tooltip: aliasTooltip,
      },
      secretId: {
        required: true,
        description: t('pages.manage.constant.secretIdDesc'),
        placeholder: t('pages.manage.constant.secretIdPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('secretId'),
      },
      secretKey: {
        required: true,
        description: t('pages.manage.constant.secretKeyDesc'),
        placeholder: t('pages.manage.constant.secretKeyPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('secretKey'),
      },
      appId: {
        required: true,
        description: t('pages.manage.constant.tcyun.appIdDesc'),
        placeholder: t('pages.manage.constant.tcyun.appIdPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('appId'),
        tooltip: t('pages.manage.constant.tcyun.appIdTips'),
      },
      bucketName: {
        required: false,
        description: t('pages.manage.constant.bucketDesc'),
        placeholder: t('pages.manage.constant.bucketPlaceholder'),
        type: 'string',
        tooltip: bucketNameTooltip,
      },
      baseDir: {
        required: false,
        description: t('pages.manage.constant.baseDirDesc'),
        placeholder: t('pages.manage.constant.baseDirPlaceholder'),
        type: 'string',
        default: '/',
        tooltip: baseDirTooltip,
      },
      isAutoCustomUrl: {
        required: true,
        description: t('pages.manage.constant.isAutoGetCustomUrl'),
        default: true,
        type: 'boolean',
        tooltip: isAutoCustomUrlTooltip,
      },
      paging: {
        required: true,
        description: t('pages.manage.constant.isEnablePaging'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip,
      },
      itemsPerPage: {
        required: true,
        description: t('pages.manage.constant.itemsPerPage'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip,
      },
    },
    explain: t('pages.manage.constant.explain'),
    options: [
      'alias',
      'secretId',
      'secretKey',
      'appId',
      'bucketName',
      'baseDir',
      'isAutoCustomUrl',
      'paging',
      'itemsPerPage',
    ],
    refLink: 'https://piclist.cn/manage.html#%E8%85%BE%E8%AE%AF%E4%BA%91',
    referenceText: t('pages.manage.constant.referText'),
  },
  upyun: {
    name: t('pages.manage.constant.upyun.name'),
    icon: 'upyun',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'upyun-A',
        tooltip: aliasTooltip,
      },
      bucketName: {
        required: true,
        description: t('pages.manage.constant.upyun.bucketDesc'),
        placeholder: t('pages.manage.constant.upyun.bucketPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('bucketName'),
      },
      operator: {
        required: true,
        description: t('pages.manage.constant.upyun.operatorNameDesc'),
        placeholder: t('pages.manage.constant.upyun.operatorNamePlaceholder'),
        type: 'string',
        rule: defaultBaseRule(t('pages.manage.constant.upyun.operatorNameDesc')),
      },
      password: {
        required: true,
        description: t('pages.manage.constant.upyun.operatorPassDesc'),
        placeholder: t('pages.manage.constant.upyun.operatorPassPlaceholder'),
        type: 'string',
        rule: defaultBaseRule(t('pages.manage.constant.upyun.operatorPassDesc')),
      },
      baseDir: {
        required: false,
        description: t('pages.manage.constant.upyun.baseDirDesc'),
        placeholder: t('pages.manage.constant.upyun.baseDirPlaceholder'),
        type: 'string',
        default: '/',
      },
      customUrl: {
        required: true,
        description: t('pages.manage.constant.upyun.accelerationUrlDesc'),
        placeholder: t('pages.manage.constant.upyun.accelerationUrlPlaceholder'),
        type: 'string',
        rule: [
          {
            required: true,
            message: t('pages.manage.constant.upyun.notEmpty'),
            trigger: 'change',
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
                  callback(new Error(t('pages.manage.constant.upyun.protocolRuleMsg')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change',
          },
        ],
      },
      antiLeechToken: {
        required: false,
        description: t('pages.manage.constant.upyun.antiLeechTokenDesc'),
        placeholder: t('pages.manage.constant.upyun.antiLeechTokenPlaceholder'),
        type: 'string',
        default: '',
        tooltip: t('pages.manage.constant.upyun.antiLeechTokenTooltip'),
      },
      expireTime: {
        required: false,
        description: t('pages.manage.constant.upyun.antiLeechExp'),
        type: 'number',
        default: 0,
      },
      paging: {
        required: true,
        description: t('pages.manage.constant.isEnablePaging'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip,
      },
      itemsPerPage: {
        required: true,
        description: t('pages.manage.constant.itemsPerPage'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip,
      },
    },
    explain: t('pages.manage.constant.upyun.explain'),
    options: [
      'alias',
      'bucketName',
      'operator',
      'password',
      'baseDir',
      'customUrl',
      'paging',
      'itemsPerPage',
      'antiLeechToken',
      'expireTime',
    ],
    refLink: 'https://piclist.cn/manage.html#%E5%8F%88%E6%8B%8D%E4%BA%91',
    referenceText: t('pages.manage.constant.referText'),
  },
  imgur: {
    name: 'Imgur',
    icon: 'imgur',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'imgur-A',
      },
      imgurUserName: {
        required: true,
        description: t('pages.manage.constant.userNameDesc'),
        placeholder: t('pages.manage.constant.userNamePlaceholder'),
        type: 'string',
        rule: defaultBaseRule('imgurUserName'),
      },
      accessToken: {
        required: true,
        description: t('pages.manage.constant.imgur.accessTokenDesc'),
        placeholder: t('pages.manage.constant.imgur.accessTokenPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('accessToken'),
        tooltip: t('pages.manage.constant.imgur.accessTokenTips'),
      },
      proxy: {
        required: false,
        description: t('pages.manage.constant.proxyDesc'),
        placeholder: t('pages.manage.constant.proxyPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.proxyTips'),
      },
    },
    explain: t('pages.manage.constant.imgur.explain'),
    options: ['alias', 'imgurUserName', 'accessToken', 'proxy'],
    refLink: 'https://piclist.cn/manage.html#imgur',
    referenceText: t('pages.manage.constant.referText'),
  },
  s3plist: {
    name: 'S3 API',
    icon: 's3plist',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 's3plist-A',
        tooltip: aliasTooltip,
      },
      accessKeyId: {
        required: true,
        description: t('pages.manage.constant.accessKeyIdDesc'),
        placeholder: t('pages.manage.constant.accessKeyIdPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('accessKeyId'),
      },
      secretAccessKey: {
        required: true,
        description: t('pages.manage.constant.accessKeySecretDesc'),
        placeholder: t('pages.manage.constant.accessKeySecretDesc'),
        type: 'string',
        rule: defaultBaseRule('secretAccessKey'),
      },
      endpoint: {
        required: false,
        description: t('pages.manage.constant.s3.endpointDesc'),
        placeholder: t('pages.manage.constant.s3.endpointPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.s3.endpointTips'),
      },
      sslEnabled: {
        required: true,
        description: t('pages.manage.constant.s3.enableHttps'),
        default: true,
        type: 'boolean',
        tooltip: t('pages.manage.constant.s3.enableHttpsTip'),
      },
      s3ForcePathStyle: {
        required: true,
        description: t('pages.manage.constant.s3.enableS3PathStyle'),
        default: false,
        type: 'boolean',
        tooltip: t('pages.manage.constant.s3.enableS3PathStyleTip'),
      },
      proxy: {
        required: false,
        description: t('pages.manage.constant.proxyDesc'),
        placeholder: t('pages.manage.constant.proxyPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.proxyTips'),
      },
      aclForUpload: {
        required: true,
        description: t('pages.manage.constant.s3.aclDesc'),
        rule: defaultBaseRule('aclForUpload'),
        default: 'public-read',
        type: 'select',
        selectOptions: {
          private: t('pages.manage.constant.s3.acl.private'),
          'public-read': t('pages.manage.constant.s3.acl.publicRead'),
          'public-read-write': t('pages.manage.constant.s3.acl.publicReadWrite'),
          'authenticated-read': t('pages.manage.constant.s3.acl.authenticatedRead'),
          'bucket-owner-read': t('pages.manage.constant.s3.acl.bucketOwnerRead'),
          'bucket-owner-full-control': t('pages.manage.constant.s3.acl.bucketOwnerFullControl'),
          'aws-exec-read': t('pages.manage.constant.s3.acl.awsExecRead'),
        },
        tooltip: t('pages.manage.constant.s3.aclTips'),
      },
      bucketName: {
        required: false,
        description: t('pages.manage.constant.bucketDesc'),
        placeholder: t('pages.manage.constant.bucketPlaceholder'),
        type: 'string',
        tooltip: bucketNameTooltip,
      },
      baseDir: {
        required: false,
        description: t('pages.manage.constant.baseDirDesc'),
        placeholder: t('pages.manage.constant.baseDirPlaceholder'),
        type: 'string',
        default: '/',
        tooltip: baseDirTooltip,
      },
      dogeCloudSupport: {
        required: false,
        description: t('pages.manage.constant.s3.enableDogeSupport'),
        default: false,
        type: 'boolean',
        tooltip: t('pages.manage.constant.s3.enableDogeSupportTip'),
      },
      paging: {
        required: true,
        description: t('pages.manage.constant.isEnablePaging'),
        default: true,
        type: 'boolean',
        tooltip: pagingTooltip,
      },
      itemsPerPage: {
        required: true,
        description: t('pages.manage.constant.itemsPerPage'),
        default: 50,
        type: 'number',
        rule: itemsPerPageRule,
        tooltip: itemsPerPageTooltip,
      },
    },
    explain: t('pages.manage.constant.explain'),
    options: [
      'alias',
      'accessKeyId',
      'secretAccessKey',
      'endpoint',
      'sslEnabled',
      's3ForcePathStyle',
      'proxy',
      'aclForUpload',
      'bucketName',
      'baseDir',
      'dogeCloudSupport',
      'paging',
      'itemsPerPage',
    ],
    refLink: 'https://piclist.cn/manage.html#s3',
    referenceText: t('pages.manage.constant.referText'),
  },
  webdavplist: {
    name: 'WebDAV',
    icon: 'webdavplist',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'webdavplist-A',
        tooltip: aliasTooltip,
      },
      endpoint: {
        required: true,
        description: t('pages.manage.constant.webdav.hostDesc'),
        placeholder: t('pages.manage.constant.webdav.hostPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('rootDomain'),
        tooltip: t('pages.manage.constant.webdav.hostTips'),
      },
      username: {
        required: true,
        description: t('pages.manage.constant.userNameDesc'),
        placeholder: t('pages.manage.constant.userNamePlaceholder'),
        type: 'string',
        rule: defaultBaseRule('username'),
      },
      bucketName: {
        required: true,
        description: t('pages.manage.constant.specialDesc'),
        placeholder: t('pages.manage.constant.specialPlaceholder'),
        type: 'string',
        default: 'webdav',
        disabled: true,
        tooltip: t('pages.manage.constant.specialTips'),
      },
      password: {
        required: true,
        description: t('pages.manage.constant.passwordDesc'),
        placeholder: t('pages.manage.constant.passwordPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('password'),
      },
      baseDir: {
        required: false,
        description: t('pages.manage.constant.webdav.baseDirDesc'),
        placeholder: t('pages.manage.constant.webdav.baseDirPlaceholder'),
        type: 'string',
        default: '/',
      },
      customUrl: {
        required: false,
        description: t('pages.manage.constant.webdav.customUrlDesc'),
        placeholder: t('pages.manage.constant.webdav.customUrlPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.webdav.customUrlTips'),
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                if (!/^https?:\/\/.+/.test(value)) {
                  callback(new Error(t('pages.manage.constant.webdav.protocolRuleMsg')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change',
          },
        ],
      },
      webPath: {
        required: false,
        description: t('pages.manage.constant.webdav.webPathDesc'),
        placeholder: t('pages.manage.constant.webdav.webPathPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.webdav.webPathTips'),
        default: '',
      },
      proxy: {
        required: false,
        description: t('pages.manage.constant.proxyDesc'),
        placeholder: t('pages.manage.constant.proxyPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.proxyTips'),
      },
      sslEnabled: {
        required: true,
        description: t('pages.manage.constant.webdav.enableHttpsDesc'),
        default: true,
        type: 'boolean',
        tooltip: t('pages.manage.constant.webdav.enableHttpsTips'),
      },
      authType: {
        required: true,
        description: t('pages.manage.constant.webdav.authTypeDesc'),
        default: 'basic',
        type: 'select',
        selectOptions: {
          basic: 'Basic',
          digest: 'Digest',
        },
      },
    },
    explain: t('pages.manage.constant.webdav.explain'),
    options: [
      'alias',
      'endpoint',
      'username',
      'password',
      'bucketName',
      'baseDir',
      'customUrl',
      'webPath',
      'proxy',
      'sslEnabled',
      'authType',
    ],
    refLink: 'https://piclist.cn/manage.html#webdav',
    referenceText: t('pages.manage.constant.referText'),
  },
  local: {
    name: t('pages.manage.constant.local.name'),
    icon: 'local',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'local-A',
        tooltip: aliasTooltip,
      },
      baseDir: {
        required: true,
        description: t('pages.manage.constant.local.baseDirDesc'),
        placeholder: t('pages.manage.constant.local.baseDirPlaceholder'),
        type: 'string',
        default: '',
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (!value) {
                callback(new Error(t('pages.manage.constant.local.baseDirRuleMsg')))
              } else {
                callback()
              }
            },
          },
        ],
      },
      customUrl: {
        required: false,
        description: t('pages.manage.constant.local.customUrlDesc'),
        placeholder: t('pages.manage.constant.local.customUrlPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.local.customUrlTooltip'),
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                if (!/^https?:\/\/.+/.test(value)) {
                  callback(new Error(t('pages.manage.constant.local.customUrlRuleMsg')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change',
          },
        ],
      },
      bucketName: {
        required: true,
        description: t('pages.manage.constant.specialDesc'),
        placeholder: t('pages.manage.constant.specialPlaceholder'),
        type: 'string',
        default: 'local',
        disabled: true,
        tooltip: t('pages.manage.constant.specialTips'),
      },
      webPath: {
        required: false,
        description: t('pages.manage.constant.local.webPathDesc'),
        placeholder: t('pages.manage.constant.local.webPathPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.local.webPathTips'),
        default: '',
      },
    },
    explain: t('pages.manage.constant.local.explain'),
    options: ['alias', 'baseDir', 'customUrl', 'bucketName', 'webPath'],
    refLink: 'https://piclist.cn/manage.html#%E6%9C%AC%E5%9C%B0%E5%AD%98%E5%82%A8',
    referenceText: t('pages.manage.constant.referText'),
  },
  sftp: {
    name: 'SFTP',
    icon: 'sftp',
    configOptions: {
      alias: {
        required: true,
        description: t('pages.manage.constant.aliasDesc'),
        placeholder: t('pages.manage.constant.aliasPlaceholder'),
        type: 'string',
        rule: aliasRule,
        default: 'sftp-A',
        tooltip: aliasTooltip,
      },
      host: {
        required: true,
        description: t('pages.manage.constant.sftp.hostDesc'),
        placeholder: t('pages.manage.constant.sftp.hostPlaceholder'),
        type: 'string',
        rule: defaultBaseRule('host'),
        default: '',
      },
      port: {
        required: false,
        description: t('pages.manage.constant.sftp.portDesc'),
        placeholder: t('pages.manage.constant.sftp.portPlaceholder'),
        type: 'number',
        default: 22,
      },
      username: {
        required: false,
        description: t('pages.manage.constant.userNameDesc'),
        placeholder: t('pages.manage.constant.userNamePlaceholder'),
        type: 'string',
        default: '',
      },
      password: {
        required: false,
        description: t('pages.manage.constant.passwordDesc'),
        placeholder: t('pages.manage.constant.passwordPlaceholder'),
        type: 'string',
        default: '',
      },
      privateKey: {
        required: false,
        description: t('pages.manage.constant.sftp.privateKeyDesc'),
        placeholder: t('pages.manage.constant.sftp.privateKeyPlaceholder'),
        type: 'string',
        default: '',
      },
      passphrase: {
        required: false,
        description: t('pages.manage.constant.sftp.passphraseDesc'),
        placeholder: t('pages.manage.constant.sftp.passphrasePlaceholder'),
        type: 'string',
        default: '',
      },
      fileMode: {
        required: false,
        description: t('pages.manage.constant.sftp.fileModeDesc'),
        placeholder: t('pages.manage.constant.sftp.fileModePlaceholder'),
        type: 'string',
        default: '0664',
      },
      dirMode: {
        required: false,
        description: t('pages.manage.constant.sftp.dirModeDesc'),
        placeholder: t('pages.manage.constant.sftp.dirModePlaceholder'),
        type: 'string',
        default: '0755',
      },
      baseDir: {
        required: false,
        description: t('pages.manage.constant.sftp.baseDirDesc'),
        placeholder: t('pages.manage.constant.sftp.baseDirPlaceholder'),
        type: 'string',
        default: '',
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (!value) {
                callback(new Error(t('pages.manage.constant.sftp.baseDirTips')))
              } else {
                callback()
              }
            },
          },
        ],
      },
      customUrl: {
        required: false,
        description: t('pages.manage.constant.sftp.customUrlDesc'),
        placeholder: t('pages.manage.constant.sftp.customUrlPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.sftp.customUrlTips'),
        rule: [
          {
            validator: (_rule: any, value: any, callback: any) => {
              if (value) {
                if (!/^https?:\/\/.+/.test(value)) {
                  callback(new Error(t('pages.manage.constant.webdav.protocolRuleMsg')))
                } else {
                  callback()
                }
              } else {
                callback()
              }
            },
            trigger: 'change',
          },
        ],
      },
      bucketName: {
        required: true,
        description: t('pages.manage.constant.specialDesc'),
        placeholder: t('pages.manage.constant.specialPlaceholder'),
        type: 'string',
        default: 'sftp',
        disabled: true,
        tooltip: t('pages.manage.constant.specialTips'),
      },
      webPath: {
        required: false,
        description: t('pages.manage.constant.sftp.webPathDesc'),
        placeholder: t('pages.manage.constant.sftp.webPathPlaceholder'),
        type: 'string',
        tooltip: t('pages.manage.constant.sftp.webPathTips'),
        default: '',
      },
    },
    explain: t('pages.manage.constant.sftp.explain'),
    options: [
      'alias',
      'host',
      'port',
      'username',
      'password',
      'privateKey',
      'passphrase',
      'fileMode',
      'dirMode',
      'baseDir',
      'customUrl',
      'bucketName',
      'webPath',
    ],
    refLink: 'https://piclist.cn/manage.html#sftp',
    referenceText: t('pages.manage.constant.referText'),
  },
}
