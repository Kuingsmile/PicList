import axios from 'axios'
import crypto from 'crypto'
import querystring from 'querystring'
import picgo from '@core/picgo'

export interface DogecloudToken {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

export async function dogecloudApi (
  apiPath: string,
  data = {},
  jsonMode: boolean = false,
  accessKey: string,
  secretKey: string
) {
  const body = jsonMode ? JSON.stringify(data) : querystring.encode(data)
  const sign = crypto.createHmac('sha1', secretKey).update(Buffer.from(apiPath + '\n' + body, 'utf8')).digest('hex')
  const authorization = `TOKEN ${accessKey}:${sign}`
  try {
    const res = await axios.request({
      url: 'https://api.dogecloud.com' + apiPath,
      method: 'POST',
      data: body,
      responseType: 'json',
      headers: {
        'Content-Type': jsonMode ? 'application/json' : 'application/x-www-form-urlencoded',
        Authorization: authorization
      }
    })
    if (res.data.code !== 200) {
      throw new Error('API Error')
    }
    return res.data.data
  } catch (err: any) {
    throw new Error('API Error')
  }
}

export async function getTempToken (accessKey: string, secretKey: string): Promise<{} | DogecloudToken> {
  const dogeTempToken = await picgo.getConfig('Credentials.doge-token') || {} as any
  if (dogeTempToken.token && dogeTempToken.expires > Date.now() + 7200000) {
    return dogeTempToken.token
  }
  try {
    const data = await dogecloudApi('/auth/tmp_token.json', {
      channel: 'OSS_FULL',
      scopes: ['*']
    }, true, accessKey, secretKey)
    const token = data.Credentials
    picgo.saveConfig({
      Credentials: {
        'doge-token': {
          token,
          expires: Date.now() + 7200000
        }
      }
    })
    return token
  } catch (err: any) {
    return {}
  }
}
