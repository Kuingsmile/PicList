import axios from 'axios'

export default class ImgurApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const clientId = configMap.config.clientId
    const { hash } = configMap
    const fullUrl = `https://api.imgur.com/3/image/${hash}`
    const headers = {
      Authorization: `Client-ID ${clientId}`
    }
    try {
      const res = await axios.delete(fullUrl, {
        headers,
        timeout: 30000
      })
      return res.status === 200
    } catch (error) {
      return false
    }
  }
}
