import path from 'node:path'

import axios from 'axios'

import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'

interface IConfigMap {
  fileName: string
  config: {
    version: string
    url: string
    uploadPath: string
    token: string
  }
}

export default class AlistApi {
  static async delete({ fileName, config: { version, url, uploadPath, token } }: IConfigMap): Promise<boolean> {
    try {
      if (String(version) === '2') {
        deleteLog(fileName, 'Alist', false, 'Alist version 2 is not supported, deletion is skipped')
        return true
      }
      const result = await axios.request({
        method: 'post',
        url: `${url}/api/fs/remove`,
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
