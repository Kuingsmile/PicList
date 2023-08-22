import { ipcRenderer } from 'electron'
import { getRawData } from '~/renderer/utils/common'
import { removeFileFromDogeInMain } from '~/main/utils/deleteFunc'

export default class AwsS3Api {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    try {
      return ipcRenderer
        ? await ipcRenderer.invoke('delete-doge-file',
          getRawData(configMap)
        )
        : await removeFileFromDogeInMain(getRawData(configMap))
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
