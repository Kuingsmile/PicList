import picgo from '@core/picgo'

import { II18nLanguage } from '#/constants/app'
import { initializeI18n } from '~/i18n'
import { configPaths } from '~/utils/configPaths'

export const initI18n = () => {
  const currentLanguage = picgo.getConfig<string>(configPaths.settings.language) || II18nLanguage.ZH_CN
  initializeI18n(currentLanguage)
}
