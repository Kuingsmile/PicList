import fs from 'fs-extra'

import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'

interface IConfigMap {
  hash: string
}

export default class LocalApi {
  static async delete(configMap: IConfigMap): Promise<boolean> {
    const { hash } = configMap
    if (!hash) {
      deleteLog(hash, 'Local', false, 'Local.delete: invalid params')
      return false
    }

    try {
      await fs.remove(hash)
      deleteLog(hash, 'Local')
      return true
    } catch (error: any) {
      deleteFailedLog(hash, 'Local', error)
      return false
    }
  }
}
