import i18next from 'i18next'

import en from '~/i18n/locales/en.json'
import zhCN from '~/i18n/locales/zh-CN.json'
import zhTW from '~/i18n/locales/zh-TW.json'

export function initializeI18n(lang: string) {
  i18next.init({
    resources: {
      en: {
        translation: en,
      },
      'zh-CN': {
        translation: zhCN,
      },
      'zh-TW': {
        translation: zhTW,
      },
    },
    lng: lang,
    fallbackLng: 'zh-CN',
  })
}
initializeI18n('zh-CN')

export const t = i18next.t.bind(i18next)
