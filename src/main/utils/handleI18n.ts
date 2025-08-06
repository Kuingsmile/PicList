import db from '@core/datastore'

import { i18nManager } from '~/i18n'
import { configPaths } from '~/utils/configPaths'
import { II18nLanguage } from '~/utils/enum'

export const initI18n = () => {
  const currentLanguage = db.get(configPaths.settings.language) || II18nLanguage.ZH_CN
  i18nManager.setCurrentLanguage(currentLanguage)
}
