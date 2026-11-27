import { randomUUID } from 'node:crypto'
import { finished, pipeline } from 'node:stream/promises'
import { setTimeout as delay } from 'node:timers/promises'

import got, { type OptionsOfTextResponseBody } from 'got'

import UpDownTaskQueue from '../datastore/upDownTaskQueue'
import { transferAccountId, transferScheduler } from '../transferScheduler'
import {
  createDownloadDestination,
  type DownloadDestination,
  DownloadPathError,
  downloadToFile,
  type DownloadTransfer,
  resolveDownloadPath,
} from './downloadFile'
import type { ManageLogger } from './logger'

// Download errors can contain signed URLs, credentials or response bodies. Keep
// task responses and logs limited to a safe reason and an optional system code.
const downloadError = (error: unknown) => ({
  name: 'DownloadError',
  method: 'downloadBucketFile',
  message: error instanceof DownloadPathError ? error.message : 'Download failed',
  ...((error as NodeJS.ErrnoException)?.code && /^[A-Z0-9_]+$/.test((error as NodeJS.ErrnoException).code!)
    ? { code: (error as NodeJS.ErrnoException).code }
    : {}),
})

interface DownloadContext {
  signal: AbortSignal
  createWriteStream: Parameters<DownloadTransfer>[1]
  progress: (percent: number) => void
}

const activeDownloads = new Map<string, Promise<boolean>>()

export async function scheduleDownloadBatch(
  config: IStringKeyMap,
  logger: ManageLogger,
  download: (item: IStringKeyMap, context: DownloadContext) => Promise<void>,
  relativeName: (item: IStringKeyMap) => string = item => item.fileName,
): Promise<boolean> {
  const store = UpDownTaskQueue.getInstance()
  const accountId = transferAccountId(config.provider, config.accountId)
  const jobs = (config.fileArray as IStringKeyMap[]).map(item => {
    const id = randomUUID()
    const sourceId = JSON.stringify([
      accountId,
      item.bucketName,
      item.region,
      config.provider === 'github' ? item.customUrl : undefined,
      item.key,
    ])
    let destination: DownloadDestination
    const task: IDownloadTask = {
      id,
      sourceId,
      accountId: config.accountId,
      provider: config.provider,
      progress: 0,
      status: 'queuing',
      sourceFileName: item.fileName,
    }
    try {
      const fileName = relativeName(item)
      destination = createDownloadDestination(config.downloadPath, fileName, config.downloadConflictPolicy ?? 'rename')
      task.targetFilePath = resolveDownloadPath(destination.root, fileName)
      task.sourceFileName = fileName
    } catch (error) {
      const response = downloadError(error)
      store.addDownloadTask({ ...task, status: 'failed', finishTime: new Date().toLocaleString(), response })
      logger.error(response)
      return false
    }
    const identity = JSON.stringify([sourceId, task.targetFilePath])
    const existing = activeDownloads.get(identity)
    if (existing) return existing
    store.addDownloadTask(task)
    let result: Awaited<ReturnType<typeof downloadToFile>> | undefined
    let failure: ReturnType<typeof downloadError> | undefined
    const completion = transferScheduler
      .schedule({
        kind: 'download',
        id,
        accountId,
        accountConcurrency: config.maxDownloadFileCount,
        signal: config.signal,
        resources: () => ({ slots: 1, memoryBytes: 1024 * 1024 }),
        onStart: () => store.updateDownloadTask({ id, status: 'downloading' }),
        onCancel: () => store.updateDownloadTask({ id, cancelRequested: true }),
        run: async ({ signal, beginCommit }) => {
          try {
            result = await downloadToFile(
              destination,
              (_partPath, createWriteStream) =>
                download(item, {
                  signal,
                  createWriteStream,
                  progress: percent => {
                    if (Number.isFinite(percent) && !signal.aborted)
                      store.updateDownloadTask({ id, progress: Math.max(0, Math.min(99, Math.floor(percent))) })
                  },
                }),
              beginCommit,
            )
          } catch (error) {
            failure = downloadError(error)
            throw error
          }
        },
        onFinish: outcome => {
          store.updateDownloadTask({
            id,
            status: outcome.status,
            progress: outcome.success ? 100 : 0,
            ...(result && { targetFilePath: result.filePath }),
            response: result ? { skipped: result.skipped } : (outcome.status === 'failed' && failure) || outcome,
            finishTime: new Date().toLocaleString(),
          })
          if (outcome.status === 'failed' && failure) logger.error(failure)
        },
      })
      .then(outcome => outcome.success)
      .finally(() => activeDownloads.delete(identity))
    activeDownloads.set(identity, completion)
    return completion
  })
  return (await Promise.all(jobs)).every(Boolean)
}

interface HttpDownload {
  url: string
  headers?: OptionsOfTextResponseBody['headers']
  agent?: OptionsOfTextResponseBody['agent']
  onError?: (error: unknown) => void
}

const retryableStatus = new Set([408, 429, 500, 502, 503, 504])
const retryableNetwork = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'EAI_AGAIN',
  'EPIPE',
  'ERR_STREAM_PREMATURE_CLOSE',
  'ERR_HTTP_CONTENT_LENGTH_MISMATCH',
])

export function scheduleHttpDownloads(
  config: IStringKeyMap,
  logger: ManageLogger,
  prepare: (item: IStringKeyMap, signal: AbortSignal) => HttpDownload | Promise<HttpDownload>,
) {
  return scheduleDownloadBatch(config, logger, async (item, { signal, createWriteStream, progress }) => {
    for (let attempt = 0; ; attempt++) {
      signal.throwIfAborted()
      let request: HttpDownload | undefined
      try {
        request = await prepare(item, signal)
        signal.throwIfAborted()
        const output = createWriteStream()
        try {
          const input = got.stream(request.url, {
            signal,
            headers: request.headers,
            agent: request.agent,
            timeout: { socket: 6000 },
            retry: { limit: 0 },
          })
          input.on('downloadProgress', value => progress(value.percent * 100))
          await pipeline(input, output, { signal })
          return
        } finally {
          output.destroy()
          await finished(output, { cleanup: true }).catch(() => {})
        }
      } catch (error: any) {
        signal.throwIfAborted()
        request?.onError?.(error)
        const status = error?.response?.statusCode ?? error?.response?.status
        const retryable = status >= 400 ? retryableStatus.has(status) : retryableNetwork.has(error?.code)
        if (attempt >= 2 || !retryable) throw error
        const retryAfter = error.response?.headers?.['retry-after']
        const minimumDelay = 250 * 2 ** attempt
        const serverDelay = /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now()
        // Leave long rate limits to a later download instead of retrying before the server permits it.
        if (serverDelay > 60000) throw error
        await delay(Math.max(minimumDelay, serverDelay || 0), undefined, { signal })
      }
    }
  })
}
