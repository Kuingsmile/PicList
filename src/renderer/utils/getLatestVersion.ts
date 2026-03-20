import { RELEASE_URL, RELEASE_URL_BACKUP } from '@/utils/static'

async function fetchData(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`, {
      cause: { url, status: response.status },
    })
  }
  return response
}

export const getLatestVersion = async (): Promise<string> => {
  let primaryError: unknown

  try {
    const response = await fetchData(RELEASE_URL)
    const normalList = await response.json()
    return normalList[0]?.name ?? ''
  } catch (err) {
    primaryError = err
    console.warn('Primary version fetch failed, trying backup...', err)
  }

  try {
    const response = await fetchData(`${RELEASE_URL_BACKUP}/latest.yml`)
    const data = await response.text()
    const r = window.node.yaml.parse(data).toJSON() as IStringKeyMap
    return r.version || ''
  } catch (backupErr) {
    const finalError = new Error('Both primary and backup version fetch failed', {
      cause: { primaryError, backupErr },
    })
    console.error(finalError)
    return ''
  }
}
