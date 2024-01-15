import axios, { AxiosResponse } from 'axios'
import https from 'https'

export default class LskyplistApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { hash, config } = configMap
    if (!hash || !config || !config.token) {
      console.error('LskyplistApi.delete: invalid params')
      return false
    }

    const { host, token, version } = config
    if (version !== 'V2') {
      console.error('LskyplistApi.delete: invalid version')
      return false
    }

    const v2Headers = {
      Accept: 'application/json',
      Authorization: token || undefined
    }

    const requestAgent = new https.Agent({
      rejectUnauthorized: false
    })
    try {
      const response: AxiosResponse = await axios.delete(
        `${host}/api/v1/images/${hash}`, {
          headers: v2Headers,
          timeout: 30000,
          httpsAgent: requestAgent
        })
      return response.status === 200 && response.data.status === true
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
