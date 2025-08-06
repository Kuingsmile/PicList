import { getRawData } from '@/utils/common'
import { IRPCActionType } from '@/utils/enum'
import type { IStringKeyMap } from '#/types/types'

export default class ALLApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    return (await window.electron.triggerRPC(IRPCActionType.DELETE_ALL_API, getRawData(configMap))) || false
  }
}
