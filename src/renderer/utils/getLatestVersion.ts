import { RELEASE_URL, RELEASE_URL_BACKUP } from '@/utils/static'

export const getLatestVersion = async (): Promise<string> => {
  try {
    const response = await fetch(RELEASE_URL)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const normalList = await response.json()
    console.log('Fetched latest version info: ', normalList)
    console.log('Latest version is: ', normalList[0].name)
    return normalList[0].name
  } catch (err) {
    console.error('Error fetching latest version: ', err)
    try {
      const response = await fetch(`${RELEASE_URL_BACKUP}/latest.yml`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.text()
      const r = window.node.yaml.parse(data).toJSON() as IStringKeyMap
      return r.version
    } catch (err) {
      console.error('Error fetching backup latest version: ', err)
      return ''
    }
  }
}
