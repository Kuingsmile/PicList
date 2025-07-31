import { getRawData } from '@/utils/common'
import { IRPCActionType } from '#/types/enum'
import { IStringKeyMap } from '#/types/types'
import { deleteFailedLog } from '#/utils/deleteLog'

export default class HuaweicloudApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    try {
      return (await window.electron.triggerRPC(IRPCActionType.GALLERY_DELETE_HUAWEI_OSS_FILE, getRawData(configMap))) || false
    } catch (error: any) {
      deleteFailedLog(configMap.fileName, 'HuaweiCloud', error)
      return false
    }
  }
}
