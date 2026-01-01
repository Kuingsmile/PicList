import { getRawData } from '~/utils/common'
import { removeFileFromDogeInMain } from '~/utils/deleteFunc'
import { deleteFailedLog } from '~/utils/deleteLog'

export default class AwsS3Api {
  static async delete(configMap: IStringKeyMap): Promise<boolean> {
    try {
      return await removeFileFromDogeInMain(getRawData(configMap))
    } catch (error: any) {
      deleteFailedLog(configMap.fileName, 'DogeCloud', error)
      return false
    }
  }
}
