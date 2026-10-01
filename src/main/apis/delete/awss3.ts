import { removeFileFromS3InMain } from '~/utils/deleteFunc'
import { deleteFailedLog } from '~/utils/deleteLog'
import { getRawData } from '~/utils/rawData'

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
