import db from '~/main/apis/core/datastore'
import { getLatestVersion } from '#/utils/getLatestVersion'
import { autoUpdater } from 'electron-updater'
// const releaseUrl = 'https://api.github.com/repos/Molunerfinn/PicGo/releases'
// const releaseUrlBackup = 'https://picgo-1251750343.cos.ap-chengdu.myqcloud.com'
// const downloadUrl = 'https://github.com/Kuingsmile/PicList/releases/latest'

const checkVersion = async () => {
  let showTip = db.get('settings.showUpdateTip')
  if (showTip === undefined) {
    db.set('settings.showUpdateTip', true)
    showTip = true
  }
  if (showTip) {
    const res: string = await getLatestVersion()
    if (res !== '') {
      autoUpdater.checkForUpdatesAndNotify()
    } else {
      return false
    }
  } else {
    return false
  }
}

export default checkVersion
