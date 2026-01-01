import axios, { AxiosResponse } from 'axios'

import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'

interface IConfigMap {
  hash?: string
  config?: Partial<ISMMSConfig>
}

export default class SmmsApi {
  static readonly #baseUrl = 'https://smms.app/api/v2'

  static async delete(configMap: IConfigMap): Promise<boolean> {
    const { hash, config } = configMap
    if (!hash || !config || !config.token) {
      deleteLog(hash, 'Smms', false, 'SmmsApi.delete: invalid params')
      return false
    }

    const { token } = config

    try {
      const response: AxiosResponse = await axios.get(`${SmmsApi.#baseUrl}/delete/${hash}`, {
        headers: {
          Authorization: token,
        },
        params: {
          hash,
          format: 'json',
        },
        timeout: 30000,
      })
      const ok = response.status === 200
      deleteLog(hash, 'Smms', ok)
      return ok
    } catch (error: any) {
      deleteFailedLog(hash, 'Smms', error)
      return false
    }
  }
}
