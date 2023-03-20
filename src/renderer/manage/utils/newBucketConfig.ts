import { AliyunAreaCodeName, QiniuAreaCodeName, TencentAreaCodeName } from '~/main/manage/utils/constants'
import { T as $T } from '@/i18n'

export const newBucketConfig:IStringKeyMap = {
  tcyun: {
    name: $T('MANAGE_NEW_BUCKET_TCYUN_NAME'),
    icon: 'tcyun',
    configOptions: {
      BucketName: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_DESC'),
        placeholder: $T('MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_PLACEHOLDER'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: $T('MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_RULE_MSG_A'),
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,21}[a-z0-9]$/
              if (value.length > 23) {
                callback(new Error($T('MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_RULE_MSG_B')))
              } else if (!reg.test(value)) {
                callback(new Error($T('MANAGE_NEW_BUCKET_TCYUN_BUCKETNAME_RULE_MSG_C')))
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
        description: $T('MANAGE_NEW_BUCKET_TCYUN_REGION'),
        paraType: 'string',
        component: 'select',
        default: 'ap-nanjing',
        options: TencentAreaCodeName
      },
      acl: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_TCYUN_ACL_DESC'),
        paraType: 'string',
        component: 'select',
        default: 'private',
        options: {
          private: $T('MANAGE_NEW_BUCKET_TCYUN_ACL_PRIVATE'),
          publicRead: $T('MANAGE_NEW_BUCKET_TCYUN_ACL_PUBLIC_R'),
          publicReadWrite: $T('MANAGE_NEW_BUCKET_TCYUN_ACL_PUBLIC_RW')
        }
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  aliyun: {
    name: $T('MANAGE_NEW_BUCKET_ALIYUN_NAME'),
    icon: 'aliyun',
    configOptions: {
      BucketName: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_DESC'),
        placeholder: $T('MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_PLACEHOLDER'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: $T('MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_RULE_MSG_A'),
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/
              if (value.length > 63) {
                callback(new Error($T('MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_RULE_MSG_B')))
              } else if (!reg.test(value)) {
                callback(new Error($T('MANAGE_NEW_BUCKET_ALIYUN_BUCKETNAME_RULE_MSG_C')))
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
        description: $T('MANAGE_NEW_BUCKET_ALIYUN_REGION'),
        paraType: 'string',
        component: 'select',
        default: 'oss-cn-hangzhou',
        options: AliyunAreaCodeName
      },
      acl: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_ALIYUN_ACL_DESC'),
        paraType: 'string',
        component: 'select',
        default: 'private',
        options: {
          private: $T('MANAGE_NEW_BUCKET_ALIYUN_ACL_PRIVATE'),
          publicRead: $T('MANAGE_NEW_BUCKET_ALIYUN_ACL_PUBLIC_R'),
          publicReadWrite: $T('MANAGE_NEW_BUCKET_ALIYUN_ACL_PUBLIC_RW')
        }
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  qiniu: {
    name: $T('MANAGE_NEW_BUCKET_QINIU_NAME'),
    icon: 'qiniu',
    configOptions: {
      BucketName: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_DESC'),
        placeholder: $T('MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_PLACEHOLDER'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: $T('MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_RULE_MSG_A'),
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
              if (value.length > 63) {
                callback(new Error($T('MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_RULE_MSG_B')))
              } else if (!reg.test(value)) {
                callback(new Error($T('MANAGE_NEW_BUCKET_QINIU_BUCKETNAME_RULE_MSG_C')))
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
        description: $T('MANAGE_NEW_BUCKET_QINIU_REGION'),
        paraType: 'string',
        component: 'select',
        default: 'z0',
        options: QiniuAreaCodeName
      },
      acl: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_QINIU_ACL_DESC'),
        paraType: 'boolean',
        component: 'switch',
        default: false
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  upyun: {
    name: $T('MANAGE_NEW_BUCKET_UPYUN_NAME'),
    icon: 'upyun',
    configOptions: {
      BucketName: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_UPYUN_BUCKETNAME_DESC'),
        placeholder: $T('MANAGE_NEW_BUCKET_UPYUN_BUCKETNAME_PLACEHOLDER'),
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: $T('MANAGE_NEW_BUCKET_UPYUN_BUCKETNAME_RULE_MSG_A'),
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z][a-z0-9-]{4,19}$/
              if (value.length > 23 || value.length < 5) {
                callback(new Error($T('MANAGE_NEW_BUCKET_UPYUN_BUCKETNAME_RULE_MSG_B')))
              } else if (!reg.test(value)) {
                callback(new Error($T('MANAGE_NEW_BUCKET_UPYUN_BUCKETNAME_RULE_MSG_C')))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      },
      operator: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_UPYUN_OPERATORNAME_DESC'),
        placeholder: $T('MANAGE_NEW_BUCKET_UPYUN_OPERATORNAME_PLACEHOLDER'),
        paraType: 'string',
        component: 'input',
        rule: [
          {
            required: true,
            message: $T('MANAGE_NEW_BUCKET_UPYUN_OPERATORNAME_RULE_MSG_A'),
            trigger: 'blur'
          }
        ]
      },
      password: {
        required: true,
        description: $T('MANAGE_NEW_BUCKET_UPYUN_PASSWORD_DESC'),
        placeholder: $T('MANAGE_NEW_BUCKET_UPYUN_PASSWORD_PLACEHOLDER'),
        paraType: 'string',
        component: 'input',
        rule: [
          {
            required: true,
            message: $T('MANAGE_NEW_BUCKET_UPYUN_PASSWORD_RULE_MSG_A'),
            trigger: 'blur'
          }
        ]
      }
    },
    options: ['BucketName', 'operator', 'password']
  }
}
