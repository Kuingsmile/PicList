import picgo from '@core/picgo'
import updater from 'electron-updater'

import { isPortable } from '~/apis/core/datastore/dirs'
import { downloadAndInstallUpdate } from '~/lifeCycle/autoUpdater'
import { configPaths } from '~/utils/configPaths'

const updateChecker = async () => {
  let showTip = picgo.getConfig<boolean | undefined>(configPaths.settings.showUpdateTip)
  if (showTip === undefined) {
    picgo.saveConfig({ [configPaths.settings.showUpdateTip]: true })
    showTip = true
  }
  if (showTip) {
    try {
      if (!isPortable()) {
        await updater.autoUpdater.checkForUpdatesAndNotify()
      } else {
        await downloadAndInstallUpdate()
      }
    } catch (_err) {}
  }
}

export default updateChecker
