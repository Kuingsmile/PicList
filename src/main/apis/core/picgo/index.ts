import { dbChecker } from '@core/datastore/dbChecker'
import { appConfigPath } from '@core/datastore/dirs'
import { PicGo } from 'piclist'
import pkg from 'root/package.json'

import { T as $t } from '~/i18n'
import { configPaths } from '~/utils/configPaths'
const CONFIG_PATH = appConfigPath()

dbChecker()

const picgo = await PicGo.create(CONFIG_PATH)

picgo.saveConfig({
  debug: true,
  PICGO_ENV: 'GUI',
})

const shortKeySetting = picgo.getConfig<any>(configPaths.settings.shortKey._path)

if (!shortKeySetting) {
  picgo.saveConfig({
    'settings.shortKey[picgo:upload]': {
      enable: true,
      key: 'CommandOrControl+Alt+P',
      name: 'upload',
      label: $t('QUICK_UPLOAD'),
    },
  })
}

picgo.GUI_VERSION = pkg.version

export default picgo
