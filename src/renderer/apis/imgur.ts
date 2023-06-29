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
  private static async makeRequest (
    method: 'delete',
    url: string,
    config: IConfig,
    logError: boolean = true
  ): Promise<boolean> {
    try {
      const response: AxiosResponse = await axios[method](url, config)
      return response.status === 200
    } catch (error) {
      if (logError) {
        console.error(error)
      }
      return false
    }
  }

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { config = {}, hash = '' } = configMap || {}
    const { clientId = '', username = '', accessToken = '' } = config
    const baseUrl = 'https://api.imgur.com/3'
    let Authorization: string
    let apiUrl: string
    if (username && accessToken) {
      Authorization = `Bearer ${accessToken}`
      apiUrl = `${baseUrl}/account/${username}/image/${hash}`
    } else if (clientId) {
      Authorization = `Client-ID ${clientId}`
      apiUrl = `${baseUrl}/image/${hash}`
    } else {
      return false
    }
    const headers = {
      Authorization
    }
    const requestConfig: IConfig = {
      headers,
      timeout: 30000
    }
    return ImgurApi.makeRequest('delete', apiUrl, requestConfig)
  }
}
