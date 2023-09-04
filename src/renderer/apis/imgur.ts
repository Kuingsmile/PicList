import axios, { AxiosResponse } from 'axios'

interface IConfigMap {
  config?: {
    clientId?: string
    username?: string
    accessToken?: string
  }
  hash?: string
}

interface IConfig {
  headers: {
    Authorization: string
  }
  timeout: number
}

export default class ImgurApi {
  static baseUrl = 'https://api.imgur.com/3'
  private static async makeRequest (
    method: 'delete',
    url: string,
    config: IConfig
  ): Promise<boolean> {
    try {
      const response: AxiosResponse = await axios[method](url, config)
      return response.status === 200
    } catch (error) {
      console.error(error)
      return false
    }
  }

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const {
      config: { clientId = '', username = '', accessToken = '' } = {},
      hash = ''
    } = configMap
    let Authorization: string, apiUrl: string

    if (username && accessToken) {
      Authorization = `Bearer ${accessToken}`
      apiUrl = `${ImgurApi.baseUrl}/account/${username}/image/${hash}`
    } else if (clientId) {
      Authorization = `Client-ID ${clientId}`
      apiUrl = `${ImgurApi.baseUrl}/image/${hash}`
    } else {
      return false
    }
    const requestConfig: IConfig = {
      headers: { Authorization },
      timeout: 30000
    }
    return ImgurApi.makeRequest('delete', apiUrl, requestConfig)
  }
}
