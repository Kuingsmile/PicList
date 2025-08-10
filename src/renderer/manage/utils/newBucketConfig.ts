import { createI18n } from 'vue-i18n'

import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh-CN.json'
import zhTW from '@/i18n/locales/zh-TW.json'
import type { IStringKeyMap } from '#/types/types'

import { AliyunAreaCodeName, QiniuAreaCodeName, TencentAreaCodeName } from './bucketConfigCons'
type MessageSchema = typeof en

const i18n = createI18n<MessageSchema, 'en' | 'zh-CN' | 'zh-TW'>({
  legacy: false,
  locale: localStorage.getItem('currentLanguage') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    en,
    'zh-CN': zhCN,
    'zh-TW': zhTW
  }
})
const { t } = i18n.global

export const newBucketConfig: IStringKeyMap = {
  tcyun: {
    name: t('pages.manage.newBucket.tcyun.name'),
    icon: 'tcyun',
    configOptions: {
      BucketName: {
        required: true,
        description: t('pages.manage.newBucket.bucketDesc'),
        placeholder: t('pages.manage.newBucket.bucketPlaceholder'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: t('pages.manage.newBucket.bucketNoEmpty'),
            trigger: 'blur'
          },
          {
            validator: (_: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,21}[a-z0-9]$/
              if (value.length > 23) {
                callback(new Error(t('pages.manage.newBucket.tcyun.bucketLengthMsg')))
              } else if (!reg.test(value)) {
                callback(new Error(t('pages.manage.newBucket.tcyun.bucketCharMsg')))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      region: {
        required: true,
        description: t('pages.manage.newBucket.region'),
        paraType: 'string',
        component: 'select',
        default: 'ap-nanjing',
        options: TencentAreaCodeName
      },
      acl: {
        required: true,
        description: t('pages.manage.newBucket.acl.title'),
        paraType: 'string',
        component: 'select',
        default: 'private',
        options: {
          private: t('pages.manage.newBucket.acl.private'),
          publicRead: t('pages.manage.newBucket.acl.publicRead'),
          publicReadWrite: t('pages.manage.newBucket.acl.publicReadWrite')
        }
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  aliyun: {
    name: t('pages.manage.newBucket.aliyun.name'),
    icon: 'aliyun',
    configOptions: {
      BucketName: {
        required: true,
        description: t('pages.manage.newBucket.bucketDesc'),
        placeholder: t('pages.manage.newBucket.bucketPlaceholder'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: t('pages.manage.newBucket.bucketNoEmpty'),
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/
              if (value.length > 63) {
                callback(new Error(t('pages.manage.newBucket.aliyun.bucketLengthMsg')))
              } else if (!reg.test(value)) {
                callback(new Error(t('pages.manage.newBucket.aliyun.bucketCharMsg')))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      region: {
        required: true,
        description: t('pages.manage.newBucket.region'),
        paraType: 'string',
        component: 'select',
        default: 'oss-cn-hangzhou',
        options: AliyunAreaCodeName
      },
      acl: {
        required: true,
        description: t('pages.manage.newBucket.acl.title'),
        paraType: 'string',
        component: 'select',
        default: 'private',
        options: {
          private: t('pages.manage.newBucket.acl.private'),
          publicRead: t('pages.manage.newBucket.acl.publicRead'),
          publicReadWrite: t('pages.manage.newBucket.acl.publicReadWrite')
        }
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  qiniu: {
    name: t('pages.manage.newBucket.qiniu.name'),
    icon: 'qiniu',
    configOptions: {
      BucketName: {
        required: true,
        description: t('pages.manage.newBucket.bucketDesc'),
        placeholder: t('pages.manage.newBucket.bucketPlaceholder'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: t('pages.manage.newBucket.bucketNoEmpty'),
            trigger: 'blur'
          },
          {
            validator: (_: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
              if (value.length > 63) {
                callback(new Error(t('pages.manage.newBucket.qiniu.bucketLengthMsg')))
              } else if (!reg.test(value)) {
                callback(new Error(t('pages.manage.newBucket.qiniu.bucketCharMsg')))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      region: {
        required: true,
        description: t('pages.manage.newBucket.region'),
        paraType: 'string',
        component: 'select',
        default: 'z0',
        options: QiniuAreaCodeName
      },
      acl: {
        required: true,
        description: t('pages.manage.newBucket.qiniu.publicAccess'),
        paraType: 'boolean',
        component: 'switch',
        default: false
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  s3plist: {
    name: t('pages.manage.newBucket.s3.name'),
    icon: 's3plist',
    configOptions: {
      BucketName: {
        required: true,
        description: t('pages.manage.newBucket.bucketDesc'),
        placeholder: t('pages.manage.newBucket.bucketPlaceholder'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: t('pages.manage.newBucket.bucketNoEmpty'),
            trigger: 'blur'
          }
        ]
      },
      region: {
        required: true,
        description: t('pages.manage.newBucket.region'),
        paraType: 'string',
        component: 'input',
        default: 'us-east-1'
      },
      acl: {
        required: true,
        description: t('pages.manage.newBucket.acl.title'),
        paraType: 'string',
        component: 'select',
        default: 'private',
        options: {
          private: t('pages.manage.newBucket.acl.private'),
          'public-read': t('pages.manage.newBucket.acl.publicRead'),
          'public-read-write': t('pages.manage.newBucket.acl.publicReadWrite'),
          'authenticated-read': t('pages.manage.newBucket.acl.authenticatedRead')
        }
      }
    },
    options: ['BucketName', 'region', 'acl']
  }
}
