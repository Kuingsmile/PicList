import { ipcRenderer } from 'electron'
import { getRawData } from '~/renderer/utils/common'
import { removeFileFromHuaweiInMain } from '~/main/utils/deleteFunc'

export default class HuaweicloudApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    try {
      return ipcRenderer
        ? await ipcRenderer.invoke('delete-huaweicloud-file',
          getRawData(configMap)
        )
        : await removeFileFromHuaweiInMain(getRawData(configMap))
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
