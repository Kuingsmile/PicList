import picgo from '@core/picgo'
import updater from 'electron-updater'

import { configPaths } from '~/utils/configPaths'

const updateChecker = async () => {
  let showTip = picgo.getConfig<boolean | undefined>(configPaths.settings.showUpdateTip)
  if (showTip === undefined) {
    picgo.saveConfig({ [configPaths.settings.showUpdateTip]: true })
    showTip = true
  }
  if (showTip) {
    try {
      await updater.autoUpdater.checkForUpdatesAndNotify()
    } catch (_err) {}
  }
}

export default updateChecker
