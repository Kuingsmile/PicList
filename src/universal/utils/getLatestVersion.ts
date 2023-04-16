import axios from 'axios'
import yaml from 'js-yaml'
import { RELEASE_URL, RELEASE_URL_BACKUP } from './static'

export const getLatestVersion = async (): Promise<string> => {
  try {
    const { data } = await axios.get(RELEASE_URL)
    const releases = data as IStringKeyMap[]
    const normalList = releases.filter(item => !item.name.includes('beta'))
    const latestRelease = normalList[0]
    return latestRelease.name
  } catch (err) {
    console.log(err)
    try {
      const { data } = await axios.get(`${RELEASE_URL_BACKUP}/latest.yml`)
      const r = yaml.load(data) as IStringKeyMap
      return r.version
    } catch (err) {
      console.log(err)
      return ''
    }
  }
}
