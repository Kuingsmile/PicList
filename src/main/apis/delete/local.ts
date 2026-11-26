import path from 'node:path'

import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'
import { unlinkScopedLocalFile } from '~/utils/scopedPath'

interface IConfigMap {
  hash: string
  config?: { path?: string }
}

export default class LocalApi {
  static async delete(configMap: IConfigMap): Promise<boolean> {
    const { hash } = configMap
    const baseDir = configMap.config?.path
    if (!hash || typeof baseDir !== 'string' || !baseDir.trim()) {
      deleteLog(hash, 'Local', false, 'Local.delete: invalid params')
      return false
    }

    try {
      await unlinkScopedLocalFile(path.resolve(baseDir), hash)
      deleteLog(hash, 'Local')
      return true
    } catch (error: any) {
      deleteFailedLog(hash, 'Local', error)
      return false
    }
  }
}
