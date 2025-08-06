import axios, { AxiosResponse } from 'axios'

import type { IImgurConfig } from '#/types/types'
import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'

interface IConfigMap {
  config?: Partial<IImgurConfig>
  hash?: string
}

export default class ImgurApi {
  static #baseUrl = 'https://api.imgur.com/3'

  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { config: { clientId = '', username = '', accessToken = '' } = {}, hash = '' } = configMap
    let Authorization: string, apiUrl: string

    if (username && accessToken) {
      Authorization = `Bearer ${accessToken}`
      apiUrl = `${ImgurApi.#baseUrl}/account/${username}/image/${hash}`
    } else if (clientId) {
      Authorization = `Client-ID ${clientId}`
      apiUrl = `${ImgurApi.#baseUrl}/image/${hash}`
    } else {
      deleteLog(hash, 'Imgur', false, 'No credentials found')
      return false
    }
    try {
      const response: AxiosResponse = await axios.delete(apiUrl, {
        headers: { Authorization },
        timeout: 30000
      })
      if (response.status === 200) {
        deleteLog(hash, 'Imgur')
        return true
      }
      deleteLog(hash, 'Imgur', false)
      return false
    } catch (error: any) {
      deleteFailedLog(hash, 'Imgur', error)
      return false
    }
  }
}
