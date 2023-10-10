import axios, { AxiosResponse } from 'axios'

export default class PiclistApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { config, fullResult } = configMap
    const { host, port } = config
    if (!host) {
      console.error('PiclistApi.delete: invalid params')
      return false
    }

    const url = `http://${host || '127.0.0.1'}:${port || 36677}/delete`

    try {
      const response: AxiosResponse = await axios.post(
        url,
        {
          list: [fullResult]
        }
      )
      return response.status === 200 && response.data?.success
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
