import axios from 'axios'
import yaml from 'js-yaml'
import { RELEASE_URL, RELEASE_URL_BACKUP } from './static'

export const getLatestVersion = async (): Promise<string> => {
  try {
    const { data: normalList } = await axios.get(RELEASE_URL)
    return normalList[0].name
  } catch (err) {
    console.error('Error fetching latest version: ', err)
    try {
      const { data } = await axios.get(`${RELEASE_URL_BACKUP}/latest.yml`)
      const r = yaml.load(data) as IStringKeyMap
      return r.version
    } catch (err) {
      console.error('Error fetching backup latest version: ', err)
      return ''
    }
  }
}
