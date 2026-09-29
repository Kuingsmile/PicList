import picgo from '@core/picgo'

import type { IConfigStruct } from '~/utils/configPaths'

// Upload rate-limiting state
let runningUploads = 0
const uploadWaitQueue: (() => void)[] = []
let lastUploadFinishTime = 0

export async function withUploadRateLimit<T>(upload: () => Promise<T>): Promise<T> {
  const allConfig = picgo.getConfig<Partial<IConfigStruct>>() || {}
  const maxConcurrency: number = allConfig.settings?.serverMaxConcurrency || 0
  const uploadInterval: number = allConfig.settings?.serverUploadInterval || 0
  if (maxConcurrency > 0) {
    if (runningUploads >= maxConcurrency) {
      await new Promise<void>(resolve => uploadWaitQueue.push(resolve))
    }
    runningUploads++
  }

  if (uploadInterval > 0) {
    const delayMs = uploadInterval - (Date.now() - lastUploadFinishTime)
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  try {
    return await upload()
  } finally {
    if (maxConcurrency > 0) {
      runningUploads--
      const next = uploadWaitQueue.shift()
      if (next) next()
    }
    lastUploadFinishTime = Date.now()
  }
}
