import { ipcRenderer } from 'electron'
import { getRawData } from '~/renderer/utils/common'

export default class AwsS3Api {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    try {
      const deleteResult = await ipcRenderer.invoke('delete-aws-s3-file',
        getRawData(configMap)
      )
      return deleteResult
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
