import { checkConfigFile } from '@core/datastore/configFile'
import { appConfigPath, dataDir } from '@core/datastore/dirs'
import { JSONStore } from '@piclist/store'

import { recoverGallerySync } from '~/services/gallerySync/storage'

export default function dbChecker(): void {
  if (process.type === 'renderer') return

  const configFilePath = appConfigPath()
  checkConfigFile(configFilePath)

  // Finish interrupted sync recovery before any store reads the gallery.
  recoverGallerySync(dataDir(), value => new JSONStore(configFilePath).set('settings.lastSyncTime', value))
}
