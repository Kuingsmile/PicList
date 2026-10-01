import { removeFileFromSFTPInMain } from '~/utils/deleteFunc'
import { deleteFailedLog } from '~/utils/deleteLog'
import { getRawData } from '~/utils/rawData'

export default class SftpPlistApi {
  static async delete(configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      return await removeFileFromSFTPInMain(getRawData(config), fileName)
    } catch (error: any) {
      deleteFailedLog(fileName, 'SFTP', error)
      return false
    }
  }
}
