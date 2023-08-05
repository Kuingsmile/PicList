import { ipcRenderer } from 'electron'
import { getRawData } from '~/renderer/utils/common'

export default class SftpPlistApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      const deleteResult = await ipcRenderer.invoke('delete-sftp-file',
        getRawData(config),
        fileName
      )
      return deleteResult
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
