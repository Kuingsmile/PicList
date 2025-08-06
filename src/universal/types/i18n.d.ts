import 'vue-i18n'

import zhCN from '../../renderer/i18n/locales/zh-CN.json'

type MessageSchema = typeof zhCN
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
