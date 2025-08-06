import db from '@core/datastore'
import updater from 'electron-updater'

import { configPaths } from '~/utils/configPaths'

const updateChecker = async () => {
  let showTip = db.get(configPaths.settings.showUpdateTip)
  if (showTip === undefined) {
    db.set(configPaths.settings.showUpdateTip, true)
    showTip = true
  }
  if (showTip) {
    try {
      await updater.autoUpdater.checkForUpdatesAndNotify()
    } catch (err) {}
  }
}

export default updateChecker
