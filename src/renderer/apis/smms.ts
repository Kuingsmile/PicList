import axios from 'axios'

export default class SmmsApi {
  private static readonly baseUrl = 'https://smms.app/api/v2'

  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { hash, config: { token } } = configMap
    if (!hash || !token) {
      return false
    }
    try {
      const res = await axios.get(
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
      return res.status === 200
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
