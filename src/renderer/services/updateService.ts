import { validateStrict } from 'compare-versions'

import { RELEASE_URL, RELEASE_URL_BACKUP } from '@/utils/static'

export const isValidVersion = (version: unknown): version is string =>
  typeof version === 'string' && validateStrict(version.replace(/^v/, ''))

async function fetchData(url: string, options?: RequestInit) {
  const timeout = AbortSignal.timeout(10_000)
  const signal = options?.signal ? AbortSignal.any([timeout, options.signal]) : timeout
  const response = await fetch(url, { ...options, signal })
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(`HTTP error! status: ${response.status}`, {
      cause: { url, status: response.status },
    })
  }
  return response
}

export const getLatestVersion = async (signal?: AbortSignal): Promise<string> => {
  let primaryError: unknown

  try {
    const response = await fetchData(RELEASE_URL, { signal })
    const normalList = await response.json()
    const version = Array.isArray(normalList) ? normalList[0]?.tag_name : undefined
    if (!isValidVersion(version)) {
      throw new Error('Invalid version in primary release metadata')
    }
    return version
  } catch (err) {
    if (signal?.aborted) return ''
    primaryError = err
    console.warn('Primary version fetch failed, trying backup...', err)
  }

  try {
    const response = await fetchData(`${RELEASE_URL_BACKUP}/latest.yml`, { signal })
    const data = await response.text()
    const r = window.node.yaml.parse(data) as IStringKeyMap
    const version = r?.version
    if (!isValidVersion(version)) {
      throw new Error('Invalid version in backup release metadata')
    }
    return version
  } catch (backupErr) {
    if (signal?.aborted) return ''
    const finalError = new Error('Both primary and backup version fetch failed', {
      cause: { primaryError, backupErr },
    })
    console.error(finalError)
    return ''
  }
}
