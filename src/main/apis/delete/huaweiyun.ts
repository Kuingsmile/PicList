import type { IStringKeyMap } from '#/types/types'
import { getRawData } from '~/utils/common'
import { removeFileFromHuaweiInMain } from '~/utils/deleteFunc'
import { deleteFailedLog } from '~/utils/deleteLog'

export default class HuaweicloudApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    try {
      return await removeFileFromHuaweiInMain(getRawData(configMap))
    } catch (error: any) {
      deleteFailedLog(configMap.fileName, 'HuaweiCloud', error)
      return false
    }
  }
}
