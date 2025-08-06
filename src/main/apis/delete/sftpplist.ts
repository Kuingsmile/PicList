import type { IStringKeyMap } from '#/types/types'
import { getRawData } from '~/utils/common'
import { removeFileFromSFTPInMain } from '~/utils/deleteFunc'
import { deleteFailedLog } from '~/utils/deleteLog'

export default class SftpPlistApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      return await removeFileFromSFTPInMain(getRawData(config), fileName)
    } catch (error: any) {
      deleteFailedLog(fileName, 'SFTP', error)
      return false
    }
  }
}
