import { removeFileFromHuaweiInMain } from '~/utils/deleteFunc'
import { deleteFailedLog } from '~/utils/deleteLog'
import { getRawData } from '~/utils/rawData'

export default class HuaweicloudApi {
  static async delete(configMap: IStringKeyMap): Promise<boolean> {
    try {
      return await removeFileFromHuaweiInMain(getRawData(configMap))
    } catch (error: any) {
      deleteFailedLog(configMap.fileName, 'HuaweiCloud', error)
      return false
    }
  }
}
