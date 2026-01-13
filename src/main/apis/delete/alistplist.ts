import path from 'node:path'

import axios from 'axios'

import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'

interface IConfigMap {
  fileName: string
  config: {
    url: string
    username: string
    password: string
    uploadPath: string
    token: string
  }
}

const getAListToken = async (url: string, username: string, password: string) => {
  const res = await axios.post(`${url}/api/auth/login`, {
    username,
    password,
  })
  if (res.data.code === 200 && res.data.message === 'success') {
    return res.data.data.token
  }
}

export default class AListplistApi {
  static async delete(configMap: IConfigMap): Promise<boolean> {
    const { fileName, config } = configMap
    try {
      const { url, username, password, uploadPath } = config
      let token = config.token
      if (!token) {
        token = await getAListToken(url, username, password)
      }
      if (!url || !(token || (username && password))) {
        deleteFailedLog(fileName, 'Alist', 'No valid token or username/password provided')
        return false
      }
      const result = await axios.request({
        method: 'post',
        url: `${url.replace(/\/$/, '')}/api/fs/remove`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        data: {
          dir: path.join('/', uploadPath, path.dirname(fileName)),
          names: [path.basename(fileName)],
        },
      })
      const ok = result.data.code === 200
      deleteLog(fileName, 'Alist', ok)
      return ok
    } catch (error: any) {
      deleteFailedLog(fileName, 'Alist', error)
      return false
    }
  }
}
