
const defaultBaseRule = (name: string) => {
  return [
    {
      required: true,
      message: `请输入${name}`,
      trigger: 'blur'
    }
  ]
}

const itemsPerPageRule = [
  {
    required: true,
    message: '请输入每页显示数量',
    trigger: 'blur'
  },
  {
    type: 'number',
    message: '每页显示数量必须为数字',
    trigger: 'change'
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      if (value < 20 || value > 1000) {
        callback(new Error('每页显示数量必须在20-1000之间'))
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
    message: '请输入配置别名, 该配置的唯一标识',
    trigger: 'blur'
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      const reg = /^[\u4e00-\u9fa5_a-zA-Z0-9-]{1,15}$/
      if (!reg.test(value)) {
        callback(new Error('配置别名只能包含中文、英文、数字和下划线，且不能超过15个字符'))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }
]

export const supportedPicBedList: IStringKeyMap = {
  smms: {
    name: 'SM.MS',
    icon: 'smms',
    configOptions: {
      alias: {
        required: true,
        description: '配置别名-必需',
        placeholder: '该配置的唯一标识',
        type: 'string',
        rule: aliasRule,
        default: 'smms-A'
      },
      token: {
        required: true,
        description: 'token-必需',
        placeholder: '请输入token',
        type: 'string',
        rule: defaultBaseRule('token')
      },
      paging: {
        required: true,
        description: '是否分页',
        default: true,
        type: 'boolean'
      }
    },
    explain: '大陆地区请访问备用域名https://smms.app, 请勿大批量上传图片，否则API接口会被限制',
    options: ['alias', 'token', 'paging'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-6',
    referenceText: '配置教程请参考：'
  },
  qiniu: {
    name: '七牛云',
    icon: 'qiniu',
    configOptions: {
      alias: {
        required: true,
        description: '配置别名-必需',
        placeholder: '该配置的唯一标识',
        type: 'string',
        rule: aliasRule,
        default: 'qiniu-A'
      },
      accessKey: {
        required: true,
        description: 'accessKey-必需',
        placeholder: '请输入accessKey',
        type: 'string',
        rule: defaultBaseRule('accessKey')
      },
      secretKey: {
        required: true,
        description: 'secretKey-必需',
        placeholder: '请输入secretKey',
        type: 'string',
        rule: defaultBaseRule('secretKey')
      },
      bucketName: {
        required: false,
        description: '空间名-可选',
        placeholder: '英文逗号分隔，例如：bucket1,bucket2',
        type: 'string'
      },
      baseDir: {
        required: false,
        description: '起始目录-可选',
        placeholder: '英文逗号分隔，例如：/test1,/test2',
        default: '/',
        type: 'string'
      },
      paging: {
        required: true,
        description: '是否分页',
        default: true,
        type: 'boolean'
      },
      itemsPerPage: {
        required: true,
        description: '每页显示数量',
        default: 50,
        type: 'number',
        rule: itemsPerPageRule
      }
    },
    explain: '空间名和起始目录配置时可通过英文逗号分隔不同存储桶的设置，顺序必须一致，逗号间留空或缺失项使用默认值',
    options: ['alias', 'accessKey', 'secretKey', 'bucketName', 'baseDir', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-3',
    referenceText: '配置教程请参考：'
  },
  github: {
    name: 'GitHub',
    icon: 'github',
    configOptions: {
      alias: {
        required: true,
        description: '配置别名-必需',
        placeholder: '该配置的唯一标识',
        type: 'string',
        rule: aliasRule,
        default: 'github-A'
      },
      token: {
        required: true,
        description: 'token-必需',
        placeholder: '请输入token',
        type: 'string',
        rule: defaultBaseRule('token')
      },
      githubUsername: {
        required: true,
        description: '用户名-必需',
        placeholder: '请输入用户名',
        type: 'string',
        rule: defaultBaseRule('用户名')
      },
      proxy: {
        required: false,
        description: '代理-可选',
        placeholder: '例如：http://127.0.0.1:1080',
        type: 'string'
      },
      paging: {
        required: true,
        description: '是否分页',
        default: false,
        type: 'boolean'
      },
      customUrl: {
        required: false,
        description: 'CDN加速域名-可选；例如: https://cdn.staticaly.com/gh/{username}/{repo}@{branch}/{path}',
        placeholder: '支持使用{username}、{repo}、{branch}和{path}作为替换占位符，用于适配不同仓库和分支',
        type: 'string',
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
                  callback(new Error('加速域名请以http://或https://开头'))
                } else if (!isBracketsValid) {
                  callback(new Error('加速域名中的大括号必须成对出现'))
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
    explain: 'API调用有每小时上限，此外不支持上传超过100M的文件',
    options: ['alias', 'token', 'githubUsername', 'proxy', 'customUrl'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-9',
    referenceText: '配置教程请参考：'
  },
  aliyun: {
    name: '阿里云',
    icon: 'aliyun',
    configOptions: {
      alias: {
        required: true,
        description: '配置别名-必需',
        placeholder: '该配置的唯一标识',
        type: 'string',
        rule: aliasRule,
        default: 'aliyun-A'
      },
      accessKeyId: {
        required: true,
        description: 'accessKeyId-必需',
        placeholder: '请输入accessKeyId',
        type: 'string',
        rule: defaultBaseRule('accessKeyId')
      },
      accessKeySecret: {
        required: true,
        description: 'accessKeySecret-必需',
        placeholder: '请输入accessKeySecret',
        type: 'string',
        rule: defaultBaseRule('accessKeySecret')
      },
      bucketName: {
        required: false,
        description: '存储桶名-可选',
        placeholder: '英文逗号分隔，例如：bucket1,bucket2',
        type: 'string'
      },
      baseDir: {
        required: false,
        description: '起始目录-可选',
        placeholder: '英文逗号分隔，例如：/test1,/test2',
        type: 'string',
        default: '/'
      },
      paging: {
        required: true,
        description: '是否分页',
        default: true,
        type: 'boolean'
      },
      itemsPerPage: {
        required: true,
        description: '每页显示数量',
        default: 50,
        type: 'number',
        rule: itemsPerPageRule
      }
    },
    explain: '存储桶名和起始目录配置时可通过英文逗号分隔不同存储桶的设置，顺序必须一致，逗号间留空或缺失项使用默认值',
    options: ['alias', 'accessKeyId', 'accessKeySecret', 'bucketName', 'baseDir', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-1',
    referenceText: '配置教程请参考：'
  },
  tcyun: {
    name: '腾讯云',
    icon: 'tcyun',
    configOptions: {
      alias: {
        required: true,
        description: '配置别名-必需',
        placeholder: '该配置的唯一标识',
        type: 'string',
        rule: aliasRule,
        default: 'tcyun-A'
      },
      secretId: {
        required: true,
        description: 'secretId-必需',
        placeholder: '请输入secretId',
        type: 'string',
        rule: defaultBaseRule('secretId')
      },
      secretKey: {
        required: true,
        description: 'secretKey-必需',
        placeholder: '请输入secretKey',
        type: 'string',
        rule: defaultBaseRule('secretKey')
      },
      appId: {
        required: true,
        description: 'appId-必需',
        placeholder: '请输入appId',
        type: 'string',
        rule: defaultBaseRule('appId')
      },
      bucketName: {
        required: false,
        description: '存储桶名-可选(注意包含AppId)',
        placeholder: '英文逗号分隔，例如：bucket1-1250000000,bucket2-1250000000',
        type: 'string'
      },
      baseDir: {
        required: false,
        description: '起始目录-可选',
        placeholder: '英文逗号分隔，例如：/test1,/test2',
        type: 'string',
        default: '/'
      },
      paging: {
        required: true,
        description: '是否分页',
        default: true,
        type: 'boolean'
      },
      itemsPerPage: {
        required: true,
        description: '每页显示数量',
        default: 50,
        type: 'number',
        rule: itemsPerPageRule
      }
    },
    explain: '存储桶名和起始目录配置时可通过英文逗号分隔不同存储桶的设置，顺序必须一致，逗号间留空或缺失项使用默认值',
    options: ['alias', 'secretId', 'secretKey', 'appId', 'bucketName', 'baseDir', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-2',
    referenceText: '配置教程请参考：'
  },
  upyun: {
    name: '又拍云',
    icon: 'upyun',
    configOptions: {
      alias: {
        required: true,
        description: '配置别名-必需',
        placeholder: '该配置的唯一标识',
        type: 'string',
        rule: aliasRule,
        default: 'upyun-A'
      },
      bucketName: {
        required: true,
        description: '服务名-必需',
        placeholder: '对应其它对象存储的存储桶名',
        type: 'string',
        rule: defaultBaseRule('bucketName')
      },
      operator: {
        required: true,
        description: '操作员-必需',
        placeholder: '推荐使用具有读取、写入和删除完整权限的操作员',
        type: 'string',
        rule: defaultBaseRule('操作员')
      },
      password: {
        required: true,
        description: '操作员密码-必需',
        placeholder: '请输入密码',
        type: 'string',
        rule: defaultBaseRule('操作员密码')
      },
      baseDir: {
        required: false,
        description: '起始目录-可选',
        placeholder: '读取文件时的初始目录',
        type: 'string',
        default: '/'
      },
      customUrl: {
        required: true,
        description: '加速域名-必需',
        placeholder: '请以http://或https://开头',
        type: 'string',
        rule: [
          {
            required: true,
            message: '加速域名不能为空',
            trigger: 'change'
          },
          {
            validator: (rule: any, value: any, callback: any) => {
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
                  callback(new Error('自定义域名请以http://或https://开头'))
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
        description: '是否分页',
        default: true,
        type: 'boolean'
      },
      itemsPerPage: {
        required: true,
        description: '每页显示数量',
        default: 50,
        type: 'number',
        rule: itemsPerPageRule
      }
    },
    explain: '又拍云图床务必填写加速域名，否则无法正常使用',
    options: ['alias', 'bucketName', 'operator', 'password', 'baseDir', 'customUrl', 'paging', 'itemsPerPage'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=%e5%8f%82%e6%95%b0%e8%af%b4%e6%98%8e-4',
    referenceText: '配置教程请参考：'
  },
  imgur: {
    name: 'Imgur',
    icon: 'imgur',
    configOptions: {
      alias: {
        required: true,
        description: '配置别名-必需',
        placeholder: '该配置的唯一标识',
        type: 'string',
        rule: aliasRule,
        default: 'imgur-A'
      },
      imgurUserName: {
        required: true,
        description: 'imgur用户名-必需',
        placeholder: '请输入imgur用户名',
        type: 'string',
        rule: defaultBaseRule('imgurUserName')
      },
      accessToken: {
        required: true,
        description: 'accessToken-必需(不是clientID,请参考配置教程)',
        placeholder: '请输入accessToken',
        type: 'string',
        rule: defaultBaseRule('accessToken')
      },
      proxy: {
        required: false,
        description: '代理-可选',
        placeholder: '例如：http://127.0.0.1:1080',
        type: 'string'
      }
    },
    explain: '大陆地区请使用代理，API调用存在限制，请注意使用频率',
    options: ['alias', 'imgurUserName', 'accessToken', 'proxy'],
    refLink: 'https://pichoro.horosama.com/#/PicHoroDocs/configure?id=imgur%e5%9b%be%e5%ba%8a-1',
    referenceText: '配置教程请参考：'
  }
}
