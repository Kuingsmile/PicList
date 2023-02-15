import { AliyunAreaCodeName, QiniuAreaCodeName, TencentAreaCodeName } from '~/main/manage/utils/constants'

export const newBucketConfig:IStringKeyMap = {
  tcyun: {
    name: '腾讯云',
    icon: 'tcyun',
    configOptions: {
      BucketName: {
        required: true,
        description: 'Bucket名称',
        placeholder: '请输入Bucket名称',
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: 'Bucket名称不能为空',
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,21}[a-z0-9]$/
              if (value.length > 23) {
                callback(new Error('Bucket名称长度不能超过23个字符'))
              } else if (!reg.test(value)) {
                callback(new Error('Bucket名称只能包含小写字母、数字和中划线，且不能以中划线开头和结尾'))
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
        description: '地域',
        paraType: 'string',
        component: 'select',
        default: 'ap-nanjing',
        options: TencentAreaCodeName
      },
      acl: {
        required: true,
        description: '访问权限',
        paraType: 'string',
        component: 'select',
        default: 'private',
        options: {
          private: '私有',
          publicRead: '公共读',
          publicReadWrite: '公共读写'
        }
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  aliyun: {
    name: '阿里云',
    icon: 'aliyun',
    configOptions: {
      BucketName: {
        required: true,
        description: 'Bucket名称',
        placeholder: '请输入Bucket名称',
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: 'Bucket名称不能为空',
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/
              if (value.length > 63) {
                callback(new Error('Bucket名称长度不能超过63个字符'))
              } else if (!reg.test(value)) {
                callback(new Error('Bucket名称只能包含小写字母、数字和中划线，且不能以中划线开头和结尾'))
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
        description: '地域',
        paraType: 'string',
        component: 'select',
        default: 'oss-cn-hangzhou',
        options: AliyunAreaCodeName
      },
      acl: {
        required: true,
        description: '访问权限',
        paraType: 'string',
        component: 'select',
        default: 'private',
        options: {
          private: '私有',
          publicRead: '公共读',
          publicReadWrite: '公共读写'
        }
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  qiniu: {
    name: '七牛云',
    icon: 'qiniu',
    configOptions: {
      BucketName: {
        required: true,
        description: 'Bucket名称',
        placeholder: '请输入Bucket名称',
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: 'Bucket名称不能为空',
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
              if (value.length > 63) {
                callback(new Error('Bucket名称长度不能超过63个字符'))
              } else if (!reg.test(value)) {
                callback(new Error('Bucket名称只能包含小写字母、数字和中划线，且不能以中划线开头和结尾'))
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
        description: '地域',
        paraType: 'string',
        component: 'select',
        default: 'z0',
        options: QiniuAreaCodeName
      },
      acl: {
        required: true,
        description: '公开访问',
        paraType: 'boolean',
        component: 'switch',
        default: false
      }
    },
    options: ['BucketName', 'region', 'acl']
  },
  upyun: {
    name: '又拍云',
    icon: 'upyun',
    configOptions: {
      BucketName: {
        required: true,
        description: 'Bucket名称',
        placeholder: '请输入Bucket名称',
        paraType: 'string',
        component: 'input',
        default: 'piclist',
        rule: [
          {
            required: true,
            message: 'Bucket名称不能为空',
            trigger: 'blur'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
              const reg = /^[a-z][a-z0-9-]{4,19}$/
              if (value.length > 23 || value.length < 5) {
                callback(new Error('Bucket名称长度为5-20个字符'))
              } else if (!reg.test(value)) {
                callback(new Error('Bucket名称只能包含小写字母、数字和中划线，且不能以中划线开头和结尾'))
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
        description: '操作员',
        placeholder: '请输入操作员',
        paraType: 'string',
        component: 'input',
        rule: [
          {
            required: true,
            message: '操作员不能为空',
            trigger: 'blur'
          }
        ]
      },
      password: {
        required: true,
        description: '密码',
        placeholder: '请输入密码',
        paraType: 'string',
        component: 'input',
        rule: [
          {
            required: true,
            message: '密码不能为空',
            trigger: 'blur'
          }
        ]
      }
    },
    options: ['BucketName', 'operator', 'password']
  }
}
