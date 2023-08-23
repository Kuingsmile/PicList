import fs from 'fs-extra'

interface IConfigMap {
  hash: string
}

export default class LocalApi {
  static async delete (configMap: IConfigMap): Promise<boolean> {
    const { hash } = configMap
    if (!hash) {
      console.error('Local.delete: invalid params')
      return false
    }

    try {
      await fs.remove(hash)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }
}
