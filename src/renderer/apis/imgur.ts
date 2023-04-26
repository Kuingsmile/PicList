import axios from 'axios'

export default class ImgurApi {
  static async delete (configMap: IStringKeyMap): Promise<boolean> {
    const { config = {}, hash = '' } = configMap || {}
    const { clientId = '', username = '', accessToken = '' } = config
    const baseUrl = 'https://api.imgur.com/3'
    let Authorization
    let apiUrl
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
    try {
      const res = await axios.delete(apiUrl, {
        headers,
        timeout: 30000
      })
      return res.status === 200
    } catch (error) {
      console.log(error)
      return false
    }
  }
}
