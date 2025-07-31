import { getRawData } from '@/utils/common'
import { IRPCActionType } from '#/types/enum'
import { IStringKeyMap } from '#/types/types'
import { deleteFailedLog } from '#/utils/deleteLog'

export default class SftpPlistApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      return (await window.electron.triggerRPC(IRPCActionType.GALLERY_DELETE_SFTP_FILE, getRawData(config), fileName)) || false
    } catch (error: any) {
      deleteFailedLog(fileName, 'SFTP', error)
      return false
    }
  }
}
