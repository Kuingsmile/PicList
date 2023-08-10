import { ipcRenderer } from 'electron'
import { getRawData } from '~/renderer/utils/common'
import { removeFileFromS3InMain } from '~/main/utils/deleteFunc'

export default class AwsS3Api {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    try {
      return ipcRenderer
        ? await ipcRenderer.invoke('delete-aws-s3-file',
          getRawData(configMap)
        )
        : await removeFileFromS3InMain(getRawData(configMap))
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
