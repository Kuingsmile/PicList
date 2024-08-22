import axios, { AxiosResponse } from 'axios'

import { deleteFailedLog, deleteLog } from '#/utils/deleteLog'

export default class PiclistApi {
  static async delete(configMap: IStringKeyMap): Promise<boolean> {
    const { config, fullResult } = configMap
    const { host, port } = config
    if (!fullResult) return true

    if (!host) {
      deleteLog(fullResult, 'Piclist', false, 'PiclistApi.delete: invalid params')
      return false
    }

    const url = `http://${host || '127.0.0.1'}:${port || 36677}/delete`

    try {
      const response: AxiosResponse = await axios.post(url, {
        list: [fullResult]
      })
      if (response.status === 200 && response.data?.success) {
        deleteLog(fullResult, 'Piclist')
        return true
      }
      deleteLog(fullResult, 'Piclist', false)
      return false
    } catch (error: any) {
      deleteFailedLog(fullResult, 'Piclist', error)
      return false
    }
  }
}
