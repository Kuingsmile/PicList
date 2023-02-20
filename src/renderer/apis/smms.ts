import axios from 'axios'

export default class SmmsApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { hash, config: { token } } = configMap
    if (!hash || !token) {
      return false
    } else {
      const res = await axios.get(
        `https://smms.app/api/v2/delete/${hash}`, {
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
    }
  }
}
