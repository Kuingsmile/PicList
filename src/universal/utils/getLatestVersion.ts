import axios from 'axios'
import { RELEASE_URL, RELEASE_URL_BACKUP } from './static'
import yaml from 'js-yaml'

export const getLatestVersion = async () => {
  let res: string = ''
  try {
    res = await axios.get(RELEASE_URL).then(r => {
      const list = r.data as IStringKeyMap[]
      const normalList = list.filter(item => !item.name.includes('beta'))
      return normalList[0].name
    }).catch(async () => {
      const result = await axios.get(`${RELEASE_URL_BACKUP}/latest.yml`)
      const r = yaml.load(result.data) as IStringKeyMap
      return r.version
    })
  } catch (err) {
    console.log(err)
  }
  return res
}
