import { IStringKeyMap } from '#/types/types'
import { RELEASE_URL, RELEASE_URL_BACKUP } from '#/utils/static'

export const getLatestVersion = async (): Promise<string> => {
  try {
    const { data: normalList } = await window.node.axios.get(RELEASE_URL)
    return normalList[0].name
  } catch (err) {
    console.error('Error fetching latest version: ', err)
    try {
      const { data } = await window.node.axios.get(`${RELEASE_URL_BACKUP}/latest.yml`)
      const r = window.node.yaml.load(data) as IStringKeyMap
      return r.version
    } catch (err) {
      console.error('Error fetching backup latest version: ', err)
      return ''
    }
  }
}
