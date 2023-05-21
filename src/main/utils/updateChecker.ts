import db from '~/main/apis/core/datastore'
import { autoUpdater } from 'electron-updater'

const updateChecker = async () => {
  let showTip = db.get('settings.showUpdateTip')
  if (showTip === undefined) {
    db.set('settings.showUpdateTip', true)
    showTip = true
  }
  if (showTip) {
    try {
      await autoUpdater.checkForUpdatesAndNotify()
    } catch (err) {}
  }
}

export default updateChecker
