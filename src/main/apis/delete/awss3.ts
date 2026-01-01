import { getRawData } from '~/utils/common'
import { removeFileFromS3InMain } from '~/utils/deleteFunc'
import { deleteFailedLog } from '~/utils/deleteLog'

export default class AwsS3Api {
  static async delete(configMap: IStringKeyMap): Promise<boolean> {
    try {
      return await removeFileFromS3InMain(getRawData(configMap))
    } catch (error: any) {
      deleteFailedLog(configMap.fileName, 'AWS S3', error)
      return false
    }
  }
}
