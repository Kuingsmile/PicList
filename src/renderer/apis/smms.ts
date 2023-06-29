import axios, { AxiosResponse } from 'axios'

interface IConfigMap {
  hash?: string
  config?: {
    token?: string
  }
}

export default class SmmsApi {
  private static readonly baseUrl = 'https://smms.app/api/v2'

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { hash, config } = configMap
    if (!hash || !config || !config.token) {
      console.error('SmmsApi.delete: invalid params')
      return false
    }

    const { token } = config

    try {
      const response: AxiosResponse = await axios.get(
        `${SmmsApi.baseUrl}/delete/${hash}`, {
          headers: {
            Authorization: token
          },
          params: {
            hash,
            format: 'json'
          },
          timeout: 30000
        })
      return response.status === 200
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
