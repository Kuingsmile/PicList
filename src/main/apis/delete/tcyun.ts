import COS from 'cos-nodejs-sdk-v5'

import type { ITcYunConfig, PartialKeys } from '#/types/types'
import { deleteFailedLog, deleteLog } from '~/utils/deleteLog'
interface IConfigMap {
  fileName: string
  config: PartialKeys<ITcYunConfig, 'path'>
}
export default class TcyunApi {
  static #createCOS(SecretId: string, SecretKey: string): COS {
    return new COS({
      SecretId,
      SecretKey,
    })
  }

  static async delete(configMap: IConfigMap): Promise<boolean> {
    const {
      fileName,
      config: { secretId, secretKey, bucket, area, path },
    } = configMap
    try {
      const cos = TcyunApi.#createCOS(secretId, secretKey)
      let key
      if (path === '/' || !path) {
        key = `/${fileName}`
      } else {
        key = `/${path.replace(/^\/+|\/+$/, '')}/${fileName}`
      }
      const result = await cos.deleteObject({
        Bucket: bucket,
        Region: area,
        Key: key,
      })
      const ok = result.statusCode === 204
      deleteLog(fileName, 'Tcyun', ok)
      return ok
    } catch (error: any) {
      deleteFailedLog(fileName, 'Tcyun', error)
      return false
    }
  }
}
