import db from '@core/datastore'
import { dbChecker, dbPathChecker } from '@core/datastore/dbChecker'
import { debounce } from 'lodash-es'
import { PicGo } from 'piclist'
import pkg from 'root/package.json'

import { IStringKeyMap } from '#/types/types'

const CONFIG_PATH = dbPathChecker()

dbChecker()

const picgo = await PicGo.create(CONFIG_PATH)

picgo.saveConfig({
  debug: true,
  PICGO_ENV: 'GUI'
})

picgo.GUI_VERSION = pkg.version

const originPicGoSaveConfig = picgo.saveConfig.bind(picgo)

function flushDB () {
  db.read(true)
}

const debounced = debounce(flushDB, 1000)

picgo.saveConfig = (config: IStringKeyMap) => {
  originPicGoSaveConfig(config)
  // flush electron's db
  debounced()
}

export default picgo
